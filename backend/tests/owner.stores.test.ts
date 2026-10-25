import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { hashPassword } from '../src/utils/password';

describe('Store Owner Store Management (CRUD) APIs', () => {
  let owner1Cookie: string[];
  let owner2Cookie: string[];
  let userCookie: string[];
  let owner1Id: string;
  let owner2Id: string;
  let userId: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Owner 1
    const owner1 = await UserModel.create({
      name: 'Rajesh Patil Merchant',
      email: 'rajesh.owner@example.com',
      address: 'Shop 4, Ferguson College Road, Deccan Gymkhana, Pune, Maharashtra 411004',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
    });
    owner1Id = owner1._id.toString();

    const owner1Login = await request(app).post('/api/v1/auth/login').send({
      email: 'rajesh.owner@example.com',
      password: 'Password@123',
    });
    owner1Cookie = owner1Login.headers['set-cookie'];

    // Owner 2
    const owner2 = await UserModel.create({
      name: 'Suresh Deshmukh Retailer',
      email: 'suresh.owner@example.com',
      address: 'Shop 12, FC Road, Shivajinagar, Pune, Maharashtra 411005',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
    });
    owner2Id = owner2._id.toString();

    const owner2Login = await request(app).post('/api/v1/auth/login').send({
      email: 'suresh.owner@example.com',
      password: 'Password@123',
    });
    owner2Cookie = owner2Login.headers['set-cookie'];

    // Customer User
    const user = await UserModel.create({
      name: 'Aditi Joshi Customer',
      email: 'aditi.customer@example.com',
      address: 'Flat 102, Shaniwar Peth, Pune, Maharashtra 411030',
      passwordHash,
      role: 'USER',
      isActive: true,
    });
    userId = user._id.toString();

    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'aditi.customer@example.com',
      password: 'Password@123',
    });
    userCookie = userLogin.headers['set-cookie'];
  });

  describe('POST /api/v1/owner/stores (Create Store)', () => {
    it('allows a Store Owner to create a store and derives ownerId from session', async () => {
      const res = await request(app)
        .post('/api/v1/owner/stores')
        .set('Cookie', owner1Cookie)
        .send({
          name: 'Patil Sweets and Bakers',
          description: 'Traditional handcrafted sweets and baked delicacies',
          category: 'Bakery',
          address: '42 Deccan Gymkhana, FC Road, Pune',
          city: 'Pune',
          state: 'Maharashtra',
          phone: '+91 98220 12345',
          email: 'contact@patilsweets.com',
          website: 'https://patilsweets.in',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store).toBeDefined();
      expect(res.body.data.store.name).toBe('Patil Sweets and Bakers');

      // Verify in MongoDB database that ownerId was set to owner1
      const dbStore = await StoreModel.findById(res.body.data.store.id);
      expect(dbStore).toBeDefined();
      expect(dbStore?.ownerId?.toString()).toBe(owner1Id);
      expect(dbStore?.isActive).toBe(true);
      expect(dbStore?.ratingCount).toBe(0);
      expect(dbStore?.averageRating).toBe(0);
    });

    it('rejects attempt to spoof ownerId in payload and always binds authenticated owner', async () => {
      const res = await request(app)
        .post('/api/v1/owner/stores')
        .set('Cookie', owner1Cookie)
        .send({
          name: 'Security Test Store',
          category: 'Retail',
          address: '100 Security Boulevard, Pune',
          city: 'Pune',
          ownerId: owner2Id, // Attempt to assign to another owner
        });

      expect(res.status).toBe(201);
      const dbStore = await StoreModel.findById(res.body.data.store.id);
      expect(dbStore?.ownerId?.toString()).toBe(owner1Id); // MUST be owner1, never owner2
    });

    it('rejects store creation with missing required fields or invalid data', async () => {
      // Missing name
      const res1 = await request(app)
        .post('/api/v1/owner/stores')
        .set('Cookie', owner1Cookie)
        .send({
          address: 'Valid Address Pune',
          city: 'Pune',
        });
      expect(res1.status).toBe(400);

      // Name too short (< 3 chars)
      const res2 = await request(app)
        .post('/api/v1/owner/stores')
        .set('Cookie', owner1Cookie)
        .send({
          name: 'AB',
          address: 'Valid Address Pune',
          city: 'Pune',
        });
      expect(res2.status).toBe(400);

      // Address too short (< 5 chars)
      const res3 = await request(app)
        .post('/api/v1/owner/stores')
        .set('Cookie', owner1Cookie)
        .send({
          name: 'Valid Store Name',
          address: 'Pune',
          city: 'Pune',
        });
      expect(res3.status).toBe(400);
    });

    it('denies customer USER role from creating a store (HTTP 403)', async () => {
      const res = await request(app)
        .post('/api/v1/owner/stores')
        .set('Cookie', userCookie)
        .send({
          name: 'Unauthorized Customer Store',
          address: '123 Customer Lane, Pune',
          category: 'Retail',
          city: 'Pune',
        });

      expect(res.status).toBe(403);
    });

    it('denies unauthenticated requests from creating a store (HTTP 401)', async () => {
      const res = await request(app)
        .post('/api/v1/owner/stores')
        .send({
          name: 'Anonymous Store',
          address: '123 Anonymous Lane, Pune',
          category: 'Retail',
          city: 'Pune',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/owner/stores (List Owner Stores)', () => {
    beforeEach(async () => {
      await StoreModel.create([
        {
          name: 'Patil Deccan Sweets',
          address: '42 Deccan Gymkhana, Pune',
          category: 'Sweets',
          city: 'Pune',
          ownerId: owner1Id,
          isActive: true,
        },
        {
          name: 'Patil Kothrud Cafe',
          address: '15 Paud Road, Kothrud, Pune',
          category: 'Cafe',
          city: 'Pune',
          ownerId: owner1Id,
          isActive: true,
        },
        {
          name: 'Deshmukh Electronics',
          address: '88 Laxmi Road, Pune',
          category: 'Electronics',
          city: 'Pune',
          ownerId: owner2Id,
          isActive: true,
        },
      ]);
    });

    it('returns only stores belonging to the authenticated owner', async () => {
      const res = await request(app)
        .get('/api/v1/owner/stores')
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stores).toHaveLength(2);
      expect(res.body.data.stores.map((s: any) => s.name)).toContain('Patil Deccan Sweets');
      expect(res.body.data.stores.map((s: any) => s.name)).toContain('Patil Kothrud Cafe');
      expect(res.body.data.stores.map((s: any) => s.name)).not.toContain('Deshmukh Electronics');
    });

    it('supports search and category filtering for owner stores', async () => {
      const resSearch = await request(app)
        .get('/api/v1/owner/stores?search=Cafe')
        .set('Cookie', owner1Cookie);

      expect(resSearch.status).toBe(200);
      expect(resSearch.body.data.stores).toHaveLength(1);
      expect(resSearch.body.data.stores[0].name).toBe('Patil Kothrud Cafe');

      const resCategory = await request(app)
        .get('/api/v1/owner/stores?category=Sweets')
        .set('Cookie', owner1Cookie);

      expect(resCategory.status).toBe(200);
      expect(resCategory.body.data.stores).toHaveLength(1);
      expect(resCategory.body.data.stores[0].name).toBe('Patil Deccan Sweets');
    });

    it('denies customer USER role from viewing owner store list (HTTP 403)', async () => {
      const res = await request(app)
        .get('/api/v1/owner/stores')
        .set('Cookie', userCookie);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/owner/stores/:id (Get Store Details)', () => {
    let store1Id: string;
    let store2Id: string;

    beforeEach(async () => {
      const s1 = await StoreModel.create({
        name: 'Patil Specialty Sweets',
        address: '42 Deccan Gymkhana, Pune',
        category: 'Sweets',
        city: 'Pune',
        ownerId: owner1Id,
        isActive: true,
      });
      store1Id = s1._id.toString();

      const s2 = await StoreModel.create({
        name: 'Deshmukh Electronics World',
        address: '88 Laxmi Road, Pune',
        category: 'Electronics',
        city: 'Pune',
        ownerId: owner2Id,
        isActive: true,
      });
      store2Id = s2._id.toString();
    });

    it('allows owner to retrieve details of their own store', async () => {
      const res = await request(app)
        .get(`/api/v1/owner/stores/${store1Id}`)
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store.id).toBe(store1Id);
      expect(res.body.data.store.name).toBe('Patil Specialty Sweets');
    });

    it('denies owner from viewing another owner store (HTTP 403)', async () => {
      const res = await request(app)
        .get(`/api/v1/owner/stores/${store2Id}`)
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(403);
    });

    it('returns 404 when store ID does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/v1/owner/stores/${fakeId}`)
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(404);
    });

    it('returns 400 for invalid ObjectId format', async () => {
      const res = await request(app)
        .get('/api/v1/owner/stores/invalid-id-123')
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/owner/stores/:id & PUT /api/v1/owner/stores/:id (Update Store)', () => {
    let store1Id: string;
    let store2Id: string;

    beforeEach(async () => {
      const s1 = await StoreModel.create({
        name: 'Original Store Name',
        address: '100 FC Road, Pune',
        category: 'Retail',
        city: 'Pune',
        phone: '1234567890',
        ownerId: owner1Id,
        isActive: true,
        averageRating: 4.8,
        ratingCount: 25,
      });
      store1Id = s1._id.toString();

      const s2 = await StoreModel.create({
        name: 'Another Owner Store',
        address: '200 FC Road, Pune',
        category: 'Retail',
        city: 'Pune',
        ownerId: owner2Id,
        isActive: true,
      });
      store2Id = s2._id.toString();
    });

    it('allows owner to update editable fields of their store', async () => {
      const res = await request(app)
        .patch(`/api/v1/owner/stores/${store1Id}`)
        .set('Cookie', owner1Cookie)
        .send({
          name: 'Updated Store Name Premium',
          description: 'Updated fresh description',
          phone: '+91 99999 88888',
          website: 'https://updated-store.com',
          category: 'Boutique',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.store.name).toBe('Updated Store Name Premium');
      expect(res.body.data.store.description).toBe('Updated fresh description');
      expect(res.body.data.store.phone).toBe('+91 99999 88888');

      // Verify DB persistence
      const dbStore = await StoreModel.findById(store1Id);
      expect(dbStore?.name).toBe('Updated Store Name Premium');
      expect(dbStore?.category).toBe('Boutique');
      // Verify rating aggregates and ownership were untouched
      expect(dbStore?.ownerId?.toString()).toBe(owner1Id);
      expect(dbStore?.averageRating).toBe(4.8);
      expect(dbStore?.ratingCount).toBe(25);
    });

    it('denies owner from updating another owner store (HTTP 403)', async () => {
      const res = await request(app)
        .patch(`/api/v1/owner/stores/${store2Id}`)
        .set('Cookie', owner1Cookie)
        .send({
          name: 'Hacked Name',
        });

      expect(res.status).toBe(403);
    });

    it('prevents tampering with protected fields such as ownerId and rating aggregates', async () => {
      const res = await request(app)
        .patch(`/api/v1/owner/stores/${store1Id}`)
        .set('Cookie', owner1Cookie)
        .send({
          name: 'Clean Name',
          ownerId: owner2Id,
          averageRating: 1.0,
          ratingCount: 0,
        });

      expect(res.status).toBe(200);
      const dbStore = await StoreModel.findById(store1Id);
      expect(dbStore?.ownerId?.toString()).toBe(owner1Id);
      expect(dbStore?.averageRating).toBe(4.8);
      expect(dbStore?.ratingCount).toBe(25);
    });
  });

  describe('DELETE /api/v1/owner/stores/:id (Soft-Delete / Archive Store)', () => {
    let store1Id: string;
    let store2Id: string;

    beforeEach(async () => {
      const s1 = await StoreModel.create({
        name: 'Store To Be Archived',
        address: '55 JM Road, Pune',
        category: 'Food',
        city: 'Pune',
        ownerId: owner1Id,
        isActive: true,
      });
      store1Id = s1._id.toString();

      // Create a customer rating for this store to verify referential integrity
      await RatingModel.create({
        storeId: s1._id,
        userId: userId,
        value: 5,
        comment: 'Outstanding food and service!',
        status: 'VISIBLE',
      });

      const s2 = await StoreModel.create({
        name: 'Store Of Another Owner',
        address: '77 JM Road, Pune',
        category: 'Food',
        city: 'Pune',
        ownerId: owner2Id,
        isActive: true,
      });
      store2Id = s2._id.toString();
    });

    it('soft-deletes the store by setting isActive: false and preserving ratings', async () => {
      const res = await request(app)
        .delete(`/api/v1/owner/stores/${store1Id}`)
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // 1. Verify store in DB has isActive: false
      const dbStore = await StoreModel.findById(store1Id);
      expect(dbStore).toBeDefined();
      expect(dbStore?.isActive).toBe(false);

      // 2. Verify rating history in RatingModel is untouched
      const rating = await RatingModel.findOne({ storeId: store1Id });
      expect(rating).toBeDefined();
      expect(rating?.value).toBe(5);
      expect(rating?.comment).toBe('Outstanding food and service!');

      // 3. Verify public store discovery excludes the soft-deleted store
      const publicStoresRes = await request(app).get('/api/v1/stores');
      expect(publicStoresRes.status).toBe(200);
      const publicIds = publicStoresRes.body.data.stores.map((s: any) => s.id);
      expect(publicIds).not.toContain(store1Id);
    });

    it('denies owner from deleting another owner store (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/owner/stores/${store2Id}`)
        .set('Cookie', owner1Cookie);

      expect(res.status).toBe(403);

      const dbStore = await StoreModel.findById(store2Id);
      expect(dbStore?.isActive).toBe(true);
    });

    it('denies customer USER role from deleting a store (HTTP 403)', async () => {
      const res = await request(app)
        .delete(`/api/v1/owner/stores/${store1Id}`)
        .set('Cookie', userCookie);

      expect(res.status).toBe(403);
    });
  });
});
