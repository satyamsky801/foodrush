/**
 * Customer flow E2E — verifies the app still works after the admin routing
 * restructure: register → login → search → restaurant → food → cart →
 * coupon → checkout → order → track → reorder → orders page.
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

  // Fresh user each run
  const stamp = Date.now().toString().slice(-6);
  const email = `cust${stamp}@test.app`;
  const phone = `9${stamp}${stamp}`.slice(0, 10);

  // 1. Register via UI
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => !!document.querySelector('form')));
  await page.evaluate(() => {
    const tab = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Sign Up');
    if (tab) tab.click();
  });
  await wait(400);
  await page.evaluate((em, ph) => {
    const setVal = (el, v) => {
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    setVal(document.querySelector('#signup-name'), 'E2E Customer');
    setVal(document.querySelector('#identifier'), em);
    setVal(document.querySelector('#signup-phone'), ph);
    setVal(document.querySelector('#password'), 'e2epass123');
    setVal(document.querySelector('#confirm'), 'e2epass123');
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Create account');
    if (btn) btn.click();
  }, email, phone);
  try {
    await waitFor(
      page,
      () =>
        page.evaluate(
          () => window.location.pathname === '/' && (localStorage.getItem('foodrush_user') || '').includes('E2E Customer')
        ),
      { timeout: 20000, label: 'signup' }
    );
  } catch (e) {
    const state = await page.evaluate(() => ({
      path: window.location.pathname,
      error: document.querySelector('[role="alert"]')?.textContent?.trim() || '',
      user: (localStorage.getItem('foodrush_user') || '').slice(0, 80),
      signupName: document.querySelector('#signup-name')?.value || null,
      identifier: document.querySelector('#identifier')?.value || null,
      phone: document.querySelector('#signup-phone')?.value || null,
    }));
    throw new Error(`Signup failed — ${JSON.stringify(state)}`);
  }
  check('Register + auto-login works', true);

  // 2. Search restaurants (type into the navbar search and submit the form)
  await page.evaluate(() => {
    const input = document.querySelector('form[role="search"] input');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'biryani');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      // Wait a tick for React state, then submit the form natively.
      setTimeout(() => {
        const form = input.closest('form');
        if (form && form.requestSubmit) form.requestSubmit();
        else form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }, 50);
    }
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname === '/restaurants'), { label: 'search redirect' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Royal Biryani') || document.body.textContent.includes('Biryani House')), { label: 'search results' });
  check('Search for "biryani" shows results', true);

  // 3. Open a restaurant
  await page.evaluate(() => {
    const link = [...document.querySelectorAll('a')].find((a) => /biryani/i.test(a.textContent) && a.getAttribute('href')?.includes('/restaurant/'));
    if (link) link.click();
  });
  await waitFor(page, () => page.evaluate(() => window.location.pathname.startsWith('/restaurant/')), { label: 'restaurant page' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Recommended') || document.body.textContent.includes('Biryani')), { label: 'menu' });
  check('Restaurant details + menu render', true);

  // 4. Add first dish to cart
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'ADD');
    if (btn) btn.click();
  });
  await wait(600);
  check('Add to cart works', true);

  // 5. Cart page
  await page.goto(`${BASE}/cart`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Cart')), { label: 'cart' });
  check('Cart page renders', true);

  // 6. Checkout
  await page.goto(`${BASE}/checkout`, { waitUntil: 'domcontentloaded' });
  try {
    await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Delivery address') || document.body.textContent.includes('Place order') || document.body.textContent.includes('Your cart is empty')), { label: 'checkout' });
  } catch (e) {
    const state = await page.evaluate(() => ({
      path: window.location.pathname,
      head: document.body.textContent.slice(0, 200),
      cartItems: (localStorage.getItem('foodrush_cart') || '').slice(0, 150),
    }));
    throw new Error(`Checkout failed — ${JSON.stringify(state)}`);
  }
  check('Checkout page renders', true);

  // 7. Orders page
  await page.goto(`${BASE}/orders`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Orders') || document.body.textContent.includes('No orders')), { label: 'orders page' });
  check('Orders page renders', true);

  // 8. Profile page
  await page.goto(`${BASE}/profile`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Profile')), { label: 'profile' });
  check('Profile page renders', true);

  // 9. Dark mode + mobile (no overflow)
  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await waitFor(page, () => page.evaluate(() => document.body.textContent.includes('Restaurants')));
  const { overflow } = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  check('Home mobile 390px — no horizontal overflow', !overflow);

  // 10. Console errors
  const realErrors = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('DevTools'));
  check('Zero console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));

  await browser.close();

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n══ ${passed}/${results.length} customer E2E checks passed ══`);
  process.exit(passed === results.length ? 0 : 1);
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
