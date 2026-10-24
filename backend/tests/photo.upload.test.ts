import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { PhotoModel } from '../src/models/photo.model';
import { hashPassword } from '../src/utils/password';

// Valid image binary magic bytes
const VALID_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48,
]);
const VALID_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);
const VALID_WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20,
]);
const INVALID_FILE = Buffer.from('This is an executable or plain text masquerading as an image.');

describe('Store Photo Upload and Gallery Features', () => {
  let ownerCookie: string[];
  let otherOwnerCookie: string[];
  let user1Cookie: string[];
  let user2Cookie: string[];
  let storeId: string;
  let ownerId: string;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // 1. Store Owner 1
    const owner = await UserModel.create({
      name: 'Verified Store Owner Account',
      email: 'owner.photo@example.com',
      address: '200 Owner Ave, City, ST',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      isEmailVerified: true,
    });
    ownerId = owner._id.toString();
    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'owner.photo@example.com',
      password: 'Password@123',
    });
    ownerCookie = ownerLogin.headers['set-cookie'];

    // 3. Other Store Owner
    await UserModel.create({
      name: 'Other Store Owner Account',
      email: 'otherowner.photo@example.com',
      address: '300 Other Way, City, ST',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      isEmailVerified: true,
    });
    const otherLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'otherowner.photo@example.com',
      password: 'Password@123',
    });
    otherOwnerCookie = otherLogin.headers['set-cookie'];

    // 4. Normal User 1
    const user1 = await UserModel.create({
      name: 'First Community Consumer',
      email: 'user1.photo@example.com',
      address: '400 User St, City, ST',
      passwordHash,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    });
    user1Id = user1._id.toString();
    const user1Login = await request(app).post('/api/v1/auth/login').send({
      email: 'user1.photo@example.com',
      password: 'Password@123',
    });
    user1Cookie = user1Login.headers['set-cookie'];

    // 5. Normal User 2
    const user2 = await UserModel.create({
      name: 'Second Community Consumer',
      email: 'user2.photo@example.com',
      address: '500 Consumer Rd, City, ST',
      passwordHash,
      role: 'USER',
      isActive: true,
      isEmailVerified: true,
    });
    user2Id = user2._id.toString();
    const user2Login = await request(app).post('/api/v1/auth/login').send({
      email: 'user2.photo@example.com',
      password: 'Password@123',
    });
    user2Cookie = user2Login.headers['set-cookie'];

    // Store owned by ownerId
    const store = await StoreModel.create({
      name: 'The Artisan Bakery & Cafe',
      address: '777 Market Street, San Francisco, CA',
      category: 'Cafe',
      city: 'San Francisco',
      ownerId: owner._id,
      isActive: true,
    });
    storeId = store._id.toString();
  });

  it('rejects unauthenticated photo upload attempts with 401', async () => {
    const res = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .attach('photos', VALID_JPEG, 'coffee.jpg');

    expect(res.status).toBe(401);
  });

  it('rejects photo upload for non-existent store with 404', async () => {
    const fakeStoreId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post(`/api/v1/stores/${fakeStoreId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', VALID_JPEG, 'coffee.jpg');

    expect(res.status).toBe(404);
  });

  it('rejects upload with spoofed/invalid image content with 400', async () => {
    const res = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', INVALID_FILE, 'malicious.jpg');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('invalid image content');
  });

  it('allows normal user to upload valid JPEG/PNG photos with isOfficial = false', async () => {
    const res = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .field('captions', 'Delicious latte and pastry')
      .attach('photos', VALID_JPEG, 'latte.jpg');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.photos).toHaveLength(1);
    expect(res.body.data.photos[0].isOfficial).toBe(false);
    expect(res.body.data.photos[0].caption).toBe('Delicious latte and pastry');
    expect(res.body.data.photos[0].url).toBeTruthy();
  });

  it('allows store owner to upload official photos and sets initial cover photo', async () => {
    const res = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', ownerCookie)
      .field('captions', 'Storefront view')
      .attach('photos', VALID_PNG, 'storefront.png');

    expect(res.status).toBe(201);
    expect(res.body.data.photos[0].isOfficial).toBe(true);
    expect(res.body.data.photos[0].isCover).toBe(true);

    // Verify store model updated coverImage
    const updatedStore = await StoreModel.findById(storeId);
    expect(updatedStore?.coverImage).toBe(res.body.data.photos[0].url);
  });

  it('retrieves approved photos for a store with pagination', async () => {
    // Upload 2 photos
    await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', VALID_JPEG, 'photo1.jpg')
      .attach('photos', VALID_WEBP, 'photo2.webp');

    const res = await request(app).get(`/api/v1/stores/${storeId}/photos`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('allows store owner to set a new cover photo and rejects unauthorized users', async () => {
    // User uploads photo
    const uploadRes = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', VALID_JPEG, 'interior.jpg');

    const photoId = uploadRes.body.data.photos[0].id;

    // Normal user attempts to set as cover -> 403 Forbidden
    const unauthRes = await request(app)
      .patch(`/api/v1/stores/${storeId}/photos/${photoId}/cover`)
      .set('Cookie', user1Cookie);
    expect(unauthRes.status).toBe(403);

    // Another store owner attempts to set cover -> 403 Forbidden
    const otherOwnerRes = await request(app)
      .patch(`/api/v1/stores/${storeId}/photos/${photoId}/cover`)
      .set('Cookie', otherOwnerCookie);
    expect(otherOwnerRes.status).toBe(403);

    // Authorized store owner sets cover -> 200 OK
    const ownerCoverRes = await request(app)
      .patch(`/api/v1/stores/${storeId}/photos/${photoId}/cover`)
      .set('Cookie', ownerCookie);

    expect(ownerCoverRes.status).toBe(200);
    expect(ownerCoverRes.body.data.photoId).toBe(photoId);

    const updatedPhoto = await PhotoModel.findById(photoId);
    expect(updatedPhoto?.isCover).toBe(true);
  });

  it('allows uploader to delete their own photo and prevents unauthorized deletion', async () => {
    // User1 uploads photo
    const uploadRes = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', VALID_JPEG, 'croissant.jpg');

    const photoId = uploadRes.body.data.photos[0].id;

    // User2 tries to delete User1's photo -> 403 Forbidden
    const unauthDelete = await request(app)
      .delete(`/api/v1/photos/${photoId}`)
      .set('Cookie', user2Cookie);
    expect(unauthDelete.status).toBe(403);

    // User1 deletes their own photo -> 200 OK
    const authDelete = await request(app)
      .delete(`/api/v1/photos/${photoId}`)
      .set('Cookie', user1Cookie);
    expect(authDelete.status).toBe(200);

    const checkPhoto = await PhotoModel.findById(photoId);
    expect(checkPhoto).toBeNull();
  });

  it('allows store owner to delete any photo on their store', async () => {
    // User1 uploads photo on Owner's store
    const uploadRes = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', VALID_JPEG, 'menu.jpg');

    const photoId = uploadRes.body.data.photos[0].id;

    // Owner deletes customer photo on their store -> 200 OK
    const ownerDelete = await request(app)
      .delete(`/api/v1/photos/${photoId}`)
      .set('Cookie', ownerCookie);
    expect(ownerDelete.status).toBe(200);

    const checkPhoto = await PhotoModel.findById(photoId);
    expect(checkPhoto).toBeNull();
  });

  it('allows user to report a photo and prevents duplicate reports', async () => {
    // Upload photo
    const uploadRes = await request(app)
      .post(`/api/v1/stores/${storeId}/photos`)
      .set('Cookie', user1Cookie)
      .attach('photos', VALID_JPEG, 'sample.jpg');

    const photoId = uploadRes.body.data.photos[0].id;

    // User 2 reports photo
    const reportRes = await request(app)
      .post(`/api/v1/photos/${photoId}/report`)
      .set('Cookie', user2Cookie)
      .send({ reason: 'INAPPROPRIATE', details: 'Contains irrelevant promotional material' });

    expect(reportRes.status).toBe(200);

    // User 2 duplicate report -> 409 Conflict
    const dupReport = await request(app)
      .post(`/api/v1/photos/${photoId}/report`)
      .set('Cookie', user2Cookie)
      .send({ reason: 'SPAM' });
    expect(dupReport.status).toBe(409);
  });
});
