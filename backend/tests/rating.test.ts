import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { hashPassword } from '../src/utils/password';

describe('Rating Management APIs', () => {
  let userCookie: string[];
  let ownerCookie: string[];
  let storeId: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Create Owner
    const owner = await UserModel.create({
      name: 'Owner Representative Account',
      email: 'rating.test.owner@example.com',
      address: '100 Business Center Road, San Francisco, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
    });

    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'rating.test.owner@example.com',
      password: 'Password@123',
    });
    ownerCookie = ownerLogin.headers['set-cookie'];

    // Create Normal User
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Customer Customer',
      email: 'rating.test.customer@example.com',
      password: 'Password@123',
      address: '200 Residential Blvd, Apt 1A, Oakland, CA',
    });
    userCookie = userRes.headers['set-cookie'];

    // Create Store
    const store = await StoreModel.create({
      name: 'Central Plaza Department Store',
      address: '100 Market St, San Francisco, CA',
      ownerId: owner._id,
      isActive: true,
    });
    storeId = store._id.toString();
  });

  it('submits a valid rating of 5 and recalculates store statistics', async () => {
    const res = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rating.value).toBe(5);
    expect(res.body.data.storeStats.averageRating).toBe(5);
    expect(res.body.data.storeStats.ratingCount).toBe(1);

    const countInDb = await RatingModel.countDocuments({ storeId });
    expect(countInDb).toBe(1);
  });

  it('updates an existing rating without creating a duplicate rating document', async () => {
    // Initial rating: 4
    await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 4 });

    // Update rating: 2
    const updateRes = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 2 });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.rating.value).toBe(2);
    expect(updateRes.body.data.storeStats.averageRating).toBe(2);
    expect(updateRes.body.data.storeStats.ratingCount).toBe(1);

    const countInDb = await RatingModel.countDocuments({ storeId });
    expect(countInDb).toBe(1);
  });

  it('rejects invalid rating values including fractions, 0, strings, and values > 5', async () => {
    // Fraction (3.5)
    const res1 = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 3.5 });
    expect(res1.status).toBe(400);

    // Zero (0)
    const res2 = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 0 });
    expect(res2.status).toBe(400);

    // Greater than 5 (6)
    const res3 = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 6 });
    expect(res3.status).toBe(400);

    // String ("5")
    const res4 = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: '5' });
    expect(res4.status).toBe(400);
  });

  it('denies rating submission for unauthenticated users', async () => {
    const res = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .send({ rating: 5 });

    expect(res.status).toBe(401);
  });

  it('denies rating submission for STORE_OWNER role users', async () => {
    const res = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', ownerCookie)
      .send({ rating: 5 });

    expect(res.status).toBe(403);
  });

  it('retrieves user personal rating for a store via GET /my-rating', async () => {
    await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', userCookie)
      .send({ rating: 4 });

    const res = await request(app)
      .get(`/api/v1/stores/${storeId}/my-rating`)
      .set('Cookie', userCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.myRating).toBe(4);
  });
});
