/* Captures README screenshots of the app (light + dark, seeded cart/order). */
import { mkdirSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:5173';
const OUT = 'screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu'],
  defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 1.5 },
});

const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const shoot = async (path, file, { fullPage = true, waitFor = null } = {}) => {
  await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  if (waitFor) await page.waitForFunction((t) => document.body.innerText.includes(t), { timeout: 10000 }, waitFor);
  await wait(2200); // let images + animations settle
  await page.screenshot({ path: `${OUT}/${file}`, fullPage });
  console.log('captured', file);
};

// Seed a logged-in demo session with a cart, address and a live order.
const seed = async (theme) => {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => {
    localStorage.setItem('foodrush_settings', JSON.stringify({ theme: t }));
    localStorage.setItem('foodrush_user', JSON.stringify({
      id: 'u_demo', name: 'Riya Kapoor', email: 'riya@foodrush.demo', phone: '9876501234', provider: 'email',
    }));
    localStorage.setItem('foodrush_cart', JSON.stringify({
      restaurantId: 'royal-biryani-house',
      restaurantName: 'Royal Biryani House',
      items: [
        {
          key: 'k1', id: 'rbh-chicken-biryani', name: 'Hyderabadi Chicken Biryani',
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=640&q=80',
          veg: false, unitPrice: 319, addons: [{ id: 'extra-raita', name: 'Extra raita', price: 30 }],
          addonTotal: 30, customTotal: 0, customizations: [{ id: 'spice', name: 'Spice level', optionId: 'medium', optionName: 'Medium', price: 0 }],
          quantity: 2,
        },
        {
          key: 'k2', id: 'rbh-chicken-65', name: 'Chicken 65',
          image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=640&q=80',
          veg: false, unitPrice: 279, addons: [], addonTotal: 0, customTotal: 0, customizations: [], quantity: 1,
        },
      ],
    }));
    localStorage.setItem('foodrush_addresses', JSON.stringify([
      { id: 'addr1', type: 'Home', name: 'Riya Kapoor', phone: '9876501234', street: '221, 12th Main', area: 'Indiranagar', city: 'Bengaluru', pincode: '560038', landmark: 'Near Metro', isDefault: true },
    ]));
    localStorage.setItem('foodrush_orders', JSON.stringify([{
      id: 'FR102457',
      restaurantId: 'royal-biryani-house',
      restaurantName: 'Royal Biryani House',
      restaurantImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
      items: [
        {
          key: 'k1', id: 'rbh-chicken-biryani', name: 'Hyderabadi Chicken Biryani',
          image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=640&q=80',
          veg: false, unitPrice: 319, addons: [], addonTotal: 0, customTotal: 0, customizations: [], quantity: 2,
        },
      ],
      address: { name: 'Riya Kapoor', phone: '9876501234', street: '221, 12th Main', area: 'Indiranagar', city: 'Bengaluru', pincode: '560038' },
      paymentMethod: 'upi',
      couponCode: 'WELCOME50',
      breakdown: { total: 638, deliveryFee: 40, tax: 32, discount: 100, grandTotal: 610 },
      deliveryPartner: { name: 'Rahul Kumar', phone: '+91 98450 12345', rating: 4.8, vehicle: 'KA 01 AB 2345' },
      placedAt: Date.now() - 20 * 1000,
      estimatedDelivery: '30–40 min',
    }]));
  }, theme);
};

// Light mode shots
await seed('light');
await shoot('/', 'home.png', { waitFor: 'Popular restaurants near you' });
await shoot('/restaurants?category=biryani', 'restaurants.png', { waitFor: 'restaurants near you' });
await shoot('/restaurant/royal-biryani-house', 'restaurant.png', { waitFor: 'Hyderabadi Chicken Biryani' });
await shoot('/cart', 'cart.png', { waitFor: 'Bill details' });
await shoot('/order/FR102457', 'tracking.png', { waitFor: 'Your delivery partner' });
await page.evaluate(() => { localStorage.removeItem('foodrush_user'); });
await shoot('/login', 'login.png', { waitFor: 'Welcome back' });
await shoot('/profile', 'profile.png', { waitFor: 'Login to view your profile' });

// Dark mode home
await seed('dark');
await shoot('/', 'home-dark.png', { waitFor: 'Popular restaurants near you' });

console.log('console errors:', errors.length ? errors.slice(0, 5) : 'NONE');
await browser.close();
