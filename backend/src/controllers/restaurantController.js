import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const SORT_MAP = {
  relevance: {},
  rating: { rating: -1, ratingCount: -1 },
  'delivery-time': { deliveryMin: 1 },
  price: { priceForTwo: 1 },
};

/** GET /api/restaurants?category=&cuisine=&rating=&maxTime=&maxPrice=&pureVeg=&sort=&search= */
export const getRestaurants = asyncHandler(async (req, res) => {
  const {
    category,
    cuisine,
    rating,
    maxTime,
    maxPrice,
    pureVeg,
    sort = 'relevance',
    search,
  } = req.query;

  const filter = { isActive: true };

  if (category) filter.categories = category;
  if (cuisine) filter.cuisine = cuisine;
  if (pureVeg === 'true') filter.pureVeg = true;
  if (rating) filter.rating = { $gte: Number(rating) };
  if (maxTime) filter.deliveryMin = { $lte: Number(maxTime) };
  if (maxPrice) filter.priceForTwo = { $lte: Number(maxPrice) };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { cuisine: { $regex: search, $options: 'i' } },
      { area: { $regex: search, $options: 'i' } },
    ];
  }

  const restaurants = await Restaurant.find(filter).sort(SORT_MAP[sort] || {}).lean();
  res.json({ success: true, count: restaurants.length, restaurants });
});

/** GET /api/restaurants/:slug — restaurant + menu grouped by section */
export const getRestaurantBySlug = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ slug: req.params.slug }).lean();
  if (!restaurant) throw ApiError.notFound('Restaurant not found.');

  const foods = await Food.find({ restaurant: restaurant._id, isAvailable: true })
    .sort({ sortOrder: 1 })
    .lean();

  // Group foods by menu section, preserving menu order.
  const sections = [];
  for (const food of foods) {
    const key = food.section || 'Recommended';
    let group = sections.find((s) => s.name === key);
    if (!group) {
      group = { name: key, foods: [] };
      sections.push(group);
    }
    group.foods.push(food);
  }

  res.json({ success: true, restaurant, sections });
});

/** POST /api/restaurants — admin */
export const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.create(req.body);
  res.status(201).json({ success: true, restaurant });
});

/** PATCH /api/restaurants/:id — admin */
export const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!restaurant) throw ApiError.notFound('Restaurant not found.');
  res.json({ success: true, restaurant });
});

/** DELETE /api/restaurants/:id — admin */
export const deleteRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if (!restaurant) throw ApiError.notFound('Restaurant not found.');
  await Food.deleteMany({ restaurant: restaurant._id });
  res.json({ success: true, message: 'Restaurant deleted.' });
});

/** GET /api/restaurants/admin/all — admin (includes inactive) */
export const getAllRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await Restaurant.find().sort({ createdAt: -1 }).lean();
  res.json({ success: true, count: restaurants.length, restaurants });
});
