import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { emailService } from '../src/services/email.service';
import { hashPassword } from '../src/utils/password';

describe('End-to-End Platform Core Workflows (Integration)', () => {
  it('executes the complete full-stack platform lifecycle between store owners and customers', async () => {
    const initialPassword = 'Password@123';
    const newPassword = 'NewSecret@123';
    const passwordHash = await hashPassword(initialPassword);

    // 1. Provision Store Owner
    const owner = await UserModel.create({
      name: 'Workflow Merchant Owner Account',
      email: 'workflow.owner@example.com',
      address: '200 Merchant Row, Boston, MA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      isEmailVerified: true,
      tokenVersion: 0,
    });

    const ownerLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'workflow.owner@example.com',
      password: initialPassword,
    });
    expect(ownerLogin.status).toBe(200);
    const ownerCookie = ownerLogin.headers['set-cookie'];

    // 2. Store is created and owned by owner
    const store = await StoreModel.create({
      name: 'Workflow Gourmet Roasters',
      email: 'info@workflowroasters.com',
      address: '555 Coffee Mill Street, Seattle, WA',
      category: 'Cafe',
      city: 'Seattle',
      ownerId: owner._id,
      isActive: true,
    });
    const createdStoreId = store._id.toString();

    // 3. Normal user registers
    const userEmail = 'workflow.user@example.com';
    const registerRes = await request(app).post('/api/v1/auth/register').send({
      name: 'Workflow Test Customer Consumer',
      email: userEmail,
      password: initialPassword,
      address: '777 Residential Avenue, Seattle, WA',
    });

    expect(registerRes.status).toBe(201);
    expect(registerRes.body.data.user.role).toBe('USER');
    const userCookie = registerRes.headers['set-cookie'];

    // 4. User discovers store and bookmarks to favorites
    const dirRes = await request(app)
      .get('/api/v1/stores?category=Cafe')
      .set('Cookie', userCookie);
    expect(dirRes.status).toBe(200);
    const foundStore = dirRes.body.data.stores.find((s: any) => s.id === createdStoreId);
    expect(foundStore).toBeDefined();

    const favRes = await request(app)
      .post(`/api/v1/stores/${createdStoreId}/favorite`)
      .set('Cookie', userCookie);
    expect(favRes.status).toBe(200);
    expect(favRes.body.data.isFavorite).toBe(true);

    // 5. User submits 5-star rating with written comment
    const ratingRes = await request(app)
      .put(`/api/v1/stores/${createdStoreId}/rating`)
      .set('Cookie', userCookie)
      .send({
        rating: 5,
        comment: 'Best single-origin cold brew in the Pacific Northwest!',
      });
    expect(ratingRes.status).toBe(200);
    expect(ratingRes.body.data.rating.value).toBe(5);
    const createdRatingId = ratingRes.body.data.rating.id;

    // 6. Store Owner inspects dashboard analytics and exports CSV
    const dashRes = await request(app)
      .get('/api/v1/owner/dashboard')
      .set('Cookie', ownerCookie);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.data.dashboard.totalRatings).toBe(1);
    expect(dashRes.body.data.dashboard.averageRating).toBe(5);

    const csvRes = await request(app)
      .get('/api/v1/owner/ratings/export')
      .set('Cookie', ownerCookie);
    expect(csvRes.status).toBe(200);
    expect(csvRes.text).toContain('Workflow Gourmet Roasters');

    // 7. Store Owner replies to the rating
    const replyRes = await request(app)
      .post(`/api/v1/owner/ratings/${createdRatingId}/reply`)
      .set('Cookie', ownerCookie)
      .send({ reply: 'Thank you for your wonderful review! We take pride in our coffee.' });
    expect(replyRes.status).toBe(200);

    // 8. Password Reset & Email Verification lifecycle
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: userEmail });
    expect(forgotRes.status).toBe(200);

    // Generate valid reset token
    const { token, hash } = emailService.generateToken();
    await UserModel.updateOne(
      { email: userEmail },
      {
        $set: {
          passwordResetTokenHash: hash,
          passwordResetExpiresAt: new Date(Date.now() + 3600000),
        },
      }
    );

    const resetRes = await request(app).post('/api/v1/auth/reset-password').send({
      token,
      password: newPassword,
    });
    expect(resetRes.status).toBe(200);

    // Prior session cookie revoked
    const revokedCheck = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userCookie);
    expect(revokedCheck.status).toBe(401);

    // Verify email with token
    const { token: verifyToken, hash: verifyHash } = emailService.generateToken();
    await UserModel.updateOne(
      { email: userEmail },
      {
        $set: {
          emailVerificationTokenHash: verifyHash,
          emailVerificationExpiresAt: new Date(Date.now() + 86400000),
        },
      }
    );

    const verifyRes = await request(app).post('/api/v1/auth/verify-email').send({
      token: verifyToken,
    });
    expect(verifyRes.status).toBe(200);

    const verifiedUser = await UserModel.findOne({ email: userEmail });
    expect(verifiedUser?.isEmailVerified).toBe(true);
  });
});
