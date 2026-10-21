import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { hashPassword } from '../src/utils/password';

describe('Store Owner Analytics & Ratings APIs', () => {
  let owner1Cookie: string[];
  let userCookie: string[];
  let owner1StoreId: string;
  let owner2StoreId: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Owner 1
    const owner1 = await UserModel.create({
      name: 'First Store Enterprise Owner',
      email: 'owner.test.first@example.com',
      address: '100 Business Center Road, San Francisco, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
    });
    const owner1Login = await request(app).post('/api/v1/auth/login').send({
      email: 'owner.test.first@example.com',
      password: 'Password@123',
    });
    owner1Cookie = owner1Login.headers['set-cookie'];

    // Owner 2
    const owner2 = await UserModel.create({
      name: 'Second Store Enterprise Owner',
      email: 'owner.test.second@example.com',
      address: '200 Business Boulevard, San Jose, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
    });

    // Normal User
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Customer Customer',
      email: 'owner.test.customer@example.com',
      password: 'Password@123',
      address: '200 Residential Blvd, Apt 1A, Oakland, CA',
    });
    userCookie = userRes.headers['set-cookie'];
    const userId = userRes.body.data.user.id;

    // Stores
    const store1 = await StoreModel.create({
      name: 'First Premier Retail Outlet',
      address: '101 Market St, San Francisco, CA',
      ownerId: owner1._id,
      isActive: true,
    });
    owner1StoreId = store1._id.toString();

    const store2 = await StoreModel.create({
      name: 'Second Premier Retail Outlet',
      address: '202 Mission St, San Jose, CA',
      ownerId: owner2._id,
      isActive: true,
    });
    owner2StoreId = store2._id.toString();

    // Rating for Owner 1's store
    await RatingModel.create({
      userId,
      storeId: store1._id,
      value: 5,
    });

    // Rating for Owner 2's store
    await RatingModel.create({
      userId,
      storeId: store2._id,
      value: 3,
    });
  });

  it('allows store owner to view dashboard aggregating only their own stores', async () => {
    const res = await request(app)
      .get('/api/v1/owner/dashboard')
      .set('Cookie', owner1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.dashboard.totalStores).toBe(1);
    expect(res.body.data.dashboard.totalRatings).toBe(1);
    expect(res.body.data.dashboard.averageRating).toBe(5);
    expect(res.body.data.dashboard.stores[0].id).toBe(owner1StoreId);
  });

  it('denies normal users from accessing owner dashboard', async () => {
    const res = await request(app)
      .get('/api/v1/owner/dashboard')
      .set('Cookie', userCookie);

    expect(res.status).toBe(403);
  });

  it('allows owner to view customer ratings list with customer name and email', async () => {
    const res = await request(app)
      .get('/api/v1/owner/ratings')
      .set('Cookie', owner1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.ratings.length).toBe(1);
    expect(res.body.data.ratings[0].rating).toBe(5);
    expect(res.body.data.ratings[0].user.email).toBe('owner.test.customer@example.com');
    expect(res.body.data.ratings[0].user.name).toBe('Regular Customer Customer');
    expect(res.body.data.ratings[0].store.name).toBe('First Premier Retail Outlet');
  });

  it('denies an owner from viewing ratings for another owner store via storeId filter', async () => {
    const res = await request(app)
      .get(`/api/v1/owner/ratings?storeId=${owner2StoreId}`)
      .set('Cookie', owner1Cookie);

    expect(res.status).toBe(403);
  });
});
