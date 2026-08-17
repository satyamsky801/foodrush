/**
 * Restaurant dashboard E2E — runs against the dev server + backend.
 * Flow: login as restaurant owner → /restaurant → dashboard stats/charts →
 * orders (accept → preparing → ready) → menu (add/edit/toggle/delete food) →
 * profile → reviews → analytics → dark mode → mobile 390px → role guard.
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:5173';
const results = [];

const check = (name, ok, extra = '') => {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
};

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fn, { timeout = 15000, label = 'condition' } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      if (await fn()) return;
    } catch {
      /* retry */
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for: ${label}`);
}

const texts = (page, sel) =>
  page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.textContent.trim()), sel);

async function clickByText(page, textMatch, { selector = 'button, a' } = {}) {
  const clicked = await page.evaluate(
    (sel, tm) => {
      const els = [...document.querySelectorAll(sel)];
      const el = els.find((e) => e.textContent.trim().toLowerCase().includes(tm.toLowerCase()));
      if (el) {
        el.click();
        return true;
      }
      return false;
    },
    selector,
    textMatch
  );
  if (!clicked) throw new Error(`Could not click element matching "${textMatch}"`);
}

async function main() {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => msg.type() === 'error' && consoleErrors.push(msg.text()));
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  // --- Login as restaurant owner ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => !!document.querySelector('form')));
  await page.evaluate(() => {
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('form input')];
    const id = inputs.find((i) => i.placeholder?.toLowerCase().includes('email') || i.type === 'email' || i.type === 'text');
    const pass = inputs.find((i) => i.type === 'password');
    if (id) setVal(id, 'owner@foodrush.app');
    if (pass) setVal(pass, 'owner123');
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname === '/'), { timeout: 20000, label: 'owner login' });
  check('Restaurant owner login succeeds', true);

  // --- Navbar shows Restaurant Dashboard link ---
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Account menu');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Restaurant Dashboard')), { label: 'dropdown link' });
  check('Restaurant Dashboard link in user menu', true);

  // --- Dashboard ---
  await page.goto(`${BASE}/restaurant`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes("Today's orders")), { label: 'restaurant dashboard' });
  const statLabels = await texts(page, '.card p.text-xs');
  check(
    'Dashboard stat cards present',
    ["Today's orders", "Today's revenue", 'Pending orders', 'Preparing', 'Completed', 'Menu items', 'Restaurant rating', 'Total revenue'].every(
      (l) => statLabels.some((s) => s.includes(l))
    ),
    statLabels.join(', ')
  );
  const bodyText = await page.evaluate(() => document.body.textContent);
  check('Dashboard shows Spice Garden identity', bodyText.includes('Spice Garden'), 'Spice Garden');
  check('Charts render', bodyText.includes('Daily orders') && bodyText.includes('Popular foods'));

  // --- Orders page: accept → preparing → ready ---
  await page.goto(`${BASE}/restaurant/orders`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Orders')), { label: 'orders page' });

  // Create a fresh order via API as the demo customer so we have a "placed" order to accept.
  const placed = await page.evaluate(async () => {
    const token = localStorage.getItem('foodrush_token');
    const login = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'demo@foodrush.app', password: 'demo123' }),
    }).then((r) => r.json());
    const me = await fetch('/api/restaurants/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    const rid = me.restaurant._id;
    const foods = await fetch(`/api/foods?restaurant=${rid}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
    const addr = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${login.token}` } }).then((r) => r.json());
    const order = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` },
      body: JSON.stringify({
        restaurantId: rid,
        addressId: addr.addresses[0]._id,
        paymentMethod: 'cod',
        items: [{ foodId: foods.foods[0]._id, quantity: 1, addons: [], customizations: [] }],
      }),
    }).then((r) => r.json());
    return order.success ? order.order.orderId : null;
  });
  check('Place a fresh order via API', Boolean(placed), placed || '');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate((oid) => document.body.textContent.includes(oid), placed), { label: 'new order visible' });
  check('New incoming order appears in the list', true);

  // Accept the order (first "placed" order row)
  const acceptBtn = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Accept order');
    if (btn) { btn.click(); return true; }
    return false;
  });
  check('Accept button available', acceptBtn);
  await wait(900);
  check('Order status → Accepted', await page.evaluate(() => document.body.textContent.includes('Accepted')), 'Accepted');

  // Mark preparing
  const prepBtn = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Start preparing');
    if (btn) { btn.click(); return true; }
    return false;
  });
  check('Start preparing button available', prepBtn);
  await wait(900);
  check('Order status → Preparing', await page.evaluate(() => document.body.textContent.includes('Preparing')), 'Preparing');

  // Mark ready
  const readyBtn = await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Mark ready');
    if (btn) { btn.click(); return true; }
    return false;
  });
  check('Mark ready button available', readyBtn);
  await wait(900);
  check('Order status → Ready', await page.evaluate(() => document.body.textContent.includes('Ready')), 'Ready');

  // --- Menu page: add food ---
  await page.goto(`${BASE}/restaurant/foods`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Menu')), { label: 'menu page' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Paneer Tikka') || document.body.textContent.includes('Butter Chicken')), { label: 'menu items' });
  check('Menu shows existing dishes', true);

  const stamp = Date.now().toString().slice(-5);
  const dishName = `E2E Special ${stamp}`;
  await clickByText(page, 'Add dish');
  await waitFor(page, () => page.evaluate(() => !!document.querySelector('[role="dialog"]')), { label: 'add dish modal' });
  await page.evaluate((name) => {
    const set = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const dialog = document.querySelector('[role="dialog"]');
    const inputs = [...dialog.querySelectorAll('input')];
    set(inputs[0], name); // name
    set(inputs[1], '249'); // price
  }, dishName);
  await clickByText(page, 'Add to menu');
  await waitFor(page, () => page.evaluate((n) => document.body.textContent.includes(n), dishName), { label: 'new dish appears' });
  check('Add dish works', true);

  // Toggle availability (unavailable) — the toggle is on the card containing the dish
  const toggled = await page.evaluate((n) => {
    const card = [...document.querySelectorAll('.card')].find((c) => c.textContent.includes(n));
    const btn = card ? [...card.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Available') : null;
    if (btn) { btn.click(); return true; }
    return false;
  }, dishName);
  check('Toggle availability available', toggled);
  await wait(900);
  check('Dish toggled to Unavailable', await page.evaluate((n) => {
    const card = [...document.querySelectorAll('.card')].find((c) => c.textContent.includes(n));
    return card ? card.textContent.includes('Unavailable') : false;
  }, dishName), 'Unavailable');

  // --- Profile page ---
  await page.goto(`${BASE}/restaurant/profile`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Restaurant profile')), { label: 'profile page' });
  check('Profile page renders', true);
  await clickByText(page, 'Save changes');
  await wait(900);
  check('Profile save works', await page.evaluate(() => document.body.textContent.includes('updated') || document.body.textContent.includes('Saved')), '');

  // --- Reviews page ---
  await page.goto(`${BASE}/restaurant/reviews`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Reviews')), { label: 'reviews page' });
  check('Reviews page renders with summary', await page.evaluate(() => document.body.textContent.includes('rating') || document.body.textContent.includes('review')), '');

  // --- Analytics page ---
  await page.goto(`${BASE}/restaurant/analytics`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Total orders')), { label: 'analytics page' });
  check('Analytics page renders with charts', await page.evaluate(() => document.body.textContent.includes('Daily orders') && document.body.textContent.includes('Popular foods')), '');

  // --- Mobile 390px ---
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE}/restaurant`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes("Today's orders")), { label: 'mobile dashboard' });
  const { overflow } = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  check('Mobile 390px — no horizontal overflow', !overflow);

  // --- Dark mode toggle ---
  const themeBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /light mode|dark mode/i.test(b.getAttribute('aria-label') || ''));
    if (btn) btn.click();
  });
  await wait(700);
  const themeAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  check('Dark mode toggle works', themeBefore !== themeAfter, `dark ${themeBefore} → ${themeAfter}`);

  // --- Role guard: customer cannot access /restaurant ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('form input')];
    const id = inputs.find((i) => i.placeholder?.toLowerCase().includes('email') || i.type === 'email' || i.type === 'text');
    const pass = inputs.find((i) => i.type === 'password');
    if (id) setVal(id, 'demo@foodrush.app');
    if (pass) setVal(pass, 'demo123');
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname === '/'), { timeout: 20000, label: 'customer login' });
  await page.goto(`${BASE}/restaurant`, { waitUntil: 'domcontentloaded' });
  await wait(1200);
  const path = await page.evaluate(() => window.location.pathname);
  check('Customer redirected away from /restaurant', path !== '/restaurant', `path=${path}`);

  // --- Admin still has access ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('form input')];
    const id = inputs.find((i) => i.placeholder?.toLowerCase().includes('email') || i.type === 'email' || i.type === 'text');
    const pass = inputs.find((i) => i.type === 'password');
    if (id) setVal(id, 'admin@foodrush.app');
    if (pass) setVal(pass, 'admin123');
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname === '/'), { timeout: 20000, label: 'admin login' });
  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('FoodRush Admin')), { label: 'admin still works' });
  check('Admin dashboard still works', true);

  // --- Customer app still renders ---
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Restaurants')));
  check('Customer home page still renders', true);

  // --- Console errors ---
  const realErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('DevTools') && !e.includes('vite'));
  check('Zero console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n══ ${passed}/${results.length} restaurant E2E checks passed ══`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
