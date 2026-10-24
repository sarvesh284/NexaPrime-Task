import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { seedDemoRatings, cleanDemoRatings, DEMO_USERS, DEMO_RATINGS_DATA } from '../src/scripts/seedDemoRatings';
import { OwnerService } from '../src/services/owner.service';

describe('Demo Ratings Seeding Routine & Integrity', () => {
  it('defines valid demo users with names between 20 and 60 characters and valid roles', () => {
    expect(DEMO_USERS.length).toBeGreaterThanOrEqual(10);

    for (const user of DEMO_USERS) {
      expect(user.name.length).toBeGreaterThanOrEqual(20);
      expect(user.name.length).toBeLessThanOrEqual(60);
      expect(['USER', 'STORE_OWNER']).toContain(user.role);
      expect(user.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    }
  });

  it('contains realistic ratings data with varied star distribution across 1 to 5', () => {
    expect(DEMO_RATINGS_DATA.length).toBeGreaterThan(40);

    const values = DEMO_RATINGS_DATA.map((r) => r.value);
    expect(values).toContain(5);
    expect(values).toContain(4);
    expect(values).toContain(3);
    expect(values).toContain(2);
    expect(values).toContain(1);

    // Verify all comments are within max 500 characters
    for (const r of DEMO_RATINGS_DATA) {
      expect(r.comment.length).toBeLessThanOrEqual(500);
      expect(r.value).toBeGreaterThanOrEqual(1);
      expect(r.value).toBeLessThanOrEqual(5);
    }
  });

  it('guarantees unique user-store rating pairs in seed definition', () => {
    const pairSet = new Set<string>();
    for (const r of DEMO_RATINGS_DATA) {
      const key = `${r.userEmail.toLowerCase()}::${r.storeName}`;
      expect(pairSet.has(key)).toBe(false);
      pairSet.add(key);
    }
  });

  it('executes seeding, recalculates store aggregates, and verifies idempotency', async () => {
    // 1. Initial run of seeding
    await seedDemoRatings();

    // Verify demo users exist in database
    const usersInDb = await UserModel.find({
      email: { $in: DEMO_USERS.map((u) => u.email.toLowerCase()) },
    });
    expect(usersInDb.length).toBe(DEMO_USERS.length);

    // Verify rating count matches
    const totalRatings = await RatingModel.countDocuments({ status: 'VISIBLE' });
    expect(totalRatings).toBeGreaterThanOrEqual(DEMO_RATINGS_DATA.length);

    // Verify that every store aggregate equals the actual ratings in DB
    const stores = await StoreModel.find({ isActive: true });
    for (const store of stores) {
      const actualRatings = await RatingModel.find({ storeId: store._id, status: 'VISIBLE' });
      expect(store.ratingCount).toBe(actualRatings.length);

      if (actualRatings.length > 0) {
        const sum = actualRatings.reduce((acc, curr) => acc + curr.value, 0);
        const expectedAvg = Math.round((sum / actualRatings.length) * 10) / 10;
        expect(store.averageRating).toBe(expectedAvg);
      } else {
        expect(store.averageRating).toBe(0);
      }
    }

    // Verify empty state or low count stores
    const emptyStore1 = await StoreModel.findOne({ name: 'Navi Peth Handcrafted Chaddar & Towels' });
    if (emptyStore1) {
      expect(emptyStore1.ratingCount).toBeGreaterThanOrEqual(0);
      expect(emptyStore1.averageRating).toBeGreaterThanOrEqual(0);
    }

    // 2. Second execution (confirm idempotency)
    await seedDemoRatings();

    const secondRunTotalRatings = await RatingModel.countDocuments({ status: 'VISIBLE' });
    expect(secondRunTotalRatings).toBe(totalRatings);

    const secondRunUsers = await UserModel.countDocuments({
      email: { $in: DEMO_USERS.map((u) => u.email.toLowerCase()) },
    });
    expect(secondRunUsers).toBe(DEMO_USERS.length);

    // 3. Verify Owner Dashboard integration
    const owner = await UserModel.findOne({ email: 'sarvesh.owner@example.com' });
    expect(owner).not.toBeNull();
    if (owner) {
      const dashboard = await OwnerService.getDashboard(owner._id.toString());
      expect(dashboard.totalStores).toBeGreaterThan(0);
      expect(dashboard.totalRatings).toBeGreaterThanOrEqual(DEMO_RATINGS_DATA.length);
      expect(dashboard.averageRating).toBeGreaterThan(0);

      // Verify distribution total equals totalRatings
      const distributionSum = Object.values(dashboard.distribution).reduce((a, b) => a + b, 0);
      expect(distributionSum).toBe(dashboard.totalRatings);
    }

    // 4. Verify logged-in normal user can update an existing rating via API
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'sarvesh.user@example.com',
      password: 'Password@123',
    });
    const userCookie = loginRes.headers['set-cookie'];

    const fcBakery = await StoreModel.findOne({ name: 'FC Road Heritage Bakery & Cafe' });
    expect(fcBakery).not.toBeNull();

    if (fcBakery) {
      // User updates their rating from 5 to 4
      const updateRes = await request(app)
        .put(`/api/v1/stores/${fcBakery._id}/rating`)
        .set('Cookie', userCookie)
        .send({ rating: 4, comment: 'Updated review: Still delicious, tried the Shrewsbury biscuits.' });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);

      // Total ratings for this store should NOT increase
      const updatedStoreRatings = await RatingModel.find({ storeId: fcBakery._id });
      expect(updatedStoreRatings.length).toBe(10); // remains 10, no duplicate created
    }

    // 5. Verify cleanup operation
    await cleanDemoRatings();

    const ratingsAfterClean = await RatingModel.countDocuments({});
    expect(ratingsAfterClean).toBe(0);

    const auxUsersAfterClean = await UserModel.countDocuments({ email: /@demo\.ratelocal\.in$/i });
    expect(auxUsersAfterClean).toBe(0);
  });
});
