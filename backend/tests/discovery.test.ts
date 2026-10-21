import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { hashPassword } from '../src/utils/password';

describe('Discovery, Favorites & Analytics APIs', () => {
  let userCookie: string[];
  let ownerCookie: string[];
  let store1Id: string;
  let store2Id: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Owner
    const owner = await UserModel.create({
      name: 'Discovery Store Owner Demo',
      email: 'owner.disc@example.com',
      address: '100 Discovery Way, San Jose, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      tokenVersion: 0,
    });

    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'owner.disc@example.com',
      password: 'Password@123',
    });
    ownerCookie = ownerLogin.headers['set-cookie'];

    // Normal User
    const user = await UserModel.create({
      name: 'Discovery Consumer Customer',
      email: 'user.disc@example.com',
      address: '200 Discovery Blvd, San Francisco, CA',
      passwordHash,
      role: 'USER',
      isActive: true,
      tokenVersion: 0,
    });

    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'user.disc@example.com',
      password: 'Password@123',
    });
    userCookie = userLogin.headers['set-cookie'];

    // Stores
    const store1 = await StoreModel.create({
      name: 'Artisan Gourmet Bakery',
      address: '100 Baker St, San Francisco, CA',
      category: 'Bakery',
      city: 'San Francisco',
      ownerId: owner._id,
      isActive: true,
      averageRating: 5,
      ratingCount: 1,
    });
    store1Id = store1._id.toString();

    const store2 = await StoreModel.create({
      name: 'Valley Organic Foods',
      address: '200 Organic Way, San Jose, CA',
      category: 'Groceries',
      city: 'San Jose',
      ownerId: owner._id,
      isActive: true,
      averageRating: 4,
      ratingCount: 1,
    });
    store2Id = store2._id.toString();

    // Rating for Store 1 with potentially dangerous formula in comment
    await RatingModel.create({
      userId: user._id,
      storeId: store1._id,
      value: 5,
      comment: '=cmd|/c calc!A0', // Test formula injection sanitization in CSV
      status: 'VISIBLE',
      helpfulVotes: [],
      helpfulCount: 0,
    });
  });

  it('filters stores by category and city', async () => {
    const res = await request(app).get('/api/v1/stores?category=Bakery&city=San Francisco');
    expect(res.status).toBe(200);
    expect(res.body.data.stores.length).toBe(1);
    expect(res.body.data.stores[0].name).toBe('Artisan Gourmet Bakery');
  });

  it('retrieves distinct filter categories and cities', async () => {
    const res = await request(app).get('/api/v1/stores/filter-options');
    expect(res.status).toBe(200);
    expect(res.body.data.categories).toContain('Bakery');
    expect(res.body.data.categories).toContain('Groceries');
    expect(res.body.data.cities).toContain('San Francisco');
    expect(res.body.data.cities).toContain('San Jose');
  });

  it('allows authenticated user to toggle favorites and retrieve favorite stores', async () => {
    // 1. Add Store 1 to favorites
    const addRes = await request(app)
      .post(`/api/v1/stores/${store1Id}/favorite`)
      .set('Cookie', userCookie);

    expect(addRes.status).toBe(200);
    expect(addRes.body.data.isFavorite).toBe(true);

    // 2. Retrieve user favorites
    const listRes = await request(app)
      .get('/api/v1/stores/favorites')
      .set('Cookie', userCookie);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.favorites.length).toBe(1);
    expect(listRes.body.data.favorites[0].id).toBe(store1Id);

    // 3. Remove Store 1 from favorites
    const removeRes = await request(app)
      .post(`/api/v1/stores/${store1Id}/favorite`)
      .set('Cookie', userCookie);

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.data.isFavorite).toBe(false);
  });

  it('returns advanced analytics with daily trends for store owner', async () => {
    const res = await request(app)
      .get('/api/v1/owner/analytics')
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.analytics.totalStores).toBe(2);
    expect(res.body.data.analytics.dailyTrends).toBeDefined();
    expect(res.body.data.analytics.storeComparisons).toBeDefined();
  });

  it('exports owner ratings as CSV with spreadsheet formula injection protection', async () => {
    const res = await request(app)
      .get('/api/v1/owner/ratings/export')
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    // Formula starting with = should be prefixed with ' to prevent spreadsheet execution
    expect(res.text).toContain("'=cmd|/c calc!A0");
  });
});
