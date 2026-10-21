import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from './setup';
import { UserModel } from '../src/models/user.model';
import { StoreModel } from '../src/models/store.model';
import { RatingModel } from '../src/models/rating.model';
import { hashPassword } from '../src/utils/password';

describe('Review Comments, Helpful Votes & Moderation Reporting APIs', () => {
  let user1Cookie: string[];
  let user2Cookie: string[];
  let user1Id: string;
  let user2Id: string;
  let storeId: string;
  let ratingId: string;

  beforeEach(async () => {
    const passwordHash = await hashPassword('Password@123');

    // Store Owner
    const owner = await UserModel.create({
      name: 'Review Test Owner Account',
      email: 'owner.rev.test@example.com',
      address: '100 Owner Way, San Francisco, CA',
      passwordHash,
      role: 'STORE_OWNER',
      isActive: true,
      tokenVersion: 0,
    });

    // User 1
    const user1 = await UserModel.create({
      name: 'First Honest Reviewer User',
      email: 'user1.rev.test@example.com',
      address: '200 Reviewer St, Oakland, CA',
      passwordHash,
      role: 'USER',
      isActive: true,
      tokenVersion: 0,
    });
    user1Id = user1._id.toString();

    const user1Login = await request(app).post('/api/v1/auth/login').send({
      email: 'user1.rev.test@example.com',
      password: 'Password@123',
    });
    user1Cookie = user1Login.headers['set-cookie'];

    // User 2
    const user2 = await UserModel.create({
      name: 'Second Critical Reviewer User',
      email: 'user2.rev.test@example.com',
      address: '300 Reviewer St, Berkeley, CA',
      passwordHash,
      role: 'USER',
      isActive: true,
      tokenVersion: 0,
    });
    user2Id = user2._id.toString();

    const user2Login = await request(app).post('/api/v1/auth/login').send({
      email: 'user2.rev.test@example.com',
      password: 'Password@123',
    });
    user2Cookie = user2Login.headers['set-cookie'];

    // Store
    const store = await StoreModel.create({
      name: 'Reviews Test Bakery & Cafe',
      address: '400 Baker St, San Francisco, CA',
      ownerId: owner._id,
      isActive: true,
    });
    storeId = store._id.toString();

    // User 1 submits initial rating and comment
    const ratingRes = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', user1Cookie)
      .send({
        rating: 5,
        comment: 'Delicious fresh croissants and excellent coffee!',
      });
    ratingId = ratingRes.body.data.rating.id;
  });

  it('accepts rating with valid comment up to 500 characters', async () => {
    const res = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', user2Cookie)
      .send({
        rating: 4,
        comment: 'Great atmosphere, friendly staff.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.rating.value).toBe(4);
    expect(res.body.data.rating.comment).toBe('Great atmosphere, friendly staff.');
  });

  it('rejects comments exceeding 500 characters', async () => {
    const longComment = 'A'.repeat(501);
    const res = await request(app)
      .put(`/api/v1/stores/${storeId}/rating`)
      .set('Cookie', user2Cookie)
      .send({
        rating: 4,
        comment: longComment,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.details.comment).toBeDefined();
  });

  it('retrieves store reviews with star distribution and pagination', async () => {
    const res = await request(app).get(`/api/v1/stores/${storeId}/reviews`);

    expect(res.status).toBe(200);
    expect(res.body.data.reviews.length).toBe(1);
    expect(res.body.data.reviews[0].comment).toBe('Delicious fresh croissants and excellent coffee!');
    expect(res.body.data.distribution['5'].count).toBe(1);
  });

  it('allows authenticated users to toggle helpful votes on reviews', async () => {
    // User 2 votes helpful on User 1's review
    const voteRes = await request(app)
      .post(`/api/v1/stores/reviews/${ratingId}/helpful`)
      .set('Cookie', user2Cookie);

    expect(voteRes.status).toBe(200);
    expect(voteRes.body.data.helpfulCount).toBe(1);
    expect(voteRes.body.data.hasVotedHelpful).toBe(true);

    // User 2 clicks again to remove helpful vote
    const unvoteRes = await request(app)
      .post(`/api/v1/stores/reviews/${ratingId}/helpful`)
      .set('Cookie', user2Cookie);

    expect(unvoteRes.status).toBe(200);
    expect(unvoteRes.body.data.helpfulCount).toBe(0);
    expect(unvoteRes.body.data.hasVotedHelpful).toBe(false);
  });

  it('prevents users from voting helpful on their own review', async () => {
    const res = await request(app)
      .post(`/api/v1/stores/reviews/${ratingId}/helpful`)
      .set('Cookie', user1Cookie);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CANNOT_VOTE_OWN_REVIEW');
  });

  it('allows user to report a review and rejects duplicate reports', async () => {
    // 1. Submit report
    const res1 = await request(app)
      .post(`/api/v1/stores/reviews/${ratingId}/report`)
      .set('Cookie', user2Cookie)
      .send({
        reason: 'OFFENSIVE',
        details: 'Review contains unacceptable language.',
      });

    expect(res1.status).toBe(201);
    expect(res1.body.data.status).toBe('PENDING');

    // Review status should now be FLAGGED
    const flaggedRating = await RatingModel.findById(ratingId);
    expect(flaggedRating?.status).toBe('FLAGGED');

    // 2. Duplicate report by same user should be rejected (409)
    const res2 = await request(app)
      .post(`/api/v1/stores/reviews/${ratingId}/report`)
      .set('Cookie', user2Cookie)
      .send({
        reason: 'SPAM',
        details: 'Second attempt should fail.',
      });

    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('DUPLICATE_REPORT');
  });
});
