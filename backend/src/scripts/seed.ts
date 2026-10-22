import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { UserModel } from '../models/user.model';
import { StoreModel } from '../models/store.model';
import { RatingModel } from '../models/rating.model';
import { ReportModel } from '../models/report.model';
import { AuditLogModel } from '../models/auditLog.model';
import { NotificationModel } from '../models/notification.model';
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
  await NotificationModel.deleteMany({});

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
    phone: '+1 (415) 555-0199',
    website: 'https://greenvalleyorganic.com',
    description: 'Premier neighborhood organic grocery store offering farm-fresh local produce, artisan cheese, and handcrafted sourdough.',
    address: '101 Fresh Meadow Road, Green Valley, CA 95945',
    category: 'Groceries',
    city: 'Green Valley',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    ownerId: owner._id,
    isActive: true,
    averageRating: 4.7,
    ratingCount: 3,
  });

  const store2 = await StoreModel.create({
    name: 'Metro Tech Electronics & Supplies',
    email: 'sales@metrotech.com',
    phone: '+1 (408) 555-0142',
    website: 'https://metrotechelectronics.com',
    description: 'Silicon Valley destination for premium computing hardware, electronics repair, and professional AV equipment.',
    address: '202 Innovation Parkway, Tech District, CA 94016',
    category: 'Electronics',
    city: 'San Jose',
    coordinates: { lat: 37.3382, lng: -121.8863 },
    ownerId: owner._id,
    isActive: true,
    averageRating: 3.5,
    ratingCount: 2,
  });

  const store3 = await StoreModel.create({
    name: 'Artisan Heritage Bakery & Cafe',
    email: 'hello@artisanbakery.com',
    phone: '+1 (619) 555-0188',
    website: 'https://artisanheritagebakery.com',
    description: 'Classic French-inspired European bakery and espresso bar serving wood-fired baguettes, delicate pastries, and pour-over coffee.',
    address: '303 Baker Street, Old Town Plaza, CA 92101',
    category: 'Food & Beverage',
    city: 'San Diego',
    coordinates: { lat: 32.7157, lng: -117.1611 },
    ownerId: owner._id,
    isActive: true,
    averageRating: 4.5,
    ratingCount: 2,
  });

  const store4 = await StoreModel.create({
    name: 'Summit Outfitters Sporting Goods',
    email: 'support@summitoutfitters.com',
    phone: '+1 (650) 555-0177',
    website: 'https://summitoutfitters.com',
    description: 'Outdoor adventures, hiking gear, trail maps, and technical climbing equipment with expert fitting consultations.',
    address: '404 Alpine Ridge Way, Mountain View, CA 94043',
    category: 'Sports & Outdoors',
    city: 'Mountain View',
    coordinates: { lat: 37.3861, lng: -122.0839 },
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
    ownerReply: {
      text: 'Thank you so much for the glowing review! Our team takes immense pride in sourcing fresh produce from local California growers every morning.',
      createdAt: new Date(),
      updatedAt: new Date(),
      ownerId: owner._id,
    },
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

  // 8. Seed Sample In-App Notifications
  await NotificationModel.create([
    {
      userId: user1._id,
      type: 'REVIEW_REPLY',
      title: 'Store Owner Replied to Your Review',
      message: 'The owner of Green Valley Organic Supermarket replied to your review.',
      link: `/stores/${store1._id}`,
      isRead: false,
    },
    {
      userId: owner._id,
      type: 'NEW_RATING',
      title: 'Customer Rating Received',
      message: 'A customer submitted a 5-star rating for Green Valley Organic Supermarket.',
      link: '/owner/dashboard',
      isRead: false,
    },
    {
      userId: admin._id,
      type: 'REPORT_RESOLVED',
      title: 'New Review Report Submitted',
      message: 'A new user report is pending moderation review in the moderation queue.',
      link: '/admin/reports',
      isRead: false,
    },
  ]);

  console.log('⭐ Ratings, reviews, moderation reports, and notifications seeded.');
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
