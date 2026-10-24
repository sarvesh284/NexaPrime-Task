import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { hashPassword } from '../src/utils/password';

describe('Authentication & User Management APIs', () => {
  const validUserPayload = {
    name: 'Alexander James Montgomery', // 26 chars
    email: 'alexander.montgomery@example.com',
    password: 'Password@123',
    address: '100 Main Street, Suite 400, San Francisco, CA',
  };

  it('successfully registers a normal user and sets an HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(validUserPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(validUserPayload.email.toLowerCase());
    expect(res.body.data.user.role).toBe('USER');
    expect(res.body.data.user.passwordHash).toBeUndefined();

    // Check Set-Cookie header
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/auth_token=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);
  });

  it('rejects registration if name is shorter than 2 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        name: 'A', // < 2 chars
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details.name).toBeDefined();
  });

  it('rejects registration if email format is invalid', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        email: 'invalid-email-address',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details.email).toBeDefined();
  });

  it('rejects registration if password does not satisfy complexity requirements', async () => {
    // Missing uppercase
    const res1 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        password: 'password@123',
      });
    expect(res1.status).toBe(400);

    // Missing special character
    const res2 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        password: 'Password123',
      });
    expect(res2.status).toBe(400);

    // Too short (< 8 chars)
    const res3 = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        password: 'Pa@1',
      });
    expect(res3.status).toBe(400);
  });

  it('rejects duplicate email registrations with a 409 Conflict', async () => {
    await request(app).post('/api/v1/auth/register').send(validUserPayload);

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        name: 'Another Valid Name Length Test',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('allows registration as STORE_OWNER and verifies database persistence and login role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        email: 'merchant.owner@example.com',
        role: 'STORE_OWNER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('STORE_OWNER');

    // 1. Verify persisted in MongoDB
    const createdInDb = await UserModel.findOne({ email: 'merchant.owner@example.com' });
    expect(createdInDb).toBeDefined();
    expect(createdInDb?.role).toBe('STORE_OWNER');

    // 2. Verify subsequent login returns persisted STORE_OWNER role
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'merchant.owner@example.com',
        password: validUserPayload.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('STORE_OWNER');

    // 3. Verify /auth/me returns the persisted STORE_OWNER role
    const cookie = loginRes.headers['set-cookie'];
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.role).toBe('STORE_OWNER');
  });

  it('allows registration as USER (Customer) and verifies database persistence and login role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        email: 'normal.customer@example.com',
        role: 'USER',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('USER');

    // 1. Verify persisted in MongoDB
    const createdInDb = await UserModel.findOne({ email: 'normal.customer@example.com' });
    expect(createdInDb).toBeDefined();
    expect(createdInDb?.role).toBe('USER');

    // 2. Verify subsequent login returns persisted USER role
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'normal.customer@example.com',
        password: validUserPayload.password,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.role).toBe('USER');

    // 3. Verify /auth/me returns persisted USER role
    const userCookie = loginRes.headers['set-cookie'];
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', userCookie);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.role).toBe('USER');
  });

  it('rejects registration with invalid or obsolete roles like ADMIN or arbitrary roles', async () => {
    const resAdmin = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        email: 'attacker@example.com',
        role: 'ADMIN',
      });

    expect(resAdmin.status).toBe(400);
    expect(resAdmin.body.success).toBe(false);

    const resArbitrary = await request(app)
      .post('/api/v1/auth/register')
      .send({
        ...validUserPayload,
        email: 'attacker2@example.com',
        role: 'SUPERUSER',
      });

    expect(resArbitrary.status).toBe(400);
    expect(resArbitrary.body.success).toBe(false);
  });

  it('successfully logs in with valid credentials', async () => {
    await request(app).post('/api/v1/auth/register').send(validUserPayload);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validUserPayload.email,
        password: validUserPayload.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUserPayload.email.toLowerCase());
  });

  it('rejects login with an incorrect password', async () => {
    await request(app).post('/api/v1/auth/register').send(validUserPayload);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: validUserPayload.email,
        password: 'WrongPassword@123',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('rejects login for inactive / deactivated accounts', async () => {
    const passwordHash = await hashPassword(validUserPayload.password);
    await UserModel.create({
      ...validUserPayload,
      email: 'deactivated@example.com',
      passwordHash,
      isActive: false,
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'deactivated@example.com',
        password: validUserPayload.password,
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('verifies active session on /api/v1/auth/me and denies unauthenticated access', async () => {
    const regRes = await request(app).post('/api/v1/auth/register').send(validUserPayload);
    const cookie = regRes.headers['set-cookie'];

    // Authenticated request
    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(validUserPayload.email.toLowerCase());

    // Unauthenticated request
    const unauthRes = await request(app).get('/api/v1/auth/me');
    expect(unauthRes.status).toBe(401);
  });

  it('logs out and clears authentication cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toMatch(/auth_token=;/);
  });
});
