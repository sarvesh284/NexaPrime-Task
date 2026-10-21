import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { ReportModel } from '../src/models/report.model';
import { AuditLogModel } from '../src/models/auditLog.model';
import { hashPassword } from '../src/utils/password';

describe('Admin Management & RBAC APIs', () => {
  let adminCookie: string[];
  let ownerCookie: string[];
  let userCookie: string[];
  let adminId: string;
  let testUserId: string;
  let testStoreId: string;
  let testRatingId: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Admin user
    const admin = await UserModel.create({
      name: 'System Admin Platform User',
      email: 'admin.test@example.com',
      address: '100 Admin Parkway, San Francisco, CA',
      passwordHash,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });
    adminId = admin._id.toString();

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.test@example.com',
      password: 'Password@123',
    });
    adminCookie = adminLogin.headers['set-cookie'];

    // Store Owner
    const owner = await UserModel.create({
      name: 'Test Store Owner Account',
      email: 'owner.rbac.test@example.com',
      address: '200 Owner Way, San Jose, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });

    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'owner.rbac.test@example.com',
      password: 'Password@123',
    });
    ownerCookie = ownerLogin.headers['set-cookie'];

    // Normal User
    const user = await UserModel.create({
      name: 'Test Normal Consumer User',
      email: 'user.rbac.test@example.com',
      address: '300 Consumer Street, Oakland, CA',
      passwordHash,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });
    testUserId = user._id.toString();

    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'user.rbac.test@example.com',
      password: 'Password@123',
    });
    userCookie = userLogin.headers['set-cookie'];

    // Test Store
    const store = await StoreModel.create({
      name: 'RBAC Test Market',
      address: '500 Market St, San Francisco, CA',
      category: 'Groceries',
      city: 'San Francisco',
      ownerId: owner._id,
      isActive: true,
      averageRating: 5,
      ratingCount: 1,
    });
    testStoreId = store._id.toString();

    // Test Rating
    const rating = await RatingModel.create({
      userId: user._id,
      storeId: store._id,
      value: 5,
      comment: 'Initial review for moderation testing',
      status: 'VISIBLE',
      helpfulVotes: [],
      helpfulCount: 0,
    });
    testRatingId = rating._id.toString();
  });

  it('denies unauthenticated users from accessing admin endpoints', async () => {
    const res = await request(app).get('/api/v1/admin/kpis');
    expect(res.status).toBe(401);
  });

  it('denies normal users from accessing admin endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/kpis')
      .set('Cookie', userCookie);
    expect(res.status).toBe(403);
  });

  it('denies store owners from accessing admin endpoints', async () => {
    const res = await request(app)
      .get('/api/v1/admin/kpis')
      .set('Cookie', ownerCookie);
    expect(res.status).toBe(403);
  });

  it('allows authorized admins to view platform KPIs', async () => {
    const res = await request(app)
      .get('/api/v1/admin/kpis')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kpis).toBeDefined();
    expect(res.body.data.kpis.totalUsers).toBeGreaterThanOrEqual(1);
    expect(res.body.data.kpis.totalStoreOwners).toBeGreaterThanOrEqual(1);
    expect(res.body.data.kpis.totalActiveStores).toBeGreaterThanOrEqual(1);
  });

  it('allows admin to list and search users with filters', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?role=USER&search=Consumer')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBe(1);
    expect(res.body.data.users[0].email).toBe('user.rbac.test@example.com');
  });

  it('allows admin to toggle user account status and prevents self-deactivation', async () => {
    // 1. Deactivate test user
    const deactRes = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/status`)
      .set('Cookie', adminCookie);

    expect(deactRes.status).toBe(200);
    expect(deactRes.body.data.isActive).toBe(false);

    // 2. Self deactivation should be rejected
    const selfRes = await request(app)
      .patch(`/api/v1/admin/users/${adminId}/status`)
      .set('Cookie', adminCookie);

    expect(selfRes.status).toBe(400);

    // 3. Reactivate user
    const reactRes = await request(app)
      .patch(`/api/v1/admin/users/${testUserId}/status`)
      .set('Cookie', adminCookie);

    expect(reactRes.status).toBe(200);
    expect(reactRes.body.data.isActive).toBe(true);
  });

  it('allows admin to create a new store and updates audit logs', async () => {
    const newStore = {
      name: 'Admin Created Superstore',
      email: 'adminstore@example.com',
      address: '777 Commerce Blvd, San Francisco, CA',
      category: 'Electronics',
      city: 'San Francisco',
    };

    const res = await request(app)
      .post('/api/v1/admin/stores')
      .set('Cookie', adminCookie)
      .send(newStore);

    expect(res.status).toBe(201);
    expect(res.body.data.store.name).toBe(newStore.name);

    // Verify audit log entry
    const log = await AuditLogModel.findOne({ action: 'CREATE_STORE' });
    expect(log).toBeDefined();
    expect(log?.actorRole).toBe('ADMIN');
  });

  it('moderates reported review by hiding it and updating store statistics', async () => {
    // Create report
    const report = await ReportModel.create({
      ratingId: testRatingId,
      reporterId: testUserId,
      reason: 'SPAM',
      details: 'Spammy content test',
      status: 'PENDING',
    });

    const res = await request(app)
      .post(`/api/v1/admin/reports/${report._id}/moderate`)
      .set('Cookie', adminCookie)
      .send({ action: 'HIDE_REVIEW', notes: 'Contains promotional spam' });

    expect(res.status).toBe(200);
    expect(res.body.data.reportStatus).toBe('RESOLVED_HIDDEN');
    expect(res.body.data.ratingStatus).toBe('HIDDEN');

    // Store stats should now reflect 0 visible ratings
    const updatedStore = await StoreModel.findById(testStoreId);
    expect(updatedStore?.ratingCount).toBe(0);
    expect(updatedStore?.averageRating).toBe(0);
  });
});
