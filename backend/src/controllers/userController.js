import User from '../models/User.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

const ROLES = ['customer', 'restaurant', 'delivery', 'admin'];

/** GET /api/users/admin/all — admin: all users with order counts */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role } = req.query;
  const filter = {};
  if (role && ROLES.includes(role)) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter).sort({ createdAt: -1 }).lean();

  // Order counts per user for the dashboard table.
  const counts = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$breakdown.grandTotal' } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c]));

  const rows = users.map((u) => ({
    id: u._id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    provider: u.provider,
    createdAt: u.createdAt,
    orders: countMap.get(String(u._id))?.orders || 0,
    spent: countMap.get(String(u._id))?.spent || 0,
  }));

  res.json({ success: true, count: rows.length, users: rows });
});

/** PATCH /api/users/:id — admin: change role (can't change your own) */
export const updateUser = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!role || !ROLES.includes(role)) throw ApiError.badRequest('Invalid role.');

  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  user.role = role;
  await user.save();

  res.json({ success: true, user: user.toSafeJSON() });
});

/** DELETE /api/users/:id — admin: delete a user and their data */
export const deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  await User.findByIdAndDelete(req.params.id);
  await Order.deleteMany({ user: req.params.id });

  res.json({ success: true, message: 'User deleted.' });
});
