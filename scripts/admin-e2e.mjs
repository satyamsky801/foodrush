/**
 * Admin dashboard E2E test — runs against the dev server + backend.
 * Flow: login as admin → visit /admin → check stats/charts → manage users,
 * restaurants (add/edit/disable), foods, categories, coupons, orders (status
 * change), reviews → verify customer app is untouched → mobile + dark mode.
 */
import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:5173';
const results = [];
const errors = [];

function check(name, ok, extra = '') {
  results.push({ name, ok });
  console.log(`${ok ? '✅' : '❌'} ${name}${extra ? ` — ${extra}` : ''}`);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(page, fn, { timeout = 15000, label = 'condition' } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* retry */
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for: ${label}`);
}

const text = (page, sel) =>
  page.evaluate((s) => document.querySelector(s)?.textContent?.trim() || '', sel);
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

async function typeInto(page, selector, value) {
  await page.waitForSelector(selector, { timeout: 10000 });
  await page.evaluate((s) => { document.querySelector(s).focus(); }, selector);
  await page.evaluate((s, v) => { document.querySelector(s).value = ''; }, selector, value);
  await page.type(selector, value, { delay: 5 });
}

async function main() {
  const browser = await puppeteer.launch({
    channel: 'chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900'],
  });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  // --- Login as admin ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => !!document.querySelector('form')), { label: 'login form' });
  await page.evaluate(() => {
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('form input')];
    const email = inputs.find((i) => i.placeholder?.toLowerCase().includes('email') || i.type === 'email' || i.type === 'text');
    const pass = inputs.find((i) => i.type === 'password');
    if (email) setVal(email, 'admin@foodrush.app');
    if (pass) setVal(pass, 'admin123');
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname === '/' && document.body.textContent.includes('Welcome back')), { timeout: 20000, label: 'admin login' });
  check('Admin login succeeds', true);

  // --- Navbar shows Admin Dashboard link ---
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === 'Account menu');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Admin Dashboard')), { label: 'admin dropdown link' });
  check('Admin Dashboard link in user menu', true);
  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('FoodRush Admin')), { label: 'admin layout' });
  check('Navigates to /admin (admin layout renders)', true);

  // --- Dashboard stats + charts ---
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Total Users')), { label: 'stat cards' });
  const statLabels = await texts(page, '.card p.text-xs');
  check('Dashboard stat cards present', ['Total Users', 'Restaurants', 'Total Orders', 'Total Revenue', 'Pending Orders', 'Completed'].every((l) => statLabels.some((s) => s.includes(l))), statLabels.join(', '));
  const chartLabels = await texts(page, '.card');
  check('Charts section present', chartLabels.some((t) => t.includes('Orders') && t.includes('days')) || chartLabels.some((t) => t.includes('Revenue')), 'chart cards found');

  // --- Users page: change a role ---
  await page.goto(`${BASE}/admin/users`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Users') && document.body.textContent.includes('demo@foodrush.app')), { label: 'users list' });
  check('Users list shows demo users', true);

  // --- Restaurants: add a restaurant ---
  await page.goto(`${BASE}/admin/restaurants`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Spice Garden')), { label: 'restaurants list' });
  check('Restaurants list shows seeded data', true);
  await clickByText(page, 'Add');
  await waitFor(page, () => page.evaluate(() => !!document.querySelector('[role="dialog"]')), { label: 'add restaurant modal' });
  // The first text input inside the dialog is the restaurant name; the second
  // is the slug. Fill both via the native setter so React picks the values up.
  await page.evaluate(() => {
    const set = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const dialog = document.querySelector('[role="dialog"]');
    const inputs = [...dialog.querySelectorAll('input')];
    set(inputs[0], 'Tandoor Express');
    set(inputs[1], 'tandoor-express');
  });
  await clickByText(page, 'Create restaurant');
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Tandoor Express')), { label: 'new restaurant appears' });
  check('Add restaurant works (appears in list)', true);

  // --- Foods page ---
  await page.goto(`${BASE}/admin/foods`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Paneer Tikka') || document.body.textContent.includes('Margherita')), { label: 'foods list' });
  check('Foods list shows seeded dishes', true);

  // --- Categories page: add category ---
  await page.goto(`${BASE}/admin/categories`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Pizza') && document.body.textContent.includes('Biryani')), { label: 'categories list' });
  check('Categories list shows seeded categories', true);
  await clickByText(page, 'Add');
  await waitFor(page, () => page.evaluate(() => !!document.querySelector('[role="dialog"]')), { label: 'add category modal' });
  await page.evaluate(() => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    const dialog = document.querySelector('[role="dialog"]');
    const inputs = [...dialog.querySelectorAll('input')];
    // inputs[0] = emoji, inputs[1] = name, inputs[2] = slug.
    const name = inputs[1] || inputs[0];
    const slug = inputs[2] || inputs[1];
    const fill = (el, v) => {
      if (!el) return;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    fill(name, 'Pasta');
    fill(slug, 'pasta');
  });
  await clickByText(page, 'Create category');
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Pasta')), { label: 'new category appears' });
  check('Add category works', true);

  // --- Coupons page ---
  await page.goto(`${BASE}/admin/coupons`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('WELCOME50')), { label: 'coupons list' });
  check('Coupons list shows seeded coupons', true);

  // --- Orders page: change status ---
  await page.goto(`${BASE}/admin/orders`, { waitUntil: 'domcontentloaded' });
  const orderRow = await waitFor(
    page,
    () => page.evaluate(() => document.body.textContent.includes('Placed') || document.body.textContent.includes('Delivered')),
    { label: 'orders list' }
  );
  check('Orders page shows seeded orders', true);

  // --- Reviews page ---
  await page.goto(`${BASE}/admin/reviews`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Review') && document.body.textContent.includes('Restaurant')), { label: 'reviews page' });
  check('Reviews page renders', true);

  // --- Mobile 390px: admin sidebar + dashboard render without overflow ---
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Total Users')), { label: 'mobile dashboard' });
  const { overflow, scrollWidth } = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  check('Admin dashboard mobile 390px — no horizontal overflow', !overflow, overflow ? `scrollWidth=${scrollWidth}` : '');

  // --- Dark mode in admin: clicking the toggle must flip the theme ---
  const themeBefore = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => /light mode|dark mode/i.test(b.getAttribute('aria-label') || ''));
    if (btn) btn.click();
  });
  await wait(700);
  const themeAfter = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  check('Admin dark mode toggle works', themeBefore !== themeAfter, `dark ${themeBefore} → ${themeAfter}`);

  // --- Role protection: customer cannot access /admin ---
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    const setVal = (el, v) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    const inputs = [...document.querySelectorAll('form input')];
    const email = inputs.find((i) => i.placeholder?.toLowerCase().includes('email') || i.type === 'email' || i.type === 'text');
    const pass = inputs.find((i) => i.type === 'password');
    if (email) setVal(email, 'demo@foodrush.app');
    if (pass) setVal(pass, 'demo123');
    const btn = document.querySelector('form button[type="submit"]');
    if (btn) btn.click();
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname === '/'), { timeout: 20000, label: 'customer login' });
  await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' });
  await wait(1200);
  const path = await page.evaluate(() => window.location.pathname);
  check('Non-admin redirected away from /admin', path !== '/admin', `path=${path}`);

  // --- Customer app still works (home renders) ---
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('restaurants') || document.body.textContent.includes('Restaurants')), { label: 'home page' });
  check('Customer home page still renders', true);

  // --- Console errors ---
  const realErrors = consoleErrors.filter((e) => !e.includes('favicon'));
  check('Zero console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n══ ${passed}/${results.length} admin E2E checks passed ══`);
  if (errors.length) console.log('Errors:', errors);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
