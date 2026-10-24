import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { env } from '../config/env';
import { UserModel, IUser } from '../models/user.model';
import { StoreModel, IStore } from '../models/store.model';
import { RatingModel, IOwnerReply } from '../models/rating.model';
import { NotificationModel } from '../models/notification.model';
import { hashPassword } from '../utils/password';
import { seedMaharashtraStores } from './seedMaharashtra';

/**
 * Interface for Demo Rating Seed Item
 */
interface DemoRatingSeedItem {
  storeName: string;
  userEmail: string;
  value: number;
  comment: string;
  daysAgo: number;
  helpfulCount?: number;
  hasOwnerReply?: boolean;
  ownerReplyText?: string;
  ownerReplyDaysAgo?: number;
}

/**
 * Interface for Demo User Definition
 */
interface DemoUserDef {
  name: string;
  email: string;
  address: string;
  role: 'USER' | 'STORE_OWNER';
  isDemoCreator?: boolean;
}

/**
 * Calculate Date offset from now
 */
function getDateOffset(daysAgo: number, hour = 11, minute = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/**
 * Demo Users Dataset
 * Note: UserModel schema strictly requires:
 * - name: minlength 20, maxlength 60
 * - password: minimum 8 chars, 1 uppercase, 1 special char
 */
export const DEMO_USERS: DemoUserDef[] = [
  // 1. Primary demo accounts (compatible with standard seeds)
  {
    name: 'Platform Senior Administrator',
    email: 'sarvesh.admin@example.com',
    address: '100 Infinite Loop Suite 500, Cupertino, CA',
    role: 'STORE_OWNER',
  },
  {
    name: 'Sarvesh Owner Enterprise',
    email: 'sarvesh.owner@example.com',
    address: '742 Evergreen Terrace Suite 100, Springfield, IL',
    role: 'STORE_OWNER',
  },
  {
    name: 'Sarvesh User Demonstrator',
    email: 'sarvesh.user@example.com',
    address: 'Flat 402, Prabhat Road, Erandwane, Pune 411004',
    role: 'USER',
  },
  {
    name: 'Avery Reviewer Inspector',
    email: 'reviewer@example.com',
    address: 'B-12, Koregaon Park Annexe, Pune 411001',
    role: 'USER',
  },
  {
    name: 'Morgan Taylor Consumerist',
    email: 'morgan.taylor@example.com',
    address: '18 Marine Drive Promenade, Nariman Point, Mumbai 400021',
    role: 'USER',
  },

  // 2. Additional realistic demo users (Maharashtra demographic for presentation)
  {
    name: 'Aarav Deshmukh Pune Foodie',
    email: 'aarav.deshmukh@demo.ratelocal.in',
    address: 'Plot 55, Ideal Colony, Kothrud, Pune 411038',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Priya Kulkarni Lifestyle Critic',
    email: 'priya.kulkarni@demo.ratelocal.in',
    address: 'Rowhouse 4, Viman Nagar Central Avenue, Pune 411014',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Rohit Patil Tech Enthusiast',
    email: 'rohit.patil@demo.ratelocal.in',
    address: 'Phase 1, Rajiv Gandhi IT Park, Hinjawadi, Pune 411057',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Ananya Joshi Coffee Connoisseur',
    email: 'ananya.joshi@demo.ratelocal.in',
    address: 'Lane 7, South Main Road, Koregaon Park, Pune 411001',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Vikram Shinde Heritage Explorer',
    email: 'vikram.shinde@demo.ratelocal.in',
    address: 'Bhavani Mandap Road, Mahadwar, Kolhapur 416012',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Sneha Chavan Organic Gourmet',
    email: 'sneha.chavan@demo.ratelocal.in',
    address: 'Hiranandani Gardens, Powai Central, Mumbai 400076',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Aditya Bhosale Smart Shopper',
    email: 'aditya.bhosale@demo.ratelocal.in',
    address: 'West High Court Road, Dharampeth, Nagpur 440010',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Tanvi Inamdar Quality Reviewer',
    email: 'tanvi.inamdar@demo.ratelocal.in',
    address: 'Opposite BYK College, College Road, Nashik 422005',
    role: 'USER',
    isDemoCreator: true,
  },
  {
    name: 'Neha Gaikwad Food Enthusiast',
    email: 'neha.gaikwad@demo.ratelocal.in',
    address: 'Hill Road, Near Mehboob Studio, Bandra West, Mumbai 400050',
    role: 'USER',
    isDemoCreator: true,
  },
];

/**
 * Curated Demo Ratings with Varied Distributions across 12 Stores:
 * - High-rated superstar stores (FC Road Bakery, Koregaon Roasters, Bandra Books)
 * - Solid popular stores (Marine Drive Bistro, Hinjawadi Tech, Kolhapur Misal, Kothrud Organics)
 * - Average/diverse-feedback store with full 1-5 spread (Sitabuldi Tech & Mobile Plaza)
 * - Niche/regional stores with moderate to few ratings (Nashik Bistro, Kolhapuri Chappals, Nagpur Sweets, Panchavati)
 * - Explicit Zero-Rating Empty States (Navi Peth Chaddar in Solapur, Himroo Weaving in Sambhajinagar)
 */
export const DEMO_RATINGS_DATA: DemoRatingSeedItem[] = [
  // ==========================================
  // Store 1: FC Road Heritage Bakery & Cafe (Pune)
  // Target: 10 ratings, Avg ~ 4.6 (Superstar destination)
  // Distribution: 7x [5★], 2x [4★], 1x [3★]
  // ==========================================
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 5,
    comment: 'Best bun maska and cold coffee on FC road! Nostalgic ambiance and remarkably swift service.',
    daysAgo: 45,
    helpfulCount: 3,
    hasOwnerReply: true,
    ownerReplyText: 'Thank you so much for the glowing review! Bun maska and hot Irani chai on FC Road has been our family tradition for over 35 years.',
    ownerReplyDaysAgo: 44,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'sarvesh.user@example.com',
    value: 5,
    comment: 'Exceptional morning bakery run! Freshly baked cream rolls and warm bun maska. Pune classic.',
    daysAgo: 38,
    helpfulCount: 2,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'reviewer@example.com',
    value: 4,
    comment: 'Delicious baked goods and Shrewsbury biscuits. Can get crowded during college peak hours.',
    daysAgo: 31,
    helpfulCount: 1,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'morgan.taylor@example.com',
    value: 5,
    comment: 'The Irani chai paired with crusty bread is unmatched. A quintessential Pune cultural landmark.',
    daysAgo: 26,
    helpfulCount: 0,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'priya.kulkarni@demo.ratelocal.in',
    value: 5,
    comment: 'Classic cafe vibe, fresh mawa cakes every morning. Highly recommended for students and families.',
    daysAgo: 20,
    helpfulCount: 1,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 5,
    comment: 'Amazing filter coffee and cheese chili toast. Extremely affordable prices for students.',
    daysAgo: 16,
    helpfulCount: 0,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'ananya.joshi@demo.ratelocal.in',
    value: 4,
    comment: 'Visited on a Sunday morning. The queue moved remarkably fast and the vegetable pattice was piping hot.',
    daysAgo: 11,
    helpfulCount: 0,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 5,
    comment: 'Generations of heritage flavor! Best place to hang out with friends in central Pune.',
    daysAgo: 7,
    helpfulCount: 1,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'sneha.chavan@demo.ratelocal.in',
    value: 3,
    comment: 'Food is nostalgic and tasty, but finding two-wheeler parking on FC Road is quite challenging during evenings.',
    daysAgo: 4,
    helpfulCount: 0,
  },
  {
    storeName: 'FC Road Heritage Bakery & Cafe',
    userEmail: 'aditya.bhosale@demo.ratelocal.in',
    value: 5,
    comment: 'Their thick cold coffee with ice cream is legendary. Always a pleasant stop whenever I visit Pune.',
    daysAgo: 1,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 2: Koregaon Park Artisan Roasters (Pune)
  // Target: 8 ratings, Avg ~ 4.8 (Premium specialty cafe)
  // Distribution: 6x [5★], 2x [4★]
  // ==========================================
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'ananya.joshi@demo.ratelocal.in',
    value: 5,
    comment: 'The single-origin Ethiopian and Chikmagalur pour-overs are unmatched in Pune. Pure coffee poetry.',
    daysAgo: 52,
    helpfulCount: 4,
    hasOwnerReply: true,
    ownerReplyText: 'We are delighted you appreciated our Chikmagalur single-estate roast! We take immense pride in direct-farm sourcing.',
    ownerReplyDaysAgo: 50,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'morgan.taylor@example.com',
    value: 5,
    comment: 'Phenomenal specialty coffee and tranquil open-air garden ambiance in Lane 6. A serene oasis.',
    daysAgo: 40,
    helpfulCount: 2,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'sarvesh.user@example.com',
    value: 5,
    comment: 'Top-tier specialty roaster! Baristas explain flavor notes with passion. Great sourdough croissants.',
    daysAgo: 33,
    helpfulCount: 1,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'priya.kulkarni@demo.ratelocal.in',
    value: 5,
    comment: 'Artisan sourdough avocado toast and cold brew tonic. Incredible morning vibe with lush greenery around.',
    daysAgo: 27,
    helpfulCount: 1,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 4,
    comment: 'Great remote workspace with reliable high-speed wifi and an exceptional silky flat white.',
    daysAgo: 19,
    helpfulCount: 0,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 5,
    comment: 'Baristas genuinely know their roast profiles and brewing chemistry. A haven for true coffee lovers.',
    daysAgo: 13,
    helpfulCount: 1,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'sneha.chavan@demo.ratelocal.in',
    value: 4,
    comment: 'Slightly on the pricier side, but the high quality of beans and craftsmanship completely justifies it.',
    daysAgo: 6,
    helpfulCount: 0,
  },
  {
    storeName: 'Koregaon Park Artisan Roasters',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 5,
    comment: 'Cortado was silky, sweet, and perfectly balanced. Easily one of the finest specialty cafes in western India.',
    daysAgo: 2,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 3: Marine Drive Coastal Bistro (Mumbai)
  // Target: 9 ratings, Avg ~ 4.4 (Scenic coastal dining)
  // Distribution: 5x [5★], 3x [4★], 1x [3★]
  // ==========================================
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'sarvesh.user@example.com',
    value: 5,
    comment: 'The Surmai fry and Solkadhi against the sunset view is completely unbeatable in South Mumbai.',
    daysAgo: 50,
    helpfulCount: 2,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'reviewer@example.com',
    value: 5,
    comment: 'Exquisite coastal dining experience in south Mumbai. Fresh seafood sourced daily from Sassoon Docks.',
    daysAgo: 42,
    helpfulCount: 1,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 4,
    comment: 'Bombil fry was super crispy and spiced authentically. Good attentive service and clean presentation.',
    daysAgo: 36,
    helpfulCount: 0,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 5,
    comment: 'Nothing beats sitting by the Queens Necklace enjoying authentic Malvani prawns curry with steamed rice.',
    daysAgo: 29,
    helpfulCount: 1,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'sneha.chavan@demo.ratelocal.in',
    value: 4,
    comment: 'Crab masala was rich and flavorful. Expect a short wait on Saturday evenings, but staff manages it well.',
    daysAgo: 22,
    helpfulCount: 0,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 5,
    comment: 'Outstanding solkadhi! Very authentic Konkan coastal seasoning, soothing coconut milk and kokum balance.',
    daysAgo: 15,
    helpfulCount: 1,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 3,
    comment: 'Great seaside location, though service felt slightly rushed during peak 8 PM dinner rush.',
    daysAgo: 10,
    helpfulCount: 0,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'neha.gaikwad@demo.ratelocal.in',
    value: 4,
    comment: 'Prawns gassi with fluffy neer dosa was divine. Wonderful romantic seaside ambiance.',
    daysAgo: 5,
    helpfulCount: 0,
  },
  {
    storeName: 'Marine Drive Coastal Bistro',
    userEmail: 'aditya.bhosale@demo.ratelocal.in',
    value: 5,
    comment: 'Must-visit culinary spot when visiting Mumbai. Five stars for fresh taste, location, and sunset panorama.',
    daysAgo: 1,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 4: Sitabuldi Tech & Mobile Plaza (Nagpur)
  // Target: 7 ratings, Avg ~ 3.1 (Mixed feedback store with full 1-5 spread)
  // Distribution: 1x [5★], 2x [4★], 2x [3★], 1x [2★], 1x [1★]
  // Demonstrates negative reviews, owner reply to complaints, and analytics diversity!
  // ==========================================
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'reviewer@example.com',
    value: 4,
    comment: 'Huge range of mobile accessories and prompt phone screen service on Sitabuldi main street.',
    daysAgo: 48,
    helpfulCount: 1,
  },
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 5,
    comment: 'Got my laptop battery replaced in an hour at half the authorized center quote. Genuine parts and warranty.',
    daysAgo: 39,
    helpfulCount: 2,
  },
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 3,
    comment: 'Decent tech gadgets, but the shop gets too crowded and noisy during weekend evenings.',
    daysAgo: 30,
    helpfulCount: 0,
  },
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'priya.kulkarni@demo.ratelocal.in',
    value: 2,
    comment: 'Prices are reasonable, but had to wait over 40 minutes at the billing counter just for a screen protector.',
    daysAgo: 23,
    helpfulCount: 2,
    hasOwnerReply: true,
    ownerReplyText: 'We sincerely apologize for the checkout wait time during our weekend rush! We have now opened a dedicated express accessory counter to prevent delays.',
    ownerReplyDaysAgo: 22,
  },
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'aditya.bhosale@demo.ratelocal.in',
    value: 3,
    comment: 'Wide variety of gaming mice and chargers, though sales staff seemed preoccupied with repair orders.',
    daysAgo: 17,
    helpfulCount: 0,
  },
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 1,
    comment: 'Disappointing return policy on a defective HDMI cable. Had to argue with the shift manager to get a replacement.',
    daysAgo: 9,
    helpfulCount: 0,
  },
  {
    storeName: 'Sitabuldi Tech & Mobile Plaza',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 4,
    comment: 'Knowledgeable repair technicians who quickly diagnosed an erratic charging port on my iPad.',
    daysAgo: 2,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 5: Hinjawadi TechGear Hub (Pune)
  // Target: 6 ratings, Avg ~ 4.2 (Solid tech retail)
  // Distribution: 2x [5★], 3x [4★], 1x [3★]
  // ==========================================
  {
    storeName: 'Hinjawadi TechGear Hub',
    userEmail: 'sarvesh.user@example.com',
    value: 4,
    comment: 'Prompt service and excellent selection of mechanical keyboards and hot-swappable switches.',
    daysAgo: 46,
    helpfulCount: 1,
  },
  {
    storeName: 'Hinjawadi TechGear Hub',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 5,
    comment: 'Lifesaver for IT folks in Phase 1! Got replacement USB-C multi-display docking hubs immediately.',
    daysAgo: 37,
    helpfulCount: 1,
  },
  {
    storeName: 'Hinjawadi TechGear Hub',
    userEmail: 'aditya.bhosale@demo.ratelocal.in',
    value: 4,
    comment: 'Good stock of gaming monitors, braided cables, and ergonomic vertical mice.',
    daysAgo: 28,
    helpfulCount: 0,
  },
  {
    storeName: 'Hinjawadi TechGear Hub',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 5,
    comment: 'Custom mechanical keyboard keycaps and lubing kits in stock. Very impressive specialized store.',
    daysAgo: 18,
    helpfulCount: 0,
  },
  {
    storeName: 'Hinjawadi TechGear Hub',
    userEmail: 'sneha.chavan@demo.ratelocal.in',
    value: 3,
    comment: 'Convenient location near campus, but prices on peripherals are slightly higher than online deals.',
    daysAgo: 12,
    helpfulCount: 0,
  },
  {
    storeName: 'Hinjawadi TechGear Hub',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 4,
    comment: 'Clean showroom and very helpful staff who genuinely understand software developer hardware needs.',
    daysAgo: 3,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 6: Rajarampuri Royal Misal & Thali House (Kolhapur)
  // Target: 7 ratings, Avg ~ 4.1 (Authentic fiery regional dining)
  // Distribution: 3x [5★], 3x [4★], 1x [2★]
  // ==========================================
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'morgan.taylor@example.com',
    value: 5,
    comment: 'Unreal Pandhra Rassa! Authentic Kolhapuri taste with perfect fiery punch and fragrant spices.',
    daysAgo: 55,
    helpfulCount: 1,
  },
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 5,
    comment: 'Special Mutton Thali with Tambada Rassa is heavenly. Generous portions and very welcoming host.',
    daysAgo: 44,
    helpfulCount: 1,
  },
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 4,
    comment: 'Fiery misal that will make you sweat in the best way possible. Soft pavs and crunchy farsan.',
    daysAgo: 34,
    helpfulCount: 0,
  },
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'priya.kulkarni@demo.ratelocal.in',
    value: 2,
    comment: 'Way too spicy for our family! You must ask for medium spice level beforehand if you are not accustomed.',
    daysAgo: 25,
    helpfulCount: 0,
  },
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'sneha.chavan@demo.ratelocal.in',
    value: 5,
    comment: 'Traditional wood-fired cooking taste. An essential food pilgrimage whenever passing through Kolhapur.',
    daysAgo: 17,
    helpfulCount: 1,
  },
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 4,
    comment: 'Rich bold flavors, quick service, and clean family seating area on the first floor.',
    daysAgo: 8,
    helpfulCount: 0,
  },
  {
    storeName: 'Rajarampuri Royal Misal & Thali House',
    userEmail: 'neha.gaikwad@demo.ratelocal.in',
    value: 4,
    comment: 'The hot jowar bhakri paired with the spicy aromatic mutton gravy is an authentic local delicacy.',
    daysAgo: 2,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 7: Kothrud Organic Farmer Produce (Pune)
  // Target: 5 ratings, Avg ~ 4.4 (Organic Groceries)
  // Distribution: 3x [5★], 1x [4★], 1x [3★]
  // ==========================================
  {
    storeName: 'Kothrud Organic Farmer Produce',
    userEmail: 'reviewer@example.com',
    value: 5,
    comment: 'Super fresh vegetables and genuinely cold-pressed peanut oil straight from local farmers.',
    daysAgo: 47,
    helpfulCount: 1,
  },
  {
    storeName: 'Kothrud Organic Farmer Produce',
    userEmail: 'sneha.chavan@demo.ratelocal.in',
    value: 5,
    comment: 'Direct farm supply. Leafy greens stay fresh in the refrigerator for an entire week.',
    daysAgo: 35,
    helpfulCount: 1,
  },
  {
    storeName: 'Kothrud Organic Farmer Produce',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 4,
    comment: 'Great organic jaggery, indigenous millets, and unpolished pulses. Reliable neighborhood store.',
    daysAgo: 24,
    helpfulCount: 0,
  },
  {
    storeName: 'Kothrud Organic Farmer Produce',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 3,
    comment: 'Good organic produce, but popular seasonal items like tender greens sell out quickly before noon.',
    daysAgo: 14,
    helpfulCount: 0,
  },
  {
    storeName: 'Kothrud Organic Farmer Produce',
    userEmail: 'priya.kulkarni@demo.ratelocal.in',
    value: 5,
    comment: 'Seasonal Alphonso mangoes were naturally tree-ripened and wonderfully sweet without chemical carbide.',
    daysAgo: 4,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 8: Bandra Artisan Bookstore & Tea House (Mumbai)
  // Target: 4 ratings, Avg ~ 4.8 (Community bookstore)
  // Distribution: 3x [5★], 1x [4★]
  // ==========================================
  {
    storeName: 'Bandra Artisan Bookstore & Tea House',
    userEmail: 'morgan.taylor@example.com',
    value: 5,
    comment: 'A reader paradise in Bandra. Great collection of Marathi and English contemporary titles.',
    daysAgo: 49,
    helpfulCount: 1,
  },
  {
    storeName: 'Bandra Artisan Bookstore & Tea House',
    userEmail: 'ananya.joshi@demo.ratelocal.in',
    value: 5,
    comment: 'Cozy nook to read and sip artisanal Darjeeling first flush tea. Wonderful knowledgeable staff.',
    daysAgo: 32,
    helpfulCount: 1,
  },
  {
    storeName: 'Bandra Artisan Bookstore & Tea House',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 4,
    comment: 'Curated selection of indie publishers and local poetry chapbooks. Peaceful afternoon hangout.',
    daysAgo: 20,
    helpfulCount: 0,
  },
  {
    storeName: 'Bandra Artisan Bookstore & Tea House',
    userEmail: 'tanvi.inamdar@demo.ratelocal.in',
    value: 5,
    comment: 'Peaceful oasis away from Bandra traffic. Delicious gluten-free lemon cake and matcha latte.',
    daysAgo: 5,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 9: College Road Gourmet Bistro & Cafe (Nashik)
  // Target: 4 ratings, Avg ~ 4.0 (Youth cafe)
  // Distribution: 1x [5★], 2x [4★], 1x [3★]
  // ==========================================
  {
    storeName: 'College Road Gourmet Bistro & Cafe',
    userEmail: 'sarvesh.user@example.com',
    value: 5,
    comment: 'Best wood-fired pizza in Nashik! Wonderful vibrant ambiance on College Road.',
    daysAgo: 43,
    helpfulCount: 1,
  },
  {
    storeName: 'College Road Gourmet Bistro & Cafe',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 4,
    comment: 'Crispy thin crust and delicious creamy pasta. Very lively college youth vibe.',
    daysAgo: 27,
    helpfulCount: 0,
  },
  {
    storeName: 'College Road Gourmet Bistro & Cafe',
    userEmail: 'rohit.patil@demo.ratelocal.in',
    value: 3,
    comment: 'Good food and mocktails, but table waiting time was nearly 30 minutes on Friday evening.',
    daysAgo: 15,
    helpfulCount: 0,
  },
  {
    storeName: 'College Road Gourmet Bistro & Cafe',
    userEmail: 'neha.gaikwad@demo.ratelocal.in',
    value: 4,
    comment: 'Loved the peri-peri wedges and handcrafted iced tea. Polite and energetic young servers.',
    daysAgo: 3,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 10: Mahadwar Traditional Kolhapuri Chappals (Kolhapur)
  // Target: 3 ratings, Avg ~ 4.7 (Artisan footwear)
  // Distribution: 2x [5★], 1x [4★]
  // ==========================================
  {
    storeName: 'Mahadwar Traditional Kolhapuri Chappals',
    userEmail: 'sarvesh.user@example.com',
    value: 5,
    comment: 'Authentic handmade Kolhapuri chappals. The leather quality and braided detailing is remarkable.',
    daysAgo: 54,
    helpfulCount: 2,
  },
  {
    storeName: 'Mahadwar Traditional Kolhapuri Chappals',
    userEmail: 'reviewer@example.com',
    value: 5,
    comment: 'Must-visit place in Kolhapur! Bought three pairs of vegetable-tanned traditional sandals.',
    daysAgo: 36,
    helpfulCount: 1,
  },
  {
    storeName: 'Mahadwar Traditional Kolhapuri Chappals',
    userEmail: 'vikram.shinde@demo.ratelocal.in',
    value: 4,
    comment: 'Traditional craftsmanship at its finest. Genuine buffalo leather that softens with wear.',
    daysAgo: 16,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 11: Dharampeth Citrus & Sweet Mart (Nagpur)
  // Target: 2 ratings, Avg ~ 4.5 (Nagpur sweets)
  // Distribution: 1x [5★], 1x [4★]
  // ==========================================
  {
    storeName: 'Dharampeth Citrus & Sweet Mart',
    userEmail: 'sarvesh.user@example.com',
    value: 5,
    comment: 'The signature Nagpur orange burfi melts in your mouth! Authentic sweet souvenir from the Orange City.',
    daysAgo: 41,
    helpfulCount: 1,
  },
  {
    storeName: 'Dharampeth Citrus & Sweet Mart',
    userEmail: 'aarav.deshmukh@demo.ratelocal.in',
    value: 4,
    comment: 'Fresh creamy shrikhand, kaju katli, and motichoor pedhas. Very clean and hygienic sweet shop.',
    daysAgo: 18,
    helpfulCount: 0,
  },

  // ==========================================
  // Store 12: Panchavati Heritage Ayurvedic Pharmacy (Nashik)
  // Target: 1 rating, Avg ~ 5.0 (Single-rating store showcase)
  // ==========================================
  {
    storeName: 'Panchavati Heritage Ayurvedic Pharmacy',
    userEmail: 'reviewer@example.com',
    value: 5,
    comment: 'Pure authentic herbal medicines, medicated oils, and knowledgeable Ayurvedic vaidyas at Ramkund.',
    daysAgo: 38,
    helpfulCount: 1,
  },

  // NOTE:
  // Store 13: "Navi Peth Handcrafted Chaddar & Towels" (Solapur) has ZERO ratings intentionally
  // Store 14: "Himroo & Paithani Weaving Emporium" (Chhatrapati Sambhajinagar) has ZERO ratings intentionally
  // This allows demonstrating the empty rating state ("No ratings yet") in the HR presentation!
];

/**
 * Seed Demo Ratings Execution Routine
 */
export const seedDemoRatings = async () => {
  console.log('====================================================');
  console.log('🌟 RateLocal Presentation: Realistic Demo Rating Seeder');
  console.log('====================================================\n');

  // Safety Check: Refuse execution in production environment
  if (env.NODE_ENV === 'production' && !process.argv.includes('--force-production-demo')) {
    console.error('⛔ ERROR: Demo seeding is restricted to development or test environments.');
    console.error('If you absolutely intended to run this in production, pass --force-production-demo.');
    process.exit(1);
  }

  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }
  console.log(`🔗 Target Database Host: ${mongoose.connection.host}`);
  console.log(`📦 Target Database Name: ${mongoose.connection.name}`);
  console.log(`🌍 Environment Mode:    ${env.NODE_ENV}\n`);

  const defaultPassword = 'Password@123';
  const passwordHash = await hashPassword(defaultPassword);

  // 1. Ensure or Upsert Demo Users
  console.log('👥 Ensuring presentation demo accounts (12 users with realistic profiles)...');
  const userMapByEmail = new Map<string, IUser>();

  for (const u of DEMO_USERS) {
    const userDoc = await UserModel.findOneAndUpdate(
      { email: u.email.toLowerCase() },
      {
        $set: {
          name: u.name,
          email: u.email.toLowerCase(),
          address: u.address,
          passwordHash,
          role: u.role,
          isActive: true,
          isEmailVerified: true,
        },
        $setOnInsert: {
          tokenVersion: 1,
          favorites: [],
          recentlyViewed: [],
          loginHistory: [],
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    userMapByEmail.set(u.email.toLowerCase(), userDoc);
  }

  const ownerUser = userMapByEmail.get('sarvesh.owner@example.com');
  if (!ownerUser) {
    throw new Error('Store Owner user sarvesh.owner@example.com could not be prepared.');
  }

  console.log(`✅ ${DEMO_USERS.length} Demo users verified and ready.`);

  // 2. Ensure Maharashtra Demo Stores exist in database
  const maharashtraStoreCount = await StoreModel.countDocuments({ state: 'Maharashtra' });
  if (maharashtraStoreCount < 5) {
    console.log('📍 Initializing base Maharashtra sample stores because few or none were found...');
    await seedMaharashtraStores();
  }

  // Ensure target stores are owned by demo store owner so Owner Dashboard is populated
  const targetStoreNames = Array.from(new Set(DEMO_RATINGS_DATA.map((r) => r.storeName)));
  // Also include the 2 empty state stores:
  targetStoreNames.push('Navi Peth Handcrafted Chaddar & Towels');
  targetStoreNames.push('Himroo & Paithani Weaving Emporium');

  await StoreModel.updateMany(
    { name: { $in: targetStoreNames } },
    { $set: { ownerId: ownerUser._id, isDemo: true, isActive: true } }
  );

  const stores = await StoreModel.find({ name: { $in: targetStoreNames } });
  const storeMapByName = new Map<string, IStore>();
  stores.forEach((s) => storeMapByName.set(s.name, s));

  console.log(`🏪 Found ${stores.length} target stores for presentation seeding.`);

  // 3. Upsert Ratings with Atomic Idempotency
  console.log('\n⭐ Seeding and updating realistic customer ratings...');
  let seededRatingCount = 0;
  const affectedStoreIds = new Set<string>();

  for (const item of DEMO_RATINGS_DATA) {
    const store = storeMapByName.get(item.storeName);
    const user = userMapByEmail.get(item.userEmail.toLowerCase());

    if (!store) {
      console.warn(`⚠️ Store "${item.storeName}" not found in database. Skipping rating.`);
      continue;
    }
    if (!user) {
      console.warn(`⚠️ User "${item.userEmail}" not found in database. Skipping rating.`);
      continue;
    }

    affectedStoreIds.add(store._id.toString());

    const ratingDate = getDateOffset(item.daysAgo);
    let ownerReplyDoc: IOwnerReply | undefined = undefined;

    if (item.hasOwnerReply && item.ownerReplyText) {
      const replyDate = getDateOffset(item.ownerReplyDaysAgo || item.daysAgo);
      ownerReplyDoc = {
        text: item.ownerReplyText,
        createdAt: replyDate,
        updatedAt: replyDate,
        ownerId: ownerUser._id,
      };
    }

    // Build helpful votes array from other demo users (conforming to rule: no voting on own review)
    const otherUserObjectIds: mongoose.Types.ObjectId[] = [];
    const helpfulCount = item.helpfulCount || 0;
    if (helpfulCount > 0) {
      for (const [email, otherUser] of userMapByEmail.entries()) {
        if (email !== item.userEmail.toLowerCase() && otherUser.role === 'USER') {
          otherUserObjectIds.push(otherUser._id);
          if (otherUserObjectIds.length >= helpfulCount) break;
        }
      }
    }

    // Atomic upsert enforcing one-rating-per-user-per-store
    await RatingModel.findOneAndUpdate(
      { userId: user._id, storeId: store._id },
      {
        $set: {
          value: item.value,
          comment: item.comment,
          status: 'VISIBLE',
          helpfulCount: otherUserObjectIds.length,
          helpfulVotes: otherUserObjectIds,
          ownerReply: ownerReplyDoc,
          createdAt: ratingDate,
          updatedAt: ratingDate,
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    seededRatingCount++;
  }

  // 4. Synchronize Aggregate Statistics on All Stores
  console.log('\n📊 Recalculating store average ratings & counts from actual VISIBLE ratings...');
  const allActiveStores = await StoreModel.find({ isActive: true });

  const summaryReport: Array<{
    storeName: string;
    city: string;
    avgRating: number;
    count: number;
    distribution: Record<number, number>;
  }> = [];

  for (const store of allActiveStores) {
    const [stats] = await RatingModel.aggregate([
      { $match: { storeId: store._id, status: 'VISIBLE' } },
      {
        $group: {
          _id: '$storeId',
          averageRating: { $avg: '$value' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    const distributionAgg = await RatingModel.aggregate([
      { $match: { storeId: store._id, status: 'VISIBLE' } },
      {
        $group: {
          _id: '$value',
          count: { $sum: 1 },
        },
      },
    ]);

    const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distributionAgg.forEach((d) => {
      if (d._id >= 1 && d._id <= 5) dist[d._id] = d.count;
    });

    const averageRating = stats ? Math.round(stats.averageRating * 10) / 10 : 0;
    const ratingCount = stats?.ratingCount || 0;

    store.averageRating = averageRating;
    store.ratingCount = ratingCount;
    await store.save();

    if (affectedStoreIds.has(store._id.toString()) || targetStoreNames.includes(store.name)) {
      summaryReport.push({
        storeName: store.name,
        city: store.city,
        avgRating: averageRating,
        count: ratingCount,
        distribution: dist,
      });
    }
  }

  // 5. Seed Contextual Notifications for Owner & Demo User
  console.log('🔔 Seeding sample presentation notifications...');
  const primaryStore = storeMapByName.get('FC Road Heritage Bakery & Cafe');
  const primaryUser = userMapByEmail.get('sarvesh.user@example.com');

  if (primaryStore && primaryUser) {
    // Clean prior demo notifications for these two accounts to avoid duplicate clutter
    await NotificationModel.deleteMany({
      userId: { $in: [ownerUser._id, primaryUser._id] },
      title: { $in: ['Customer Rating Received', 'Store Owner Replied to Your Review'] },
    });

    await NotificationModel.create([
      {
        userId: ownerUser._id,
        type: 'NEW_RATING',
        title: 'Customer Rating Received',
        message: `A customer submitted a 5-star rating for ${primaryStore.name}.`,
        link: '/owner/dashboard',
        isRead: false,
        createdAt: getDateOffset(1),
      },
      {
        userId: primaryUser._id,
        type: 'REVIEW_REPLY',
        title: 'Store Owner Replied to Your Review',
        message: `The owner of ${primaryStore.name} replied to your review: "Thank you so much for the glowing review!..."`,
        link: `/stores/${primaryStore._id}`,
        isRead: false,
        createdAt: getDateOffset(1),
      },
    ]);
  }

  console.log('\n====================================================');
  console.log('🎉 DEMO RATINGS SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================\n');

  console.log('📋 SUMMARY OF SEEDED STORE RATINGS:');
  console.table(
    summaryReport.map((r) => ({
      'Store Name': r.storeName,
      City: r.city,
      'Avg ★': r.avgRating > 0 ? `${r.avgRating.toFixed(1)} ★` : '0.0 (New)',
      Reviews: r.count,
      '5★': r.distribution[5],
      '4★': r.distribution[4],
      '3★': r.distribution[3],
      '2★': r.distribution[2],
      '1★': r.distribution[1],
    }))
  );

  console.log('\n--- 🔑 PRESENTATION DEMO LOGIN CREDENTIALS ---');
  console.log('Store Owner (Dashboard & Analytics):');
  console.log('  Email:    sarvesh.owner@example.com');
  console.log('  Password: Password@123');
  console.log('  Access:   /owner/dashboard (Managed stores, analytics charts, customer ratings table, CSV export, review replies)\n');

  console.log('Normal User (Browse & Edit Existing Rating):');
  console.log('  Email:    sarvesh.user@example.com');
  console.log('  Password: Password@123');
  console.log('  Access:   /stores (Can edit ratings on "FC Road Bakery", submit brand-new rating on "Navi Peth Chaddar")\n');

  console.log('Platform Administrator (Moderation Queue & Audits):');
  console.log('  Email:    sarvesh.admin@example.com');
  console.log('  Password: Password@123');
  console.log('  Access:   /admin/dashboard\n');

  console.log('--- 💡 PRESENTATION HIGHLIGHTS ---');
  console.log('1. "FC Road Heritage Bakery & Cafe": 10 ratings, 4.6 ★ average, includes owner reply.');
  console.log('2. "Sitabuldi Tech & Mobile Plaza": Full 1 to 5 star spread (3.1 ★ avg) for demonstrating analytics trends & owner response.');
  console.log('3. "Navi Peth Handcrafted Chaddar & Towels" (Solapur): 0 ratings (Prism-clean empty state demo).');
  console.log('4. Owner Dashboard: Filter by date, view 60-day trend chart, export CSV, and reply to customer ratings.');
  console.log('----------------------------------------------------\n');
};

/**
 * Cleanup Demo Ratings Routine
 * Removes only demo ratings created by the demo users, leaves standard accounts safe,
 * and recalculates store aggregates.
 */
export const cleanDemoRatings = async () => {
  console.log('====================================================');
  console.log('🧹 RateLocal: Cleaning Demo Rating Data');
  console.log('====================================================\n');

  // Safety Check
  if (env.NODE_ENV === 'production' && !process.argv.includes('--force-production-demo')) {
    console.error('⛔ ERROR: Demo cleanup is restricted to development or test environments.');
    process.exit(1);
  }

  if (mongoose.connection.readyState === 0) {
    await connectDatabase();
  }
  console.log(`🔗 Target Database Host: ${mongoose.connection.host}`);
  console.log(`📦 Target Database Name: ${mongoose.connection.name}`);
  console.log(`🌍 Environment Mode:    ${env.NODE_ENV}\n`);

  const demoUserEmails = DEMO_USERS.map((u) => u.email.toLowerCase());
  const demoUsers = await UserModel.find({ email: { $in: demoUserEmails } });
  const demoUserIds = demoUsers.map((u) => u._id);

  if (demoUserIds.length === 0) {
    console.log('ℹ️ No demo users found.');
    return;
  }

  // Remove demo ratings created by these demo users
  const deleteResult = await RatingModel.deleteMany({ userId: { $in: demoUserIds } });
  console.log(`🗑️ Deleted ${deleteResult.deletedCount} demo ratings.`);

  // Clean demo-specific users created solely for ratings (with @demo.ratelocal.in)
  const userDeleteResult = await UserModel.deleteMany({ email: /@demo\.ratelocal\.in$/i });
  console.log(`🗑️ Removed ${userDeleteResult.deletedCount} auxiliary demo user accounts.`);

  // Recalculate aggregates for all stores
  console.log('📊 Recalculating store aggregates after cleanup...');
  const allStores = await StoreModel.find({ isActive: true });
  for (const store of allStores) {
    const [stats] = await RatingModel.aggregate([
      { $match: { storeId: store._id, status: 'VISIBLE' } },
      {
        $group: {
          _id: '$storeId',
          averageRating: { $avg: '$value' },
          ratingCount: { $sum: 1 },
        },
      },
    ]);

    store.averageRating = stats ? Math.round(stats.averageRating * 10) / 10 : 0;
    store.ratingCount = stats?.ratingCount || 0;
    await store.save();
  }

  console.log('✅ Demo rating data safely cleaned and store aggregates restored.');
};

// Standalone execution handler
if (require.main === module) {
  const isClean = process.argv.includes('--clean');
  const action = isClean ? cleanDemoRatings() : seedDemoRatings();

  action
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('❌ Operation failed:', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
