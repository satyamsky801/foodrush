import Category from '../models/Category.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/** GET /api/categories */
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ _id: 1 });
  res.json({ success: true, count: categories.length, categories });
});

/** POST /api/categories — admin */
export const createCategory = asyncHandler(async (req, res) => {
  const { slug, name, emoji, tagline } = req.body;
  if (!slug?.trim() || !name?.trim()) throw ApiError.badRequest('slug and name are required.');

  const exists = await Category.findOne({ slug: slug.trim().toLowerCase() });
  if (exists) throw ApiError.badRequest('A category with this slug already exists.');

  const category = await Category.create({
    slug: slug.trim().toLowerCase(),
    name: name.trim(),
    emoji: emoji || '🍽️',
    tagline: tagline || '',
  });
  res.status(201).json({ success: true, category });
});

/** PATCH /api/categories/:id — admin */
export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) throw ApiError.notFound('Category not found.');
  res.json({ success: true, category });
});

/** DELETE /api/categories/:id — admin */
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');
  res.json({ success: true, message: 'Category deleted.' });
});
