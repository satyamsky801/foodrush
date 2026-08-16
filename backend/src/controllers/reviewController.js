import Review from '../models/Review.js';
import Restaurant from '../models/Restaurant.js';
import Food from '../models/Food.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/** POST /api/reviews — only after a delivered order for that restaurant */
export const createReview = asyncHandler(async (req, res) => {
  const { restaurantId, foodId, rating, comment } = req.body;

  if (!restaurantId) throw ApiError.badRequest('restaurantId is required.');
  if (!rating || rating < 1 || rating > 5) throw ApiError.badRequest('Rating must be between 1 and 5.');

  // Must have a delivered order from this restaurant to review it.
  const delivered = await Order.exists({
    user: req.user._id,
    restaurant: restaurantId,
    orderStatus: 'delivered',
  });
  if (!delivered) throw ApiError.forbidden('You can only review restaurants you have ordered from.');

  if (foodId) {
    const food = await Food.findOne({ _id: foodId, restaurant: restaurantId });
    if (!food) throw ApiError.badRequest('Food item not found in this restaurant.');
  }

  const review = await Review.create({
    user: req.user._id,
    restaurant: restaurantId,
    food: foodId || null,
    rating,
    comment: comment?.trim() || '',
  });

  // Recompute restaurant rating from all its reviews.
  const agg = await Review.aggregate([
    { $match: { restaurant: restaurantId } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (agg[0]) {
    await Restaurant.findByIdAndUpdate(restaurantId, {
      rating: Math.round(agg[0].avg * 10) / 10,
      ratingCount: agg[0].count,
    });
  }

  if (foodId) {
    const foodAgg = await Review.aggregate([
      { $match: { food: foodId } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (foodAgg[0]) {
      await Food.findByIdAndUpdate(foodId, {
        rating: Math.round(foodAgg[0].avg * 10) / 10,
        ratingCount: foodAgg[0].count,
      });
    }
  }

  res.status(201).json({ success: true, review });
});

/** GET /api/reviews/restaurant/:id — includes rating distribution */
export const getRestaurantReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ restaurant: req.params.id, food: null })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const r of reviews) distribution[r.rating] = (distribution[r.rating] || 0) + 1;

  res.json({ success: true, count: reviews.length, reviews, distribution });
});

/** GET /api/reviews/food/:id */
export const getFoodReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ food: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, count: reviews.length, reviews });
});
