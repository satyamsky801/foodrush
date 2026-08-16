/**
 * FoodRush API smoke test — hits every endpoint and asserts on the results.
 * Run with the API server already started on http://localhost:5000.
 */
const BASE = 'http://localhost:5000/api';
let passed = 0;
let failed = 0;

function check(name, cond, extra = '') {
  if (cond) {
    passed += 1;
    console.log(`  ✅ ${name}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${name} ${extra}`);
  }
}

async function req(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

console.log('\n── Public endpoints ──');
{
  const { status, json } = await req('GET', '/categories');
  check('GET /categories', status === 200 && json.count === 12, `count=${json.count}`);

  const r = await req('GET', '/restaurants');
  check('GET /restaurants', r.status === 200 && r.json.count >= 10, `count=${r.json.count}`);

  const filtered = await req('GET', '/restaurants?category=pizza&sort=rating');
  check('GET /restaurants?category=pizza&sort=rating', filtered.status === 200 && filtered.json.count >= 1);
  check('pizza filter returns pizza restaurants', filtered.json.restaurants.every((x) => x.categories.includes('pizza')));

  const veg = await req('GET', '/restaurants?pureVeg=true');
  check('GET /restaurants?pureVeg=true', veg.json.restaurants.every((x) => x.pureVeg === true));

  const search = await req('GET', '/restaurants?search=biryani');
  check('GET /restaurants?search=biryani', search.json.count >= 1);

  const bySlug = await req('GET', '/restaurants/pizza-hub');
  check('GET /restaurants/pizza-hub', bySlug.status === 200 && bySlug.json.restaurant.name === 'Pizza Hub');
  check('menu sections present', bySlug.json.sections.length >= 3, `sections=${bySlug.json.sections?.length}`);
  check('foods have customizations', bySlug.json.sections[0].foods.some((f) => f.customizations?.length));

  const foods = await req('GET', '/foods?search=pizza');
  check('GET /foods?search=pizza', foods.status === 200 && foods.json.count >= 1);

  const coupons = await req('GET', '/coupons');
  check('GET /coupons', coupons.status === 200 && coupons.json.count === 3);

  const bad = await req('GET', '/restaurants/not-real');
  check('404 unknown restaurant', bad.status === 404);
}

console.log('\n── Auth ──');
let customerToken;
let adminToken;
let restaurantToken;
let deliveryToken;
{
  // Duplicate register → 409
  const dup = await req('POST', '/auth/register', {
    name: 'Demo User', email: 'demo@foodrush.app', phone: '9999999999', password: 'demo123',
  });
  check('duplicate email → 409', dup.status === 409);

  // Fresh user
  const reg = await req('POST', '/auth/register', {
    name: 'Tester', email: 'tester@foodrush.app', phone: '9888888888', password: 'secret1',
  });
  check('register → 201 + token', reg.status === 201 && !!reg.json.token);
  customerToken = reg.json.token;

  // Login (email + phone)
  const login = await req('POST', '/auth/login', { identifier: 'demo@foodrush.app', password: 'demo123' });
  check('login with email', login.status === 200 && login.json.user.role === 'customer');
  customerToken = login.json.token;

  const loginPhone = await req('POST', '/auth/login', { identifier: '9000000004', password: 'demo123' });
  check('login with phone', loginPhone.status === 200);

  const wrong = await req('POST', '/auth/login', { identifier: 'demo@foodrush.app', password: 'wrong' });
  check('wrong password → 401', wrong.status === 401);

  const admin = await req('POST', '/auth/login', { identifier: 'admin@foodrush.app', password: 'admin123' });
  check('admin login', admin.status === 200 && admin.json.user.role === 'admin');
  adminToken = admin.json.token;

  const owner = await req('POST', '/auth/login', { identifier: 'owner@foodrush.app', password: 'owner123' });
  check('restaurant owner login', owner.status === 200 && owner.json.user.role === 'restaurant');
  restaurantToken = owner.json.token;

  const del = await req('POST', '/auth/login', { identifier: 'delivery@foodrush.app', password: 'delivery123' });
  check('delivery login', del.status === 200 && del.json.user.role === 'delivery');
  deliveryToken = del.json.token;

  const me = await req('GET', '/auth/me', null, customerToken);
  check('GET /auth/me', me.status === 200 && me.json.user.email === 'demo@foodrush.app');

  const noToken = await req('GET', '/auth/me');
  check('protected route without token → 401', noToken.status === 401);

  // Forgot + reset password
  const forgot = await req('POST', '/auth/forgot-password', { email: 'tester@foodrush.app' });
  check('forgot-password returns dev token', forgot.status === 200 && !!forgot.json.devResetToken);
  const reset = await req('POST', `/auth/reset-password/${forgot.json.devResetToken}`, { password: 'newpass1' });
  check('reset-password works', reset.status === 200 && !!reset.json.token);
  const relogin = await req('POST', '/auth/login', { identifier: 'tester@foodrush.app', password: 'newpass1' });
  check('login with new password', relogin.status === 200);
}

console.log('\n── Addresses ──');
let addressId;
{
  const list = await req('GET', '/addresses', null, customerToken);
  check('GET /addresses (seeded 1)', list.status === 200 && list.json.count === 1);

  const created = await req('POST', '/addresses', {
    type: 'Work', name: 'Demo User', phone: '9000000004',
    street: '45, Outer Ring Road', area: 'Marathahalli', city: 'Bengaluru',
    pincode: '560037', isDefault: false,
  }, customerToken);
  check('POST /addresses', created.status === 201 && !!created.json.address._id);
  addressId = created.json.address._id;

  const updated = await req('PATCH', `/addresses/${addressId}`, { landmark: 'Near Decathlon' }, customerToken);
  check('PATCH /addresses/:id', updated.status === 200 && updated.json.address.landmark === 'Near Decathlon');

  const other = await req('GET', '/addresses', null, deliveryToken);
  check('addresses scoped per user', other.json.count === 0);
}

console.log('\n── Coupons ──');
{
  const valid = await req('POST', '/coupons/validate', { code: 'WELCOME50', itemTotal: 500, deliveryFee: 30 });
  check('validate WELCOME50', valid.status === 200 && valid.json.valid && valid.json.discount === 100);

  const invalid = await req('POST', '/coupons/validate', { code: 'NOPE', itemTotal: 500, deliveryFee: 30 });
  check('invalid coupon → 400', invalid.status === 400);

  const minNotMet = await req('POST', '/coupons/validate', { code: 'FOOD20', itemTotal: 100, deliveryFee: 30 });
  check('min order not met → 400', minNotMet.status === 400);
}

console.log('\n── Orders ──');
let orderId;
{
  const rest = await req('GET', '/restaurants/pizza-hub');
  const restaurantId = rest.json.restaurant._id;
  const food = rest.json.sections[0].foods.find((f) => f.customizations?.length > 0);
  const size = food.customizations.find((c) => c.id === 'size');
  const crust = food.customizations.find((c) => c.id === 'crust');
  const addon = food.addons[0];

  const placed = await req('POST', '/orders', {
    restaurantId,
    items: [{
      foodId: food._id,
      quantity: 1,
      addons: [{ id: addon.id, name: addon.name, price: addon.price }],
      customizations: [
        { id: size.id, name: size.name, optionId: size.options[1].id, optionName: size.options[1].name, price: size.options[1].price },
        { id: crust.id, name: crust.name, optionId: crust.options[0].id, optionName: crust.options[0].name, price: 0 },
      ],
    }],
    addressId,
    paymentMethod: 'upi',
    couponCode: 'WELCOME50',
  }, customerToken);
  check('POST /orders (with customization + coupon)', placed.status === 201 && !!placed.json.order.orderId);
  orderId = placed.json.order._id;

  const expectedUnit = food.price + addon.price + size.options[1].price;
  check('server recomputes line price', placed.json.order.items[0].unitPrice === food.price);
  check('addon price included', placed.json.order.items[0].addonTotal === addon.price);
  check('customization price included', placed.json.order.items[0].customTotal === size.options[1].price);
  const gt = placed.json.order.breakdown.grandTotal;
  const expectedGt = Math.max(0, expectedUnit + 20 + Math.round(expectedUnit * 0.05) - 100);
  check('grand total correct', gt === expectedGt, `got=${gt} want=${expectedGt}`);

  const mine = await req('GET', '/orders', null, customerToken);
  check('GET /orders (mine)', mine.status === 200 && mine.json.count >= 2);

  const byId = await req('GET', `/orders/${orderId}`, null, customerToken);
  check('GET /orders/:id', byId.status === 200 && byId.json.order.orderId === placed.json.order.orderId);

  const stolen = await req('GET', `/orders/${orderId}`, null, restaurantToken);
  check('other restaurant owner cannot read order → 403', stolen.status === 403);

  const reorder = await req('POST', `/orders/${orderId}/reorder`, {}, customerToken);
  check('reorder returns items', reorder.status === 200 && reorder.json.items.length === 1 && !!reorder.json.restaurantId);

  const cancel = await req('PATCH', `/orders/${orderId}/status`, { status: 'cancelled' }, customerToken);
  check('customer cancels pending order', cancel.status === 200 && cancel.json.order.orderStatus === 'cancelled');

  // Customer cannot advance to preparing
  const badStatus = await req('PATCH', `/orders/${orderId}/status`, { status: 'preparing' }, customerToken);
  check('customer cannot set preparing → 403', badStatus.status === 403);
}

console.log('\n── Role dashboards ──');
{
  const dash = await req('GET', '/orders/admin/dashboard', null, adminToken);
  check('admin dashboard stats', dash.status === 200 && dash.json.stats.users >= 5 && dash.json.stats.restaurants === 10, JSON.stringify(dash.json.stats));

  const all = await req('GET', '/orders/admin/all', null, adminToken);
  check('admin all orders', all.status === 200 && all.json.count >= 1);

  const blocked = await req('GET', '/orders/admin/all', null, customerToken);
  check('customer blocked from admin → 403', blocked.status === 403);

  const restOrders = await req('GET', '/orders/restaurant/mine', null, restaurantToken);
  check('restaurant owner sees orders', restOrders.status === 200 && restOrders.json.count >= 1);

  const avail = await req('GET', '/orders/delivery/available', null, deliveryToken);
  check('delivery available list', avail.status === 200 && Array.isArray(avail.json.orders));

  // Create a fresh order from Spice Garden (the demo owner's restaurant) to
  // exercise the restaurant → delivery status flow end to end.
  const rest = await req('GET', '/restaurants/spice-garden');
  const food = rest.json.sections[0].foods[0];
  const created = await req('POST', '/orders', {
    restaurantId: rest.json.restaurant._id,
    items: [{ foodId: food._id, quantity: 2, addons: [], customizations: [] }],
    addressId,
    paymentMethod: 'cod',
  }, customerToken);
  const newOrderId = created.json.order._id;

  const unassigned = await req('GET', `/orders/${newOrderId}`, null, deliveryToken);
  check('delivery cannot view unassigned order → 403', unassigned.status === 403);

  const acceptStatus = await req('PATCH', `/orders/${newOrderId}/status`, { status: 'accepted' }, restaurantToken);
  check('restaurant accepts order', acceptStatus.status === 200 && acceptStatus.json.order.orderStatus === 'accepted');
  await req('PATCH', `/orders/${newOrderId}/status`, { status: 'preparing' }, restaurantToken);
  await req('PATCH', `/orders/${newOrderId}/status`, { status: 'ready' }, restaurantToken);

  const acceptDel = await req('POST', `/orders/delivery/accept/${newOrderId}`, {}, deliveryToken);
  check('delivery partner accepts order', acceptDel.status === 200 && !!acceptDel.json.order.deliveryPartner);

  const outForDelivery = await req('PATCH', `/orders/${newOrderId}/status`, { status: 'out-for-delivery' }, deliveryToken);
  check('delivery partner updates status', outForDelivery.status === 200 && outForDelivery.json.order.orderStatus === 'out-for-delivery');

  const delivered = await req('PATCH', `/orders/${newOrderId}/status`, { status: 'delivered' }, deliveryToken);
  check('delivery partner marks delivered', delivered.status === 200 && delivered.json.order.orderStatus === 'delivered' && delivered.json.order.paymentStatus === 'paid');

  const myDel = await req('GET', '/orders/delivery/mine', null, deliveryToken);
  check('delivery partner deliveries list', myDel.status === 200 && myDel.json.count >= 1);

  // Restaurant owner cannot skip to delivered
  const skip = await req('PATCH', `/orders/${newOrderId}/status`, { status: 'delivered' }, restaurantToken);
  check('restaurant owner cannot set delivered → 403', skip.status === 403);
}

console.log('\n── Admin CRUD ──');
{
  const created = await req('POST', '/restaurants', {
    slug: 'test-kitchen', name: 'Test Kitchen', cuisine: ['Test'], categories: ['fast-food'],
    deliveryTime: '20–30 min', deliveryMin: 20, deliveryFee: 20, priceForTwo: 300, area: 'Test Area',
  }, adminToken);
  check('admin creates restaurant', created.status === 201 && created.json.restaurant.slug === 'test-kitchen');

  const blocked = await req('POST', '/restaurants', { name: 'X' }, customerToken);
  check('customer blocked from admin CRUD → 403', blocked.status === 403);

  const updated = await req('PATCH', `/restaurants/${created.json.restaurant._id}`, { priceForTwo: 350 }, adminToken);
  check('admin updates restaurant', updated.status === 200 && updated.json.restaurant.priceForTwo === 350);

  const del = await req('DELETE', `/restaurants/${created.json.restaurant._id}`, null, adminToken);
  check('admin deletes restaurant', del.status === 200);

  const foodCreated = await req('POST', '/foods', {
    restaurant: (await req('GET', '/restaurants/pizza-hub')).json.restaurant._id,
    name: 'Test Pizza', price: 199, veg: true, section: 'Test',
  }, adminToken);
  check('admin creates food', foodCreated.status === 201);
  const foodDel = await req('DELETE', `/foods/${foodCreated.json.food._id}`, null, adminToken);
  check('admin deletes food', foodDel.status === 200);
}

console.log('\n── Reviews ──');
{
  const rest = await req('GET', '/restaurants/south-indian-cafe');
  const rid = rest.json.restaurant._id;
  const before = await req('GET', `/reviews/restaurant/${rid}`);
  check('GET reviews (empty)', before.status === 200 && before.json.count === 0);

  const noOrder = await req('POST', '/reviews', { restaurantId: rid, rating: 5, comment: 'Great!' }, deliveryToken);
  check('review without delivered order → 403', noOrder.status === 403);

  // demo customer has a delivered order from Spice Garden
  const sg = await req('GET', '/restaurants/spice-garden');
  const reviewed = await req('POST', '/reviews', { restaurantId: sg.json.restaurant._id, rating: 5, comment: 'Amazing biryani!' }, customerToken);
  check('create review after delivered order', reviewed.status === 201);

  const after = await req('GET', `/reviews/restaurant/${sg.json.restaurant._id}`);
  check('reviews listed + distribution', after.status === 200 && after.json.count === 1 && after.json.distribution[5] === 1);
}

console.log(`\n══ ${passed} passed, ${failed} failed ══`);
process.exit(failed ? 1 : 0);
