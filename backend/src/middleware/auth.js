import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { verifyToken } from '../utils/token.js';
import asyncHandler from '../utils/asyncHandler.js';

/** Requires a valid Bearer token and loads the user onto req.user. */
export const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired token. Please log in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw ApiError.unauthorized('The user for this token no longer exists.');

  req.user = user;
  next();
});

/** Restricts the previous middleware-protected route to certain roles. */
export const restrictTo = (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
