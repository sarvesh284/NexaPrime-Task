import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { UserModel } from '../models/user.model';
import { StoreModel } from '../models/store.model';
import { RatingModel } from '../models/rating.model';
import { ReportModel } from '../models/report.model';
import { AuditLogModel } from '../models/auditLog.model';
import { hashPassword } from '../utils/password';

export const seedDatabase = async () => {
  console.log('🌱 Starting database seeding process...');

  await connectDatabase();

  // Clean collections
  await UserModel.deleteMany({});
  await StoreModel.deleteMany({});
  await RatingModel.deleteMany({});
  await ReportModel.deleteMany({});
  await AuditLogModel.deleteMany({});

  console.log('🧹 Existing collections cleared.');

  const defaultPassword = 'Password@123';
  const passwordHash = await hashPassword(defaultPassword);

  // 1. Create Platform Admin
  const admin = await UserModel.create({
    name: 'Platform Senior Administrator',
    email: 'sarvesh.admin@example.com',
    address: '100 Infinite Loop Suite 500, Cupertino, CA',
    passwordHash,
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true,
    tokenVersion: 1,
  });

  // 2. Create Store Owner
  const owner = await UserModel.create({
    name: 'Sarvesh Owner Enterprise',
    email: 'sarvesh.owner@example.com',
    address: '742 Evergreen Terrace Suite 100, Springfield, IL',
    passwordHash,
    role: 'STORE_OWNER',
    isActive: true,
    isEmailVerified: true,
    tokenVersion: 1,
  });

  // 3. Create Normal Users
  const user1 = await UserModel.create({
    name: 'Sarvesh User Demonstrator',
    email: 'sarvesh.user@example.com',
    address: '100 Universal City Plaza, Universal City, CA',
    passwordHash,
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    tokenVersion: 1,
  });

  const user2 = await UserModel.create({
    name: 'Avery Reviewer Inspector',
    email: 'reviewer@example.com',
    address: '456 Silicon Valley Avenue, San Jose, CA',
    passwordHash,
    role: 'USER',
    isActive: true,
    isEmailVerified: true,
    tokenVersion: 1,
  });

  const user3 = await UserModel.create({
    name: 'Morgan Taylor Consumerist',
    email: 'morgan.taylor@example.com',
    address: '888 Grand Central Terminal, New York, NY',
    passwordHash,
    role: 'USER',
    isActive: true,
    isEmailVerified: false,
    tokenVersion: 1,
  });

  console.log('👥 Admin, Owner, and Users seeded successfully.');

  // 4. Create Stores
  const store1 = await StoreModel.create({
    name: 'Green Valley Organic Supermarket',
    email: 'contact@greenvalley.com',
    address: '101 Fresh Meadow Road, Green Valley, CA 95945',
    category: 'Groceries',
    city: 'Green Valley',
    ownerId: owner._id,
    isActive: true,
    averageRating: 4.7,
    ratingCount: 3,
  });

  const store2 = await StoreModel.create({
    name: 'Metro Tech Electronics & Supplies',
    email: 'sales@metrotech.com',
    address: '202 Innovation Parkway, Tech District, CA 94016',
    category: 'Electronics',
    city: 'San Jose',
    ownerId: owner._id,
    isActive: true,
    averageRating: 3.5,
    ratingCount: 2,
  });

  const store3 = await StoreModel.create({
    name: 'Artisan Heritage Bakery & Cafe',
    email: 'hello@artisanbakery.com',
    address: '303 Baker Street, Old Town Plaza, CA 92101',
    category: 'Food & Beverage',
    city: 'San Diego',
    ownerId: owner._id,
    isActive: true,
    averageRating: 4.5,
    ratingCount: 2,
  });

  const store4 = await StoreModel.create({
    name: 'Summit Outfitters Sporting Goods',
    email: 'support@summitoutfitters.com',
    address: '404 Alpine Ridge Way, Mountain View, CA 94043',
    category: 'Sports & Outdoors',
    city: 'Mountain View',
    ownerId: owner._id,
    isActive: true,
    averageRating: 0,
    ratingCount: 0,
  });

  console.log('🏪 Stores seeded successfully with categories and cities.');

  // 5. Seed Ratings & Comments
  const rating1 = await RatingModel.create({
    userId: user1._id,
    storeId: store1._id,
    value: 5,
    comment: 'Exceptional fresh organic produce and friendly staff! Best market in town.',
    status: 'VISIBLE',
    helpfulVotes: [user2._id, user3._id],
    helpfulCount: 2,
  });

  const rating2 = await RatingModel.create({
    userId: user2._id,
    storeId: store1._id,
    value: 4,
    comment: 'Great selection of goods, slightly crowded during weekends but worth the visit.',
    status: 'VISIBLE',
    helpfulVotes: [user1._id],
    helpfulCount: 1,
  });

  await RatingModel.create({
    userId: user3._id,
    storeId: store1._id,
    value: 5,
    comment: 'The bakery section inside this market has the most amazing croissants!',
    status: 'VISIBLE',
    helpfulVotes: [],
    helpfulCount: 0,
  });

  // Store 2: Metro Tech
  await RatingModel.create({
    userId: user1._id,
    storeId: store2._id,
    value: 4,
    comment: 'Knowledgeable tech support and competitive prices on PC parts.',
    status: 'VISIBLE',
    helpfulVotes: [user2._id],
    helpfulCount: 1,
  });

  const flaggedRating = await RatingModel.create({
    userId: user2._id,
    storeId: store2._id,
    value: 3,
    comment: 'Decent hardware selection, but checkout lines were sluggish.',
    status: 'FLAGGED',
    helpfulVotes: [],
    helpfulCount: 0,
  });

  // Store 3: Artisan Bakery
  await RatingModel.create({
    userId: user2._id,
    storeId: store3._id,
    value: 5,
    comment: 'Sourdough bread is out of this world! Perfect crust and crumb.',
    status: 'VISIBLE',
    helpfulVotes: [user3._id],
    helpfulCount: 1,
  });

  await RatingModel.create({
    userId: user3._id,
    storeId: store3._id,
    value: 4,
    comment: 'Lovely vintage ambiance and delicious flat white espresso.',
    status: 'VISIBLE',
    helpfulVotes: [],
    helpfulCount: 0,
  });

  // 6. Seed a sample Report for Admin Moderation
  await ReportModel.create({
    ratingId: flaggedRating._id,
    reporterId: user1._id,
    reason: 'SPAM',
    details: 'Review seems duplicate or repetitive in nature.',
    status: 'PENDING',
  });

  // 7. Initial Admin Audit Log
  await AuditLogModel.create({
    actorId: admin._id,
    actorEmail: admin.email,
    actorRole: 'ADMIN',
    action: 'SYSTEM_SEED_INITIALIZATION',
    targetType: 'SYSTEM',
    targetId: 'INIT',
    metadata: { environment: 'development', storesCount: 4, usersCount: 4 },
  });

  console.log('⭐ Ratings, reviews, and moderation reports seeded.');
  console.log('🎉 Seeding completed successfully!');
  console.log('\n--- DEMO CREDENTIALS ---');
  console.log('Admin:       sarvesh.admin@example.com / Password@123');
  console.log('Store Owner: sarvesh.owner@example.com / Password@123');
  console.log('Normal User: sarvesh.user@example.com  / Password@123');
  console.log('Reviewer:    reviewer@example.com      / Password@123');
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
