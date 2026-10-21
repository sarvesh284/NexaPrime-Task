import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { createApp } from '../src/app';

const TEST_DB_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/store_rating_platform_test';

export const app = createApp();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(TEST_DB_URI);
  }
});

beforeEach(async () => {
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0 && mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
  }
});
