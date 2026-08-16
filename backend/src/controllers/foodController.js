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

/** POST /api/foods — admin/restaurant owner */
export const createFood = asyncHandler(async (req, res) => {
  const food = await Food.create(req.body);
  res.status(201).json({ success: true, food });
});

/** PATCH /api/foods/:id — admin/restaurant owner */
export const updateFood = asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!food) throw ApiError.notFound('Food item not found.');
  res.json({ success: true, food });
});

/** DELETE /api/foods/:id — admin/restaurant owner */
export const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) throw ApiError.notFound('Food item not found.');
  res.json({ success: true, message: 'Food item deleted.' });
});
