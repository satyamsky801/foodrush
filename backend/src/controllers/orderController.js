import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { generateOrderId } from '../utils/orderId.js';
import {
  computeItemTotal,
  computeDeliveryFee,
  computeTax,
  computeCouponDiscount,
  computeBreakdown,
} from '../utils/pricing.js';

const ORDER_STATUS_FLOW = [
  'placed',
  'accepted',
  'preparing',
  'ready',
  'picked-up',
  'out-for-delivery',
  'delivered',
];

/**
 * POST /api/orders — place an order (authenticated).
 * Server recomputes every price; the client payload is never trusted.
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { restaurantId, items, addressId, paymentMethod, couponCode } = req.body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('restaurantId and items are required.');
  }
  if (!addressId) throw ApiError.badRequest('A delivery address is required.');
  if (!['upi', 'card', 'cod'].includes(paymentMethod)) {
    throw ApiError.badRequest('Invalid payment method.');
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant || !restaurant.isActive) {
    throw ApiError.badRequest('This restaurant is not accepting orders right now.');
  }

  const address = await Address.findOne({ _id: addressId, user: req.user._id });
  if (!address) throw ApiError.badRequest('Delivery address not found.');

  // Rebuild each line item from the database so prices can't be tampered with.
  const foodIds = items.map((i) => i.foodId);
  const foods = await Food.find({ _id: { $in: foodIds }, restaurant: restaurantId, isAvailable: true });
  const foodMap = new Map(foods.map((f) => [String(f._id), f]));

  const lineItems = [];
  for (const item of items) {
    const food = foodMap.get(String(item.foodId));
    if (!food) throw ApiError.badRequest('One or more items are unavailable. Please refresh your cart.');

    const addons = (item.addons || []).map((a) => {
      const match = food.addons.find((x) => String(x.id) === String(a.id));
      if (!match) throw ApiError.badRequest(`Add-on "${a.name}" is no longer available.`);
      return { id: match.id, name: match.name, price: match.price };
    });

    const customizations = (item.customizations || []).map((c) => {
      const group = food.customizations.find((g) => String(g.id) === String(c.id));
      if (!group) throw ApiError.badRequest(`Customization "${c.name}" is no longer available.`);
      const option = group.options.find((o) => String(o.id) === String(c.optionId));
      if (!option) throw ApiError.badRequest(`Option "${c.optionName}" is no longer available.`);
      return {
        id: group.id,
        name: group.name,
        optionId: option.id,
        optionName: option.name,
        price: option.price,
      };
    });

    const quantity = Math.max(1, Math.min(50, Number(item.quantity) || 1));
    const addonTotal = addons.reduce((s, a) => s + a.price, 0);
    const customTotal = customizations.reduce((s, c) => s + c.price, 0);

    lineItems.push({
      food: food._id,
      name: food.name,
      image: food.image,
      veg: food.veg,
      unitPrice: food.price,
      addonTotal,
      customTotal,
      addons,
      customizations,
      quantity,
    });
  }

  const total = computeItemTotal(lineItems);
  const deliveryFee = computeDeliveryFee(total, restaurant);
  const tax = computeTax(total);
  const { discount, coupon } = await computeCouponDiscount(couponCode, total, deliveryFee);
  const breakdown = computeBreakdown({ total, deliveryFee, tax, discount });

  const order = await Order.create({
    orderId: generateOrderId(),
    user: req.user._id,
    restaurant: restaurant._id,
    items: lineItems,
    address: {
      type: address.type,
      name: address.name,
      phone: address.phone,
      street: address.street,
      area: address.area,
      city: address.city,
      pincode: address.pincode,
      landmark: address.landmark,
    },
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'cod' : 'paid',
    orderStatus: 'placed',
    breakdown,
    couponCode: coupon ? coupon.code : null,
    estimatedDelivery: restaurant.deliveryTime,
  });

  const populated = await Order.findById(order._id)
    .populate('restaurant', 'name slug image area deliveryTime')
    .populate('user', 'name email phone');

  res.status(201).json({ success: true, order: populated });
});

/** GET /api/orders — current user's orders (newest first) */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate('restaurant', 'name slug image area')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: orders.length, orders });
});

/** GET /api/orders/:id — only the owner, admin, or the restaurant owner */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name slug image area deliveryTime')
    .populate('user', 'name email phone');

  if (!order) throw ApiError.notFound('Order not found.');
  const isOwner = String(order.user._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  const isRestaurantOwner = req.user.role === 'restaurant' &&
    String(order.restaurant._id) === String(req.user.restaurant);
  // Delivery partners may only view orders assigned to them or still up for pickup.
  const isDelivery = req.user.role === 'delivery' &&
    (order.deliveryPartner?.name === req.user.name ||
      (order.orderStatus === 'ready' && !order.deliveryPartner));
  if (!isOwner && !isAdmin && !isRestaurantOwner && !isDelivery) {
    throw ApiError.forbidden();
  }

  res.json({ success: true, order });
});

