import Coupon from '../models/Coupon.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { computeCouponDiscount } from '../utils/pricing.js';

/** GET /api/coupons — all active coupons */
export const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({ isActive: true }).lean();
  res.json({ success: true, count: coupons.length, coupons });
});

/** POST /api/coupons/validate — check a code and preview its discount */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, itemTotal, deliveryFee } = req.body;
  if (!code) throw ApiError.badRequest('Coupon code is required.');

  const { discount, coupon } = await computeCouponDiscount(code, itemTotal || 0, deliveryFee || 0);
  res.json({ success: true, valid: true, discount, coupon });
});

/** POST /api/coupons — admin */
export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, coupon });
});

/** PATCH /api/coupons/:id — admin */
export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!coupon) throw ApiError.notFound('Coupon not found.');
  res.json({ success: true, coupon });
});

/** DELETE /api/coupons/:id — admin */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw ApiError.notFound('Coupon not found.');
  res.json({ success: true, message: 'Coupon deleted.' });
});
