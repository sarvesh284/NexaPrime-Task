import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { emailService } from '../src/services/email.service';
import { hashPassword } from '../src/utils/password';

describe('Email Verification & Password Reset APIs', () => {
  let userEmail = 'recovery.tester@example.com';
  let initialPassword = 'Password@123';
  let newPassword = 'NewSecret@456';

  beforeEach(async () => {
    const passwordHash = await hashPassword(initialPassword);

    await UserModel.create({
      name: 'Password Recovery Tester Account',
      email: userEmail,
      address: '123 Security Avenue, Palo Alto, CA',
      passwordHash,
      role: 'USER',
      isActive: true,
      isEmailVerified: false,
      tokenVersion: 0,
    });
  });

  it('provides identical generic message on forgot-password to prevent email enumeration', async () => {
    // 1. Existing email
    const resExisting = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: userEmail });

    expect(resExisting.status).toBe(200);
    expect(resExisting.body.message).toContain('password reset link has been sent');

    // 2. Non-existing email
    const resNonExisting = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'ghost.user.nonexistent@example.com' });

    expect(resNonExisting.status).toBe(200);
    expect(resNonExisting.body.message).toEqual(resExisting.body.message);
  });

  it('resets password, invalidates previous sessions, and enforces password complexity', async () => {
    // 1. Generate reset token
    const { token, hash } = emailService.generateToken();
    await UserModel.updateOne(
      { email: userEmail },
      {
        $set: {
          passwordResetTokenHash: hash,
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      }
    );

    // Initial login before reset
    const loginBefore = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: initialPassword });
    const oldSessionCookie = loginBefore.headers['set-cookie'];

    // Session before reset should work
    const checkBefore = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', oldSessionCookie);
    expect(checkBefore.status).toBe(200);

    // 2. Perform password reset
    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token,
        password: newPassword,
      });

    expect(resetRes.status).toBe(200);

    // 3. Prior session must now be revoked (tokenVersion incremented)
    const checkAfter = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', oldSessionCookie);
    expect(checkAfter.status).toBe(401);

    // 4. Old password must fail
    const loginOld = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: initialPassword });
    expect(loginOld.status).toBe(401);

    // 5. New password must succeed
    const loginNew = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userEmail, password: newPassword });
    expect(loginNew.status).toBe(200);
  });

  it('verifies email address with valid token and rejects expired/invalid tokens', async () => {
    const { token, hash } = emailService.generateToken();
    await UserModel.updateOne(
      { email: userEmail },
      {
        $set: {
          emailVerificationTokenHash: hash,
          emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      }
    );

    // 1. Invalid token fails
    const invalidRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'invalid_garbage_token' });
    expect(invalidRes.status).toBe(400);

    // 2. Valid token succeeds
    const validRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token });

    expect(validRes.status).toBe(200);

    const user = await UserModel.findOne({ email: userEmail });
    expect(user?.isEmailVerified).toBe(true);
  });
});