/**
 * PATCH /api/orders/:id/status — advance or set order status.
 * Allowed: customer (cancel while pending), admin, restaurant owner, delivery partner.
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ORDER_STATUS_FLOW.includes(status) && status !== 'cancelled') {
    throw ApiError.badRequest('Invalid order status.');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  const isAdmin = req.user.role === 'admin';
  const isRestaurantOwner = req.user.role === 'restaurant' &&
    String(order.restaurant) === String(req.user.restaurant);
  const isDelivery = req.user.role === 'delivery';

  // Customers may only cancel their own pending orders.
  if (req.user.role === 'customer') {
    const isOwner = String(order.user) === String(req.user._id);
    const cancellable = ['placed', 'accepted'].includes(order.orderStatus);
    if (!isOwner || !cancellable || status !== 'cancelled') {
      throw ApiError.forbidden();
    }
  } else if (!isAdmin && !isRestaurantOwner && !isDelivery) {
    throw ApiError.forbidden();
  }

  // Delivery partners can only touch the delivery-stage statuses.
  if (isDelivery && !isAdmin && !['picked-up', 'out-for-delivery', 'delivered'].includes(status)) {
    throw ApiError.forbidden('Delivery partners can only update delivery statuses.');
  }
  // Restaurant owners can only manage up to "ready".
  if (isRestaurantOwner && !isAdmin && !['accepted', 'preparing', 'ready'].includes(status)) {
    throw ApiError.forbidden('Restaurant owners can manage orders until ready.');
  }

  order.orderStatus = status;
  if (status === 'delivered') order.paymentStatus = 'paid';
  await order.save();

  res.json({ success: true, order });
});

/** POST /api/orders/:id/reorder — add the items of a previous order back to the cart client-side */
export const reorder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found.');

  const items = order.items.map((i) => ({
    foodId: String(i.food),
    name: i.name,
    quantity: i.quantity,
    addons: i.addons,
    customizations: i.customizations.map((c) => ({
      id: c.id,
      optionId: c.optionId,
      name: c.name,
      optionName: c.optionName,
    })),
  }));

  res.json({ success: true, restaurantId: String(order.restaurant), items });
});

/** GET /api/orders/admin/all — admin: all orders with stats */
export const getAllOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.orderStatus = status;

  const [orders, pendingCount, completedCount, revenueAgg] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'name slug image')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean(),
    Order.countDocuments({ orderStatus: { $nin: ['delivered', 'cancelled'] } }),
    Order.countDocuments({ orderStatus: 'delivered' }),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$breakdown.grandTotal' } } },
    ]),
  ]);

  res.json({
    success: true,
    count: orders.length,
    stats: {
      pending: pendingCount,
      completed: completedCount,
      revenue: revenueAgg[0]?.revenue || 0,
    },
    orders,
  });
});

/** GET /api/orders/restaurant/mine — restaurant owner's incoming orders */
export const getRestaurantOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ restaurant: req.user.restaurant })
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: orders.length, orders });
});

/**
 * GET /api/orders/restaurant/analytics — restaurant owner: sales overview.
 * Daily orders/revenue (14 days), popular foods, status counts, AOV.
 */
