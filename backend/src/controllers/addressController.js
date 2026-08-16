import Address from '../models/Address.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';

/** GET /api/addresses — current user's addresses */
export const getMyAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, count: addresses.length, addresses });
});

/** POST /api/addresses */
export const createAddress = asyncHandler(async (req, res) => {
  const { type, name, phone, street, area, city, pincode, landmark, isDefault } = req.body;
  if (!name?.trim() || !phone?.trim() || !street?.trim() || !area?.trim() || !city?.trim() || !pincode?.trim()) {
    throw ApiError.badRequest('Name, phone, street, area, city and pincode are required.');
  }

  if (isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  const address = await Address.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, address });
});

/** PATCH /api/addresses/:id */
export const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found.');

  if (req.body.isDefault) {
    await Address.updateMany({ user: req.user._id }, { isDefault: false });
  }

  Object.assign(address, req.body);
  await address.save();
  res.json({ success: true, address });
});

/** DELETE /api/addresses/:id */
export const deleteAddress = asyncHandler(async (req, res) => {
  const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!address) throw ApiError.notFound('Address not found.');
  res.json({ success: true, message: 'Address deleted.' });
});
