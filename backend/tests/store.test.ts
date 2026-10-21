import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { hashPassword } from '../src/utils/password';

describe('Store Discovery & Listing APIs', () => {
  let ownerId: string;
  let user1Cookie: string[];
  let store1Id: string;
  let store2Id: string;
  let inactiveStoreId: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Create Owner
    const owner = await UserModel.create({
      name: 'Owner Representative Account',
      email: 'store.test.owner@example.com',
      address: '100 Business Center Road, San Francisco, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
    });
    ownerId = owner._id.toString();

    // Create Normal User
    const userRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Customer Customer',
      email: 'store.test.customer@example.com',
      password: 'Password@123',
      address: '200 Residential Blvd, Apt 1A, Oakland, CA',
    });
    user1Cookie = userRes.headers['set-cookie'];
    const user1Id = userRes.body.data.user.id;

    // Create Stores
    const store1 = await StoreModel.create({
      name: 'Apex Supermarket & Grocery Store',
      address: '123 Market St, San Francisco, CA',
      ownerId,
      isActive: true,
    });
    store1Id = store1._id.toString();

    const store2 = await StoreModel.create({
      name: 'Beacon Books and Publishing',
      address: '456 Literary Ave, Berkeley, CA',
      ownerId,
      isActive: true,
    });
    store2Id = store2._id.toString();

    const inactiveStore = await StoreModel.create({
      name: 'Closed Vintage Thrift Shop',
      address: '789 Forgotten Way, San Jose, CA',
      ownerId,
      isActive: false,
    });
    inactiveStoreId = inactiveStore._id.toString();

    // Create rating for store1
    await RatingModel.create({
      userId: user1Id,
      storeId: store1Id,
      value: 5,
    });
  });

  it('retrieves paginated active stores and excludes inactive stores', async () => {
    const res = await request(app).get('/api/v1/stores');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.stores.length).toBe(2);

    const names = res.body.data.stores.map((s: any) => s.name);
    expect(names).toContain('Apex Supermarket & Grocery Store');
    expect(names).toContain('Beacon Books and Publishing');
    expect(names).not.toContain('Closed Vintage Thrift Shop');
  });

  it('correctly returns store average rating, rating count, and zero-rating state', async () => {
    const res = await request(app).get('/api/v1/stores');
    const store1 = res.body.data.stores.find((s: any) => s.id === store1Id);
    const store2 = res.body.data.stores.find((s: any) => s.id === store2Id);

    expect(store1.averageRating).toBe(5);
    expect(store1.ratingCount).toBe(1);

    // store2 has no ratings -> zero-rating state
    expect(store2.averageRating).toBe(0);
    expect(store2.ratingCount).toBe(0);
  });

  it('attaches the authenticated user personal rating when logged in', async () => {
    const res = await request(app)
      .get('/api/v1/stores')
      .set('Cookie', user1Cookie);

    const store1 = res.body.data.stores.find((s: any) => s.id === store1Id);
    const store2 = res.body.data.stores.find((s: any) => s.id === store2Id);

    expect(store1.myRating).toBe(5);
    expect(store2.myRating).toBeNull();
  });

  it('supports searching stores by name', async () => {
    const res = await request(app).get('/api/v1/stores?search=Apex');
    expect(res.status).toBe(200);
    expect(res.body.data.stores.length).toBe(1);
    expect(res.body.data.stores[0].name).toBe('Apex Supermarket & Grocery Store');
  });

  it('supports sorting stores by name and ratings', async () => {
    const res = await request(app).get('/api/v1/stores?sort=name&order=desc');
    expect(res.status).toBe(200);
    expect(res.body.data.stores[0].name).toBe('Beacon Books and Publishing');
  });

  it('retrieves a single store by ID', async () => {
    const res = await request(app).get(`/api/v1/stores/${store1Id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.store.id).toBe(store1Id);
    expect(res.body.data.store.averageRating).toBe(5);
  });

  it('returns 404 for an inactive or non-existent store', async () => {
    const res = await request(app).get(`/api/v1/stores/${inactiveStoreId}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for an invalid ObjectId format', async () => {
    const res = await request(app).get('/api/v1/stores/invalid-id-123');
    expect(res.status).toBe(400);
  });
});
