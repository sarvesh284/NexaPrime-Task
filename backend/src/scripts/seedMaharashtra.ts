import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db';
import { StoreModel } from '../models/store.model';
import { UserModel } from '../models/user.model';
import { RatingModel } from '../models/rating.model';
import { PhotoModel } from '../models/photo.model';

interface DemoStoreSeedData {
  name: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  city: string;
  state: string;
  address: string;
  description: string;
  coordinates: { lat: number; lng: number };
  coverImage: string;
  sampleRatings: Array<{
    userName: string;
    value: number;
    comment: string;
  }>;
}

export const MAHARASHTRA_SAMPLE_STORES: DemoStoreSeedData[] = [
  // --- PUNE ---
  {
    name: 'FC Road Heritage Bakery & Cafe',
    email: 'contact@fcroadbakery.in',
    phone: '+91 20 2567 8901',
    website: 'https://fcroadbakery.in',
    category: 'Bakery & Cafe',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Shop 14, Goodluck Chowk, Fergusson College Road, Shivajinagar, Pune 411004',
    description: 'Iconic Pune cafe serving oven-fresh bun maska, Irani chai, artisanal pastries, and freshly brewed filter coffee since 1988.',
    coordinates: { lat: 18.5246, lng: 73.8415 },
    coverImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'Best bun maska and cold coffee on FC road! Classic nostalgic atmosphere.' },
      { userName: 'Avery Reviewer Inspector', value: 4, comment: 'Delicious baked goods, can get crowded in the evening.' },
    ],
  },
  {
    name: 'Koregaon Park Artisan Roasters',
    email: 'info@kpartisan.com',
    phone: '+91 20 4123 4567',
    website: 'https://kpartisan.com',
    category: 'Food & Beverage',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Lane 6, Near Osho Garden, Koregaon Park, Pune 411001',
    description: 'Third-wave specialty coffee house featuring single-origin Indian arabicas, pour-overs, sourdough toasts, and lush garden seating.',
    coordinates: { lat: 18.5362, lng: 73.894 },
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'Phenomenal specialty coffee and tranquil open-air ambiance.' },
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'The Ethiopian and Chikmagalur pour-overs are unmatched in Pune.' },
    ],
  },
  {
    name: 'Kothrud Organic Farmer Produce',
    email: 'care@kothrudorganic.in',
    phone: '+91 20 2538 9012',
    website: 'https://kothrudorganic.in',
    category: 'Groceries',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Plot 42, Ideal Colony, Paud Road, Kothrud, Pune 411038',
    description: 'Direct-from-farm certified organic supermarket with fresh Sahyadri vegetables, Alphonso mangoes, cold-pressed oils, and millets.',
    coordinates: { lat: 18.5074, lng: 73.8077 },
    coverImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 5, comment: 'Super fresh vegetables and genuinely cold-pressed peanut oil.' },
    ],
  },
  {
    name: 'Hinjawadi TechGear Hub',
    email: 'support@techgearhinjawadi.com',
    phone: '+91 20 6791 2233',
    website: 'https://techgearhinjawadi.com',
    category: 'Electronics',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Survey 28, Phase 1, Rajiv Gandhi Infotech Park, Hinjawadi, Pune 411057',
    description: 'Premier electronics and PC hardware showroom catering to IT professionals with custom mechanical keyboards, laptops, and networking gear.',
    coordinates: { lat: 18.5912, lng: 73.7389 },
    coverImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 4, comment: 'Prompt service and excellent selection of mechanical keyboards.' },
    ],
  },
  {
    name: 'Viman Nagar Gourmet Spices & Dry Fruits',
    email: 'contact@vimanspices.com',
    phone: '+91 20 2663 1122',
    website: 'https://vimanspices.com',
    category: 'Groceries',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Near Symbiosis Campus, Central Avenue, Viman Nagar, Pune 411014',
    description: 'Traditional spice merchant offering stone-ground Kolhapuri masalas, premium Kashmiri saffron, Californian almonds, and roasted dry fruits.',
    coordinates: { lat: 18.5679, lng: 73.9143 },
    coverImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'Authentic Maharashtrian goda masala and top-tier dry fruits.' },
    ],
  },

  // --- MUMBAI ---
  {
    name: 'Marine Drive Coastal Bistro',
    email: 'reservations@marinedrivebistro.com',
    phone: '+91 22 2281 9090',
    website: 'https://marinedrivebistro.com',
    category: 'Dining',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Queens Necklace Promenade, Nariman Point, Mumbai 400021',
    description: 'Iconic sea-facing restaurant celebrated for authentic Malvani seafood, Bombay duck fry, Solkadhi, and panoramic Arabian Sea views.',
    coordinates: { lat: 18.9438, lng: 72.8232 },
    coverImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'The Surmai fry and Solkadhi against the sunset view is unbeatable.' },
      { userName: 'Avery Reviewer Inspector', value: 5, comment: 'Exquisite coastal dining experience in south Mumbai.' },
    ],
  },
  {
    name: 'Bandra Artisan Bookstore & Tea House',
    email: 'hello@bandrabooks.in',
    phone: '+91 22 2642 7711',
    website: 'https://bandrabooks.in',
    category: 'Books & Stationery',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: '52 Hill Road, Near Mehboob Studio, Bandra West, Mumbai 400050',
    description: 'Charming community independent bookstore with contemporary Indian literature, poetry collections, matcha lattes, and weekend book clubs.',
    coordinates: { lat: 19.0596, lng: 72.8295 },
    coverImage: 'https://images.unsplash.com/photo-1507842229452-772d1c862bc9?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'A reader paradise in Bandra. Great collection of Marathi and English titles.' },
    ],
  },
  {
    name: 'Fort Heritage Horology & Leather',
    email: 'curator@forthorology.com',
    phone: '+91 22 2265 4321',
    website: 'https://forthorology.com',
    category: 'Retail',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Flora Fountain Junction, DN Road, Fort, Mumbai 400001',
    description: 'Vintage clock restoration and bespoke handcrafted leather bags in a Victorian heritage building at the historic heart of Mumbai.',
    coordinates: { lat: 18.9284, lng: 72.8331 },
    coverImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 4, comment: 'Masterful craftsmanship and attention to historical detail.' },
    ],
  },
  {
    name: 'Dadar Swadeshi Khadi & Handlooms',
    email: 'dadarkhadi@swadeshihandloom.in',
    phone: '+91 22 2430 8855',
    website: 'https://swadeshihandloom.in',
    category: 'Textiles & Fashion',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Opposite Plaza Cinema, NC Kelkar Road, Dadar West, Mumbai 400028',
    description: 'Government-certified handloom emporium offering genuine Paithani sarees, pure cotton kurtas, silk shawls, and handmade home linens.',
    coordinates: { lat: 19.0213, lng: 72.8424 },
    coverImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'Authentic pure silk Paithani with certified zari work. Highly trusted.' },
    ],
  },
  {
    name: 'Powai Green Organics & Superfood',
    email: 'orders@powaigreen.com',
    phone: '+91 22 2570 3344',
    website: 'https://powaigreen.com',
    category: 'Groceries',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'High Street, Hiranandani Gardens, Powai, Mumbai 400076',
    description: 'Modern organic grocery store featuring A2 Gir cow ghee, chemical-free pulses, cold-pressed juices, and healthy superfoods.',
    coordinates: { lat: 19.1197, lng: 72.9056 },
    coverImage: 'https://images.unsplash.com/photo-1543083477-4f785aeafaa9?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 4, comment: 'Premium organic grocery selection, very convenient location.' },
    ],
  },

  // --- KOLHAPUR ---
  {
    name: 'Mahadwar Traditional Kolhapuri Chappals',
    email: 'info@mahadwarchappals.com',
    phone: '+91 231 254 1122',
    website: 'https://mahadwarchappals.com',
    category: 'Footwear & Craft',
    city: 'Kolhapur',
    state: 'Maharashtra',
    address: 'Bhavani Mandap Road, Mahadwar, Kolhapur 416012',
    description: 'World-renowned GI-tagged Kolhapuri leather chappals handcrafted by generational artisans with vegetable dyes and ornate braided patterns.',
    coordinates: { lat: 16.6944, lng: 74.2235 },
    coverImage: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'Authentic handmade Kolhapuri chappals. The leather quality is remarkable.' },
      { userName: 'Avery Reviewer Inspector', value: 5, comment: 'Must-visit place in Kolhapur! Bought three pairs.' },
    ],
  },
  {
    name: 'Rajarampuri Royal Misal & Thali House',
    email: 'taste@rajarampurimisal.in',
    phone: '+91 231 252 6677',
    website: 'https://rajarampurimisal.in',
    category: 'Dining',
    city: 'Kolhapur',
    state: 'Maharashtra',
    address: '2nd Lane, Rajarampuri, Kolhapur 416008',
    description: 'Celebrated eatery famous for spicy Kolhapuri misal pav, fiery Tambada & Pandhara rassa, and rich mutton thali prepared with secret local spices.',
    coordinates: { lat: 16.6892, lng: 74.2468 },
    coverImage: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'Unreal Pandhra Rassa! Authentic Kolhapuri taste with perfect fiery punch.' },
    ],
  },
  {
    name: 'Shahupuri Jaggery & Dry Grocery Exchange',
    email: 'contact@shahupurijaggery.com',
    phone: '+91 231 265 9900',
    website: 'https://shahupurijaggery.com',
    category: 'Groceries',
    city: 'Kolhapur',
    state: 'Maharashtra',
    address: 'Market Yard Road, Shahupuri, Kolhapur 416001',
    description: 'Historic trade store providing premium organic Kolhapuri gul (jaggery), sugarcane derivatives, and authentic roasted groundnut chikki.',
    coordinates: { lat: 16.7028, lng: 74.2411 },
    coverImage: 'https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'Natural chemical-free jaggery blocks straight from the Kolhapur market yard.' },
    ],
  },
  {
    name: 'Tarabai Park Pure Silver & Jewelry Emporium',
    email: 'heritage@tarabaisilver.in',
    phone: '+91 231 266 3322',
    website: 'https://tarabaisilver.in',
    category: 'Jewelry & Gifts',
    city: 'Kolhapur',
    state: 'Maharashtra',
    address: 'Plot 18, Tarabai Park, Kolhapur 416003',
    description: 'Specialists in authentic Kolhapur Saaj necklaces, traditional Maharashtrian bridal ornaments, and pure 925 sterling silver giftware.',
    coordinates: { lat: 16.7112, lng: 74.2384 },
    coverImage: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 5, comment: 'Exquisite Kolhapuri Saaj jewelry with hallmark certification.' },
    ],
  },

  // --- SANGLI ---
  {
    name: 'Ganpati Peth Turmeric & Spice Exchange',
    email: 'turmeric@ganpatipeth.com',
    phone: '+91 233 237 4411',
    website: 'https://ganpatipethspices.com',
    category: 'Groceries',
    city: 'Sangli',
    state: 'Maharashtra',
    address: 'Main Bazaar, Ganpati Peth, Sangli 416416',
    description: 'Located in the Turmeric City of Maharashtra, offering high-curcumin Rajapuri turmeric powder, raw rhizomes, and fragrant whole spices.',
    coordinates: { lat: 16.8524, lng: 74.5682 },
    coverImage: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'The highest quality turmeric in India. Fragrant and rich golden yellow.' },
    ],
  },
  {
    name: 'Vishrambag Tech & Student Hub',
    email: 'sales@vishrambagtech.in',
    phone: '+91 233 260 1199',
    website: 'https://vishrambagtech.in',
    category: 'Electronics',
    city: 'Sangli',
    state: 'Maharashtra',
    address: 'Near Walchand College, Vishrambag, Sangli 416415',
    description: 'Top electronics, laptop repair, and engineering accessories showroom serving university students and local tech enthusiasts.',
    coordinates: { lat: 16.8458, lng: 74.6015 },
    coverImage: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 4, comment: 'Fair pricing and very quick laptop SSD upgrades.' },
    ],
  },
  {
    name: 'Haripur Organic Vineyards & Raisins',
    email: 'contact@haripurraisins.com',
    phone: '+91 233 241 8822',
    website: 'https://haripurraisins.com',
    category: 'Groceries',
    city: 'Sangli',
    state: 'Maharashtra',
    address: 'Haripur Sangam Road, Sangli 416416',
    description: 'Farm-direct golden, green, and black raisins dried under the Krishna river valley sunshine without chemical additives.',
    coordinates: { lat: 16.8431, lng: 74.5519 },
    coverImage: 'https://images.unsplash.com/photo-1595231776515-ddffb1f4eb73?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'Plump and sweet natural raisins directly from local vineyards.' },
    ],
  },

  // --- NASHIK ---
  {
    name: 'College Road Gourmet Bistro & Cafe',
    email: 'hello@collegeroadbistro.in',
    phone: '+91 253 231 5566',
    website: 'https://collegeroadbistro.in',
    category: 'Dining',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Opposite BYK College, College Road, Nashik 422005',
    description: 'Popular youth cafe offering continental breakfast, wood-fired Neapolitan pizzas, craft mocktails, and decadent brownies.',
    coordinates: { lat: 20.0063, lng: 73.7628 },
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'Best wood-fired pizza in Nashik! Wonderful ambiance on College Road.' },
    ],
  },
  {
    name: 'Panchavati Heritage Ayurvedic Pharmacy',
    email: 'care@panchavatiayurveda.in',
    phone: '+91 253 251 2244',
    website: 'https://panchavatiayurveda.in',
    category: 'Healthcare & Wellness',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Near Ramkund, Godavari Ghat, Panchavati, Nashik 422003',
    description: 'Centuries-old family dispensary providing classical Ayurvedic churnas, medicated hair oils, pure honey, and wellness herbal teas.',
    coordinates: { lat: 20.0125, lng: 73.7912 },
    coverImage: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 5, comment: 'Pure authentic herbal medicines and knowledgeable Ayurvedic vaidyas.' },
    ],
  },
  {
    name: 'Gangapur Valley Vineyard Farmstand',
    email: 'visit@gangapurfarmstand.com',
    phone: '+91 253 222 9988',
    website: 'https://gangapurfarmstand.com',
    category: 'Food & Beverage',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Gangapur Dam Catchment Road, Nashik 422222',
    description: 'Boutique estate farmstand showcasing sparkling grape juices, cheese tasting platters, and local wine country preserves.',
    coordinates: { lat: 20.0189, lng: 73.7495 },
    coverImage: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 4, comment: 'Scenic location overlooking the water with lovely grape juices.' },
    ],
  },

  // --- NAGPUR ---
  {
    name: 'Dharampeth Citrus & Sweet Mart',
    email: 'orders@dharampethsweets.in',
    phone: '+91 712 254 3311',
    website: 'https://dharampethsweets.in',
    category: 'Bakery & Sweets',
    city: 'Nagpur',
    state: 'Maharashtra',
    address: 'West High Court Road, Dharampeth, Nagpur 440010',
    description: 'Home of the legendary Nagpur Orange Burfi, hand-churned Shrikhand, roasted Tarri Poha, and rich mawa sweets.',
    coordinates: { lat: 21.1442, lng: 79.0628 },
    coverImage: 'https://images.unsplash.com/photo-1579372786545-d24232daf58c?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'The orange burfi melts in your mouth! Authentic Nagpur souvenir.' },
    ],
  },
  {
    name: 'Sitabuldi Tech & Mobile Plaza',
    email: 'support@sitabuldimobile.com',
    phone: '+91 712 252 8877',
    website: 'https://sitabuldimobile.com',
    category: 'Electronics',
    city: 'Nagpur',
    state: 'Maharashtra',
    address: 'Sitabuldi Main Road, Nagpur 440012',
    description: 'Comprehensive electronics emporium featuring flagship smartphones, tablet accessories, screen protectors, and certified repair.',
    coordinates: { lat: 21.1466, lng: 79.0832 },
    coverImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 4, comment: 'Huge range of mobile accessories and prompt phone screen service.' },
    ],
  },
  {
    name: 'Sadar Saoji Kitchen & Dining',
    email: 'taste@sadarsaoji.in',
    phone: '+91 712 256 1234',
    website: 'https://sadarsaoji.in',
    category: 'Dining',
    city: 'Nagpur',
    state: 'Maharashtra',
    address: 'Residency Road, Sadar Bazaar, Nagpur 440001',
    description: 'Traditional Vidarbha restaurant celebrated for its fiery Saoji chicken curry, rotis, and aromatic garam masala preparations.',
    coordinates: { lat: 21.1611, lng: 79.0795 },
    coverImage: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'Bold, fiery Saoji masala done to perfection. Outstanding flavor.' },
    ],
  },

  // --- CHHATRAPATI SAMBHAJINAGAR (AURANGABAD) ---
  {
    name: 'Himroo & Paithani Weaving Emporium',
    email: 'heritage@himrooweaves.in',
    phone: '+91 240 233 4455',
    website: 'https://himrooweaves.in',
    category: 'Textiles & Fashion',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    address: 'Near Zafar Gate, Old Mondha, Chhatrapati Sambhajinagar 431001',
    description: 'Traditional heritage loom manufacturing certified Himroo shawls, silk brocades, and genuine Yeola-style Paithani sarees.',
    coordinates: { lat: 19.8824, lng: 75.3512 },
    coverImage: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'Exquisite Himroo shawls. True living artistic heritage of Maharashtra.' },
    ],
  },
  {
    name: 'Prozone Artisan Coffee & Roastery',
    email: 'info@prozonecoffee.in',
    phone: '+91 240 661 7890',
    website: 'https://prozonecoffee.in',
    category: 'Bakery & Cafe',
    city: 'Chhatrapati Sambhajinagar',
    state: 'Maharashtra',
    address: 'Chikalthana MIDC Road, Chhatrapati Sambhajinagar 431006',
    description: 'Modern relaxed cafe with artisan espresso, iced cold brews, sourdough sandwiches, and fresh waffle platters.',
    coordinates: { lat: 19.8732, lng: 75.3671 },
    coverImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Avery Reviewer Inspector', value: 4, comment: 'Lively atmosphere, great cold brew and friendly staff.' },
    ],
  },

  // --- SATARA ---
  {
    name: 'Powai Naka Kandi Pedha Bhandar',
    email: 'pedha@sataraheritage.in',
    phone: '+91 2162 234 567',
    website: 'https://satarakandipedha.in',
    category: 'Bakery & Sweets',
    city: 'Satara',
    state: 'Maharashtra',
    address: 'Powai Naka Chowk, Satara 415001',
    description: 'Home of the historic GI-recognized Satara Kandi Pedha made from slow-caramelized buffalo milk mawa and natural green cardamom.',
    coordinates: { lat: 17.6885, lng: 73.9982 },
    coverImage: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Sarvesh User Demonstrator', value: 5, comment: 'The signature caramelized Satara Kandi pedha is world-class.' },
    ],
  },

  // --- SOLAPUR ---
  {
    name: 'Navi Peth Handcrafted Chaddar & Towels',
    email: 'sales@solapurchaddar.in',
    phone: '+91 217 272 1144',
    website: 'https://solapurchaddar.in',
    category: 'Textiles & Fashion',
    city: 'Solapur',
    state: 'Maharashtra',
    address: 'Navi Peth Textile Market, Solapur 413007',
    description: 'Certified manufacturer of the world-famous Solapur Chaddars, jacquard bedsheets, and thick cotton terry towels.',
    coordinates: { lat: 17.6715, lng: 75.9064 },
    coverImage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
    sampleRatings: [
      { userName: 'Morgan Taylor Consumerist', value: 5, comment: 'Incredible durability and vibrant geometric patterns on authentic Solapuri sheets.' },
    ],
  },
];

