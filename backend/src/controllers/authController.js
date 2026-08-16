import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { signToken, createResetToken, hashResetToken } from '../utils/token.js';

const attachToken = (user) => ({
  token: signToken(user._id),
  user: user.toSafeJSON(),
});

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
    throw ApiError.badRequest('Name, email, phone and password are required.');
  }
  if (password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters.');
  }

  // Public registration is customer-only; other roles are created via seed/admin.
  const user = await User.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    password,
    role: role === 'restaurant' || role === 'admin' || role === 'delivery' ? 'customer' : undefined,
  });

  res.status(201).json({ success: true, ...attachToken(user) });
});

/** POST /api/auth/login — accepts email or phone */
export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw ApiError.badRequest('Email/phone and password are required.');

  const id = String(identifier).trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: id }, { phone: identifier.trim() }],
  }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email/phone or password.');
  }

  res.json({ success: true, ...attachToken(user) });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('restaurant', 'name slug image');
  res.json({ success: true, user: user.toSafeJSON() });
});

/**
 * POST /api/auth/forgot-password
 * In development the reset token is returned so the flow works without an
 * email service; in production it would be emailed to the user.
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw ApiError.badRequest('Email is required.');

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    // Same response either way — don't reveal whether an account exists.
    return res.json({ success: true, message: 'If that account exists, a reset link has been sent.' });
  }

  const { token, hashed } = createResetToken();
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  const devToken = process.env.NODE_ENV !== 'production' ? token : undefined;
  res.json({
    success: true,
    message: 'If that account exists, a reset link has been sent.',
    ...(devToken && { devResetToken: token }),
  });
});

/** POST /api/auth/reset-password/:token */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!password || password.length < 6) {
    throw ApiError.badRequest('Password must be at least 6 characters.');
  }

  const hashed = hashResetToken(token);
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired.');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ success: true, message: 'Password updated. You can now log in.', ...attachToken(user) });
});
