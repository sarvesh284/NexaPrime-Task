import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { NotificationModel } from '../src/models/notification.model';
import { hashPassword } from '../src/utils/password';

describe('Extended Platform Features (Owner Replies, History, Notifications, Trending, Analytics, Login History)', () => {
  let owner1Cookie: string[];
  let owner2Cookie: string[];
  let userCookie: string[];
  let owner1StoreId: string;
  let owner2StoreId: string;
  let ratingId: string;
  let userId: string;
  let owner1Id: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Owner 1
    const owner1 = await UserModel.create({
      name: 'First Enterprise Store Owner Account',
      email: 'owner1.extended@example.com',
      address: '200 Business Way, San Francisco, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      isEmailVerified: true,
    });
    owner1Id = owner1._id.toString();
    const owner1Login = await request(app).post('/api/v1/auth/login').send({
      email: 'owner1.extended@example.com',
      password: 'Password@123',
    });
    owner1Cookie = owner1Login.headers['set-cookie'];

    // Owner 2
    await UserModel.create({
      name: 'Second Enterprise Store Owner Account',
      email: 'owner2.extended@example.com',
      address: '300 Commerce Street, San Jose, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      isEmailVerified: true,
    });
    const owner2Login = await request(app).post('/api/v1/auth/login').send({
      email: 'owner2.extended@example.com',
      password: 'Password@123',
    });
    owner2Cookie = owner2Login.headers['set-cookie'];

    // Normal User
    const user = await UserModel.create({
      name: 'Consumer Normal Rating User Account',
      email: 'user.extended@example.com',
      address: '400 Consumer Blvd, Oakland, CA',
      passwordHash,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    });
    userId = user._id.toString();
    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'user.extended@example.com',
      password: 'Password@123',
    });
    userCookie = userLogin.headers['set-cookie'];

    // Stores
    const store1 = await StoreModel.create({
      name: 'Grand Bay Bakery & Coffee',
      email: 'contact@grandbaybakery.com',
      address: '101 Bay Street, San Francisco, CA',
      category: 'Food & Beverage',
      city: 'San Francisco',
      ownerId: owner1._id,
      isActive: true,
      coordinates: { lat: 37.7749, lng: -122.4194 },
    });
    owner1StoreId = store1._id.toString();

    const store2 = await StoreModel.create({
      name: 'Silicon Valley Components',
      email: 'sales@svcomponents.com',
      address: '202 Tech Row, San Jose, CA',
      category: 'Electronics',
      city: 'San Jose',
      ownerId: owner1._id,
      isActive: true,
      coordinates: { lat: 37.3382, lng: -121.8863 },
    });
    owner2StoreId = store2._id.toString();

    // User submits rating on Store 1
    const ratingRes = await request(app)
      .put(`/api/v1/stores/${owner1StoreId}/rating`)
      .set('Cookie', userCookie)
      .send({
        rating: 5,
        comment: 'Freshly baked pastries and fantastic coffee ambiance!',
      });
    ratingId = ratingRes.body.data.rating.id;
  });

  it('allows store owner to reply to a review on their own store and notifies reviewer', async () => {
    const replyRes = await request(app)
      .post(`/api/v1/owner/ratings/${ratingId}/reply`)
      .set('Cookie', owner1Cookie)
      .send({ reply: 'Thank you for supporting our bakery! We hope to see you again soon.' });

    expect(replyRes.status).toBe(200);
    expect(replyRes.body.data.ownerReply.text).toContain('Thank you for supporting');

    // Verify reviewer received an in-app notification (N1)
    const notifRes = await request(app)
      .get('/api/v1/notifications')
      .set('Cookie', userCookie);

    expect(notifRes.status).toBe(200);
    expect(notifRes.body.data.notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifRes.body.data.notifications[0].type).toBe('REVIEW_REPLY');
    expect(notifRes.body.data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('denies an owner from replying to a review belonging to another owner store', async () => {
    const unauthorizedReplyRes = await request(app)
      .post(`/api/v1/owner/ratings/${ratingId}/reply`)
      .set('Cookie', owner2Cookie)
      .send({ reply: 'Unauthorized reply attempt from a different owner' });

    expect(unauthorizedReplyRes.status).toBe(403);
  });

  it('allows owner to delete their reply', async () => {
    // Post reply first
    await request(app)
      .post(`/api/v1/owner/ratings/${ratingId}/reply`)
      .set('Cookie', owner1Cookie)
      .send({ reply: 'Initial reply to be deleted' });

    // Delete reply
    const deleteRes = await request(app)
      .delete(`/api/v1/owner/ratings/${ratingId}/reply`)
      .set('Cookie', owner1Cookie);

    expect(deleteRes.status).toBe(200);

    // Verify rating no longer has an ownerReply text
    const updatedRating = await RatingModel.findById(ratingId);
    expect(updatedRating?.ownerReply?.text).toBeUndefined();
  });

  it('allows owner to update their store profile details (O2)', async () => {
    const updateRes = await request(app)
      .patch(`/api/v1/owner/stores/${owner1StoreId}`)
      .set('Cookie', owner1Cookie)
      .send({
        description: 'San Francisco award-winning artisan bakery and specialty espresso bar.',
        phone: '+1 (415) 555-0199',
        website: 'https://grandbaybakery.com',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.store.description).toContain('award-winning artisan bakery');
    expect(updateRes.body.data.store.phone).toBe('+1 (415) 555-0199');
  });

  it('returns user rating history across all stores (R4)', async () => {
    const historyRes = await request(app)
      .get('/api/v1/stores/my-ratings/history')
      .set('Cookie', userCookie);

    expect(historyRes.status).toBe(200);
    expect(historyRes.body.data.ratings.length).toBe(1);
    expect(historyRes.body.data.ratings[0].storeName).toBe('Grand Bay Bakery & Coffee');
    expect(historyRes.body.data.ratings[0].value).toBe(5);
  });

  it('tracks recently viewed stores and allows clearing history (N5)', async () => {
    // Record view
    const viewRes = await request(app)
      .post(`/api/v1/stores/${owner1StoreId}/view`)
      .set('Cookie', userCookie);
    expect(viewRes.status).toBe(200);

    // Retrieve recently viewed
    const getRes = await request(app)
      .get('/api/v1/stores/recently-viewed')
      .set('Cookie', userCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.stores.length).toBe(1);
    expect(getRes.body.data.stores[0].id).toBe(owner1StoreId);

    // Clear recently viewed
    const clearRes = await request(app)
      .delete('/api/v1/stores/recently-viewed')
      .set('Cookie', userCookie);

    expect(clearRes.status).toBe(200);

    // Verify empty
    const verifyRes = await request(app)
      .get('/api/v1/stores/recently-viewed')
      .set('Cookie', userCookie);
    expect(verifyRes.body.data.stores.length).toBe(0);
  });

  it('returns trending stores based on recent activity (N4)', async () => {
    const trendingRes = await request(app).get('/api/v1/stores/trending');
    expect(trendingRes.status).toBe(200);
    expect(trendingRes.body.data.stores.length).toBeGreaterThan(0);
    expect(trendingRes.body.data.stores[0].name).toBeDefined();
  });

  it('supports in-app notification read and mark-all-read (N1)', async () => {
    // Seed notification directly
    await NotificationModel.create({
      userId,
      type: 'SYSTEM',
      title: 'Welcome to NexaPrime',
      message: 'Explore local stores and submit ratings today.',
      isRead: false,
    });

    const listRes = await request(app)
      .get('/api/v1/notifications')
      .set('Cookie', userCookie);
    expect(listRes.status).toBe(200);
    const notifId = listRes.body.data.notifications[0].id;

    // Mark single as read
    const readRes = await request(app)
      .patch(`/api/v1/notifications/${notifId}/read`)
      .set('Cookie', userCookie);
    expect(readRes.status).toBe(200);

    // Mark all as read
    const markAllRes = await request(app)
      .post('/api/v1/notifications/mark-all-read')
      .set('Cookie', userCookie);
    expect(markAllRes.status).toBe(200);
  });

  it('records login history and returns recent login sessions (SEC4)', async () => {
    const loginHistoryRes = await request(app)
      .get('/api/v1/auth/login-history')
      .set('Cookie', userCookie);

    expect(loginHistoryRes.status).toBe(200);
    expect(loginHistoryRes.body.data.loginHistory.length).toBeGreaterThan(0);
    expect(loginHistoryRes.body.data.loginHistory[0].status).toBe('SUCCESS');
  });
});
