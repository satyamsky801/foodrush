/**
 * Seeds the FoodRush database with the frontend's mock data plus demo users.
 *
 *   npm run seed
 *
 * The script is idempotent: it wipes and re-seeds every collection.
 * Uses the same connection logic as the server — in-memory MongoDB when
 * MONGO_URI is unset, MongoDB Atlas otherwise.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import Coupon from '../models/Coupon.js';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import User from '../models/User.js';
import Address from '../models/Address.js';
import Order from '../models/Order.js';

// Frontend mock data (kept in sync with the app).
import { categories } from '../../../src/data/categories.js';
import { coupons } from '../../../src/data/coupons.js';
import { restaurants } from '../../../src/data/restaurants.js';

import { generateOrderId } from '../utils/orderId.js';
import { computeItemTotal, computeDeliveryFee, computeTax, computeBreakdown } from '../utils/pricing.js';

dotenv.config();

const DEMO_USERS = [
  {
    name: 'Admin',
    email: 'admin@foodrush.app',
    phone: '9000000001',
    password: 'admin123',
    role: 'admin',
  },
  {
    name: 'Spice Garden Owner',
    email: 'owner@foodrush.app',
    phone: '9000000002',
    password: 'owner123',
    role: 'restaurant',
  },
  {
    name: 'Ravi Kumar',
    email: 'delivery@foodrush.app',
    phone: '9000000003',
    password: 'delivery123',
    role: 'delivery',
  },
  {
    name: 'Demo User',
    email: 'demo@foodrush.app',
    phone: '9000000004',
    password: 'demo123',
    role: 'customer',
  },
];

/**
 * Seeds the database (wipes + re-inserts).
 * Exported so server.js can auto-seed an empty database on startup.
 */
export async function seedDatabase({ verbose = true } = {}) {
  const log = verbose ? console.log : () => {};

  log('🧹 Clearing existing data…');
  await Promise.all([
    Category.deleteMany({}),
    Coupon.deleteMany({}),
    Restaurant.deleteMany({}),
    Food.deleteMany({}),
    User.deleteMany({}),
    Address.deleteMany({}),
    Order.deleteMany({}),
  ]);

  // ── Categories (frontend uses `id`; the model stores it as `slug`) ──
  log(`📂 Seeding ${categories.length} categories…`);
  await Category.insertMany(
    categories.map((c) => ({ slug: c.id, name: c.name, emoji: c.emoji, tagline: c.tagline }))
  );

  // ── Coupons ───────────────────────────────────────────────────
  log(`🏷️  Seeding ${coupons.length} coupons…`);
  await Coupon.insertMany(coupons);

  // ── Restaurants + foods ───────────────────────────────────────
  log(`🏪 Seeding ${restaurants.length} restaurants…`);
  const restaurantMap = new Map(); // slug -> Restaurant doc
  let foodCount = 0;

  for (const r of restaurants) {
    const { menu, ...rest } = r;
    const restaurant = await Restaurant.create({ ...rest, slug: r.id });
    restaurantMap.set(r.id, restaurant);

    const foods = [];
    for (let si = 0; si < menu.length; si += 1) {
      const section = menu[si];
      for (let ii = 0; ii < section.items.length; ii += 1) {
        const item = section.items[ii];
        foods.push({
          restaurant: restaurant._id,
          name: item.name,
          description: item.description,
          price: item.price,
          veg: item.veg,
          rating: item.rating,
          ratingCount: item.ratingCount,
          category: item.category,
          section: section.category,
          sortOrder: si * 100 + ii,
          image: item.image || '',
          isBestseller: !!item.isBestseller,
          isRecommended: !!item.isRecommended,
          isAvailable: true,
          addons: item.addons || [],
          customizations: item.customizations || [],
        });
        foodCount += 1;
      }
    }
    await Food.insertMany(foods);
  }
  log(`🍽️  Seeded ${foodCount} food items.`);

  // ── Demo users ────────────────────────────────────────────────
  log('👤 Creating demo users…');
  const users = {};
  for (const u of DEMO_USERS) {
    const user = await User.create({
      name: u.name,
      email: u.email,
      phone: u.phone,
      password: u.password,
      role: u.role,
    });
    users[u.role] = user;
  }

  // Link the restaurant-owner account to Spice Garden.
  const spiceGarden = restaurantMap.get('spice-garden');
  users.restaurant.restaurant = spiceGarden._id;
  await users.restaurant.save();

  // Demo customer favourites.
  const royalBiryani = restaurantMap.get('royal-biryani-house');
  const southCafe = restaurantMap.get('south-indian-cafe');
  users.customer.favoriteRestaurants = [royalBiryani._id, southCafe._id];
  const butterChicken = await Food.findOne({ restaurant: spiceGarden._id, name: 'Butter Chicken' });
  if (butterChicken) users.customer.favoriteFoods = [butterChicken._id];
  await users.customer.save();

  // ── Demo address ──────────────────────────────────────────────
  log('📍 Creating demo address…');
  const demoAddress = await Address.create({
    user: users.customer._id,
    type: 'Home',
    name: 'Demo User',
    phone: '9000000004',
    street: '221, 12th Main Road',
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    landmark: 'Near ICICI Bank',
    isDefault: true,
  });

  // ── Demo order (delivered) for the dashboard & order history ──
  log('🧾 Creating a demo delivered order…');
  const items = await Food.find({ restaurant: spiceGarden._id }).limit(2);
  const lineItems = items.map((f) => ({
    food: f._id,
    name: f.name,
    image: f.image,
    veg: f.veg,
    unitPrice: f.price,
    addonTotal: 0,
    customTotal: 0,
    addons: [],
    customizations: [],
    quantity: 1,
  }));

  const total = computeItemTotal(lineItems);
  const deliveryFee = computeDeliveryFee(total, spiceGarden);
  const tax = computeTax(total);
  const breakdown = computeBreakdown({ total, deliveryFee, tax, discount: 0 });

  await Order.create({
    orderId: generateOrderId(),
    user: users.customer._id,
    restaurant: spiceGarden._id,
    items: lineItems,
    address: {
      type: demoAddress.type,
      name: demoAddress.name,
      phone: demoAddress.phone,
      street: demoAddress.street,
      area: demoAddress.area,
      city: demoAddress.city,
      pincode: demoAddress.pincode,
      landmark: demoAddress.landmark,
    },
    paymentMethod: 'upi',
    paymentStatus: 'paid',
    orderStatus: 'delivered',
    breakdown,
    estimatedDelivery: spiceGarden.deliveryTime,
    deliveryPartner: { name: 'Ravi Kumar', phone: '9000000003', rating: 4.8, vehicle: 'Bike' },
  });

  log('\n✅ Seed complete!\n');
  log('Demo logins:');
  log('  Admin      → admin@foodrush.app / admin123');
  log('  Restaurant → owner@foodrush.app / owner123');
  log('  Delivery   → delivery@foodrush.app / delivery123');
  log('  Customer   → demo@foodrush.app / demo123');
}

// Runs directly: `npm run seed`
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  (async () => {
    await connectDB();
    await seedDatabase();
    await mongoose.disconnect();
  })().catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
}
