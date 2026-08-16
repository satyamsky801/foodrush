import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';

/** GET /api/categories */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ _id: 1 });
  res.json({ success: true, count: categories.length, categories });
});
