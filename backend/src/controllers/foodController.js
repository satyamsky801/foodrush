import Food from '../models/Food.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/** GET /api/foods?search=&restaurant=&category=&veg=&available= */
export const getFoods = asyncHandler(async (req, res) => {
  const { search, restaurant, category, veg, available } = req.query;
  const filter = {};

  if (restaurant) filter.restaurant = restaurant;
  if (category) filter.category = category;
  if (veg === 'true') filter.veg = true;
  if (available === 'true') filter.isAvailable = true;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const foods = await Food.find(filter)
    .populate('restaurant', 'name slug image area')
    .sort({ name: 1 })
    .lean();
  res.json({ success: true, count: foods.length, foods });
});

/** GET /api/foods/:id */
export const getFoodById = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id)
    .populate('restaurant', 'name slug image area deliveryTime')
    .lean();
  if (!food) throw ApiError.notFound('Food item not found.');
  res.json({ success: true, food });
});

/**
 * Resolve the restaurant a food must belong to for the current user:
 * admins may pass any restaurant; restaurant owners are locked to their own.
 */
const resolveRestaurantScope = (req, bodyRestaurant) => {
  if (req.user.role === 'restaurant') {
    if (!req.user.restaurant) throw ApiError.forbidden('Your account is not linked to a restaurant.');
    return String(req.user.restaurant);
  }
  return bodyRestaurant;
};

/** Ensure a food belongs to the caller's restaurant (owners only). */
const assertOwnerOfFood = async (req, food) => {
  if (req.user.role !== 'restaurant') return;
  if (String(food.restaurant) !== String(req.user.restaurant)) {
    throw ApiError.forbidden('This food item does not belong to your restaurant.');
  }
};

/** POST /api/foods — admin (any restaurant) / restaurant owner (own only) */
export const createFood = asyncHandler(async (req, res) => {
  const restaurant = resolveRestaurantScope(req, req.body.restaurant);
  if (!restaurant) throw ApiError.badRequest('restaurant is required.');

  const food = await Food.create({ ...req.body, restaurant });
  res.status(201).json({ success: true, food });
});

/** PATCH /api/foods/:id — admin (any) / restaurant owner (own only) */
export const updateFood = asyncHandler(async (req, res) => {
  const existing = await Food.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Food item not found.');
  await assertOwnerOfFood(req, existing);

  const updates = { ...req.body };
  // Owners may never move a dish to another restaurant.
  if (req.user.role === 'restaurant') delete updates.restaurant;

  const food = await Food.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  res.json({ success: true, food });
});

/** DELETE /api/foods/:id — admin (any) / restaurant owner (own only) */
export const deleteFood = asyncHandler(async (req, res) => {
  const existing = await Food.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Food item not found.');
  await assertOwnerOfFood(req, existing);

  await Food.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Food item deleted.' });
});
