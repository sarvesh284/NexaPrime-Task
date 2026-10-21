import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { UserModel } from '../models/user.model';
import { StoreModel } from '../models/store.model';
import { RatingModel } from '../models/rating.model';
import { hashPassword } from '../utils/password';

export const seedDatabase = async () => {
  console.log('🌱 Starting database seeding process...');

  await connectDatabase();

  // Clean collections
  await UserModel.deleteMany({});
  await StoreModel.deleteMany({});
  await RatingModel.deleteMany({});

  console.log('🧹 Existing collections cleared.');

  const defaultPassword = 'Password@123';
  const passwordHash = await hashPassword(defaultPassword);

  // 1. Create Store Owner
  const owner = await UserModel.create({
    name: 'Sarvesh Owner Enterprise',
    email: 'sarvesh.owner@example.com',
    address: '742 Evergreen Terrace Suite 100, Springfield',
    passwordHash,
    role: 'STORE_OWNER',
    isActive: true,
  });

  // 2. Create Normal Users
  const user1 = await UserModel.create({
    name: 'Sarvesh User Demonstrator',
    email: 'sarvesh.user@example.com',
    address: '100 Universal City Plaza, Universal City, CA',
    passwordHash,
    role: 'USER',
    isActive: true,
  });

  const user2 = await UserModel.create({
    name: 'Avery Reviewer Inspector',
    email: 'reviewer@example.com',
    address: '456 Silicon Valley Avenue, San Jose, CA',
    passwordHash,
    role: 'USER',
    isActive: true,
  });

  const user3 = await UserModel.create({
    name: 'Morgan Taylor Consumerist',
    email: 'morgan.taylor@example.com',
    address: '888 Grand Central Terminal, New York, NY',
    passwordHash,
    role: 'USER',
    isActive: true,
  });

  console.log('👥 Users seeded successfully.');

  // 3. Create Stores
  const store1 = await StoreModel.create({
    name: 'Green Valley Organic Supermarket',
    address: '101 Fresh Meadow Road, Green Valley, CA 95945',
    ownerId: owner._id,
    isActive: true,
  });

  const store2 = await StoreModel.create({
    name: 'Metro Tech Electronics & Supplies',
    address: '202 Innovation Parkway, Tech District, CA 94016',
    ownerId: owner._id,
    isActive: true,
  });

  const store3 = await StoreModel.create({
    name: 'Artisan Heritage Bakery & Cafe',
    address: '303 Baker Street, Old Town Plaza, CA 92101',
    ownerId: owner._id,
    isActive: true,
  });

  const store4 = await StoreModel.create({
    name: 'Summit Outfitters Sporting Goods',
    address: '404 Alpine Ridge Way, Mountain View, CA 94043',
    ownerId: owner._id,
    isActive: true,
  });

  console.log('🏪 Stores seeded successfully.');

  // 4. Seed Ratings
  const ratingsData = [
    // Store 1: Green Valley
    { userId: user1._id, storeId: store1._id, value: 5 },
    { userId: user2._id, storeId: store1._id, value: 4 },
    { userId: user3._id, storeId: store1._id, value: 5 },

    // Store 2: Metro Tech
    { userId: user1._id, storeId: store2._id, value: 4 },
    { userId: user2._id, storeId: store2._id, value: 3 },

    // Store 3: Artisan Bakery
    { userId: user2._id, storeId: store3._id, value: 5 },
    { userId: user3._id, storeId: store3._id, value: 4 },

    // Store 4: Summit Outfitters (currently no ratings - tests 0-rating state)
  ];

  await RatingModel.insertMany(ratingsData);

  console.log('⭐ Ratings seeded successfully.');
  console.log('🎉 Seeding completed successfully!');
  console.log('\n--- DEMO CREDENTIALS ---');
  console.log('Normal User: sarvesh.user@example.com / Password@123');
  console.log('Store Owner: sarvesh.owner@example.com / Password@123');
  console.log('Reviewer:    reviewer@example.com     / Password@123');
  console.log('------------------------\n');
};

if (require.main === module) {
  seedDatabase()
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