export const getRestaurantAnalytics = asyncHandler(async (req, res) => {
  if (!req.user.restaurant) throw ApiError.forbidden('Your account is not linked to a restaurant.');
  const restaurantId = req.user.restaurant;
  const days = 14;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  // Status counts (today + all-time), revenue, AOV, delivered count, menu size.
  const [statusCounts, revenueAgg, aovAgg, deliveredAgg, menuCount] = await Promise.all([
    Order.aggregate([
      { $match: { restaurant: restaurantId } },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { restaurant: restaurantId, orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$breakdown.grandTotal' }, orders: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { restaurant: restaurantId, orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, aov: { $avg: '$breakdown.grandTotal' } } },
    ]),
    Order.countDocuments({ restaurant: restaurantId, orderStatus: 'delivered' }),
    Food.countDocuments({ restaurant: restaurantId }),
  ]);

  const byStatus = {};
  for (const s of statusCounts) byStatus[s._id] = s.count;

  // Today's snapshot (local calendar day).
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const [todayOrders, todayRevenue] = await Promise.all([
    Order.countDocuments({ restaurant: restaurantId, createdAt: { $gte: todayStart }, orderStatus: { $ne: 'cancelled' } }),
    Order.aggregate([
      {
        $match: {
          restaurant: restaurantId,
          createdAt: { $gte: todayStart },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      { $group: { _id: null, revenue: { $sum: '$breakdown.grandTotal' } } },
    ]),
  ]);

  // Daily series (last 14 days).
  const daily = await Order.aggregate([
    {
      $match: {
        restaurant: restaurantId,
        createdAt: { $gte: since },
        orderStatus: { $ne: 'cancelled' },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$breakdown.grandTotal' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const match = daily.find((x) => x._id === key);
    series.push({
      date: key,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      orders: match?.orders || 0,
      revenue: match?.revenue || 0,
    });
  }

  // Popular foods by quantity (excluding cancelled).
  const popularFoods = await Order.aggregate([
    { $match: { restaurant: restaurantId, orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        qty: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 6 },
  ]);

  const revenue = revenueAgg[0]?.revenue || 0;
  const orderCount = revenueAgg[0]?.orders || 0;

  res.json({
    success: true,
    analytics: {
      today: { orders: todayOrders, revenue: todayRevenue[0]?.revenue || 0 },
      byStatus,
      totalOrders: orderCount,
      revenue,
      aov: aovAgg[0]?.aov ? Math.round(aovAgg[0].aov) : 0,
      delivered: deliveredAgg,
      menuCount,
      daily: series,
      popularFoods: popularFoods.map((p) => ({ name: p._id, qty: p.qty, revenue: p.revenue })),
    },
  });
});

/** GET /api/orders/delivery/available — open orders a delivery partner can accept */
export const getAvailableDeliveries = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    orderStatus: { $in: ['ready', 'picked-up'] },
    deliveryPartner: null,
  })
    .populate('restaurant', 'name slug image area address')
    .populate('user', 'name phone')
    .sort({ createdAt: 1 })
    .lean();
  res.json({ success: true, count: orders.length, orders });
});

/** POST /api/orders/:id/delivery/accept — delivery partner accepts an order */
export const acceptDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, orderStatus: { $in: ['ready', 'picked-up'] }, deliveryPartner: null },
    {
      deliveryPartner: {
        name: req.user.name,
        phone: req.user.phone,
        rating: 4.8,
        vehicle: 'Bike',
      },
    },
    { new: true }
  );
  if (!order) throw ApiError.badRequest('This order is no longer available for pickup.');
  res.json({ success: true, order });
});

/** GET /api/orders/delivery/mine — deliveries assigned to this partner */
export const getMyDeliveries = asyncHandler(async (req, res) => {
  const orders = await Order.find({ 'deliveryPartner.name': req.user.name })
    .populate('restaurant', 'name slug image area address')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: orders.length, orders });
});

/** GET /api/orders/admin/charts — admin: daily orders/revenue + popular items */
export const getChartData = asyncHandler(async (req, res) => {
  const days = 14;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  // Daily order + revenue series (last 14 days).
  const daily = await Order.aggregate([
    { $match: { createdAt: { $gte: since }, orderStatus: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        orders: { $sum: 1 },
        revenue: { $sum: '$breakdown.grandTotal' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const series = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const match = daily.find((x) => x._id === key);
    series.push({
      date: key,
      label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      orders: match?.orders || 0,
      revenue: match?.revenue || 0,
    });
  }

  // Popular foods by total quantity ordered (excluding cancelled).
  const popularFoods = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        qty: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
      },
    },
    { $sort: { qty: -1 } },
    { $limit: 6 },
  ]);

  // Popular restaurants by order count + revenue.
  const popularRestaurants = await Order.aggregate([
    { $match: { orderStatus: { $ne: 'cancelled' } } },
    {
      $group: {
        _id: '$restaurant',
        orders: { $sum: 1 },
        revenue: { $sum: '$breakdown.grandTotal' },
      },
    },
    { $sort: { orders: -1 } },
    { $limit: 6 },
  ]);
  await Restaurant.populate(popularRestaurants, { path: '_id', select: 'name slug image' });

  res.json({
    success: true,
    charts: {
      daily: series,
      popularFoods: popularFoods.map((p) => ({ name: p._id, qty: p.qty, revenue: p.revenue })),
      popularRestaurants: popularRestaurants.map((p) => ({
        name: p._id?.name || 'Unknown',
        slug: p._id?.slug || '',
        image: p._id?.image || '',
        orders: p.orders,
        revenue: p.revenue,
      })),
    },
  });
});

/** GET /api/orders/admin/dashboard — admin summary numbers */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [users, restaurants, orders, revenueAgg, statusCounts] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: null, revenue: { $sum: '$breakdown.grandTotal' } } },
    ]),
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
  ]);

  const byStatus = {};
  for (const s of statusCounts) byStatus[s._id] = s.count;

  res.json({
    success: true,
    stats: {
      users,
      restaurants,
      orders,
      revenue: revenueAgg[0]?.revenue || 0,
      byStatus,
    },
  });
});