export const seedMaharashtraStores = async () => {
  console.log('🇮🇳 Starting Maharashtra Sample Stores & Photos Seeding...');
  await connectDatabase();

  // Find demo users for review association
  const users = await UserModel.find({
    email: {
      $in: [
        'sarvesh.user@example.com',
        'reviewer@example.com',
        'morgan.taylor@example.com',
      ],
    },
  });

  const userMap = new Map<string, mongoose.Types.ObjectId>();
  users.forEach((u) => {
    userMap.set(u.name, u._id);
    userMap.set(u.email, u._id);
  });

  // Fallback to first user found if demo name doesn't match
  const defaultUserId = users[0]?._id;

  // Find store owner
  const owner = await UserModel.findOne({ role: 'STORE_OWNER' });
  const ownerId = owner?._id;

  let createdCount = 0;
  let updatedCount = 0;

  for (const data of MAHARASHTRA_SAMPLE_STORES) {
    // Check if store already exists by name (idempotent upsert)
    let store = await StoreModel.findOne({ name: data.name });

    if (store) {
      // Update existing record
      store.email = data.email;
      store.phone = data.phone;
      store.website = data.website;
      store.category = data.category;
      store.city = data.city;
      store.state = data.state;
      store.address = data.address;
      store.description = data.description;
      store.coordinates = data.coordinates;
      store.coverImage = data.coverImage;
      store.isDemo = true;
      store.isActive = true;
      if (ownerId && !store.ownerId) {
        store.ownerId = ownerId;
      }
      await store.save();
      updatedCount++;
    } else {
      // Create new demo store
      store = await StoreModel.create({
        name: data.name,
        email: data.email,
        phone: data.phone,
        website: data.website,
        category: data.category,
        city: data.city,
        state: data.state,
        address: data.address,
        description: data.description,
        coordinates: data.coordinates,
        coverImage: data.coverImage,
        ownerId: ownerId || undefined,
        isActive: true,
        isDemo: true,
        averageRating: 0,
        ratingCount: 0,
      });
      createdCount++;
    }

    // Seed sample photo in PhotoModel for the gallery
    const existingPhoto = await PhotoModel.findOne({
      storeId: store._id,
      url: data.coverImage,
    });

    if (!existingPhoto && defaultUserId) {
      await PhotoModel.create({
        storeId: store._id,
        userId: defaultUserId,
        url: data.coverImage,
        storageKey: `demo/maharashtra/${store._id}`,
        storageProvider: 'local',
        caption: `${data.name} — Storefront & Interior`,
        isCover: true,
        isOfficial: true,
        status: 'APPROVED',
      });
    }

    // Seed sample reviews/ratings
    for (const r of data.sampleRatings) {
      const reviewerId = userMap.get(r.userName) || defaultUserId;
      if (!reviewerId) continue;

      const existingRating = await RatingModel.findOne({
        storeId: store._id,
        userId: reviewerId,
      });

      if (!existingRating) {
        await RatingModel.create({
          storeId: store._id,
          userId: reviewerId,
          value: r.value,
          comment: r.comment,
          status: 'VISIBLE',
          helpfulCount: 1,
          helpfulVotes: [],
        });
      }
    }

    // Recalculate averageRating and ratingCount for store
    const ratings = await RatingModel.find({ storeId: store._id, status: 'VISIBLE' });
    if (ratings.length > 0) {
      const sum = ratings.reduce((acc, curr) => acc + curr.value, 0);
      const avg = Math.round((sum / ratings.length) * 10) / 10;
      store.averageRating = avg;
      store.ratingCount = ratings.length;
      await store.save();
    }
  }

  console.log(`✅ Maharashtra Seeding Completed: ${createdCount} created, ${updatedCount} updated.`);
  console.log(`📍 Total Demo Stores Seeded: ${MAHARASHTRA_SAMPLE_STORES.length} across Mumbai, Pune, Kolhapur, Sangli, Nashik, Nagpur, Sambhajinagar, Satara, Solapur.`);
};

export const cleanMaharashtraDemoStores = async () => {
  console.log('🧹 Cleaning Maharashtra demo stores...');
  await connectDatabase();

  const demoStores = await StoreModel.find({ isDemo: true });
  const demoStoreIds = demoStores.map((s) => s._id);

  if (demoStoreIds.length === 0) {
    console.log('ℹ️ No demo stores found to clean.');
    return;
  }

  // Safely delete only demo ratings and demo photos
  await RatingModel.deleteMany({ storeId: { $in: demoStoreIds } });
  await PhotoModel.deleteMany({ storeId: { $in: demoStoreIds } });
  await StoreModel.deleteMany({ _id: { $in: demoStoreIds } });

  console.log(`🗑️ Successfully deleted ${demoStoreIds.length} demo stores and associated demo reviews without touching real user data.`);
};

// Standalone execution handler
if (require.main === module) {
  const isClean = process.argv.includes('--clean');
  const action = isClean ? cleanMaharashtraDemoStores() : seedMaharashtraStores();

  action
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('Operation failed:', err);
      await disconnectDatabase();
      process.exit(1);
    });
}
