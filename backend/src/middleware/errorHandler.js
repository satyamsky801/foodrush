import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

/* eslint-disable no-unused-vars */
export default function errorHandler(err, req, res, next) {
  let error = err;

  // Mongoose validation errors → 400 with readable message
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((e) => e.message);
    error = ApiError.badRequest(messages.join('. '));
  }

  // Duplicate key (unique constraint) → 409
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    error = ApiError.conflict(`An account with this ${field} already exists.`);
  }

  // Invalid ObjectId → 400
  if (err instanceof mongoose.Error.CastError) {
    error = ApiError.badRequest(`Invalid ${err.path}: ${err.value}`);
  }

  // JWT errors → 401
  if (err.name === 'JsonWebTokenError') error = ApiError.unauthorized('Invalid token.');
  if (err.name === 'TokenExpiredError') error = ApiError.unauthorized('Token expired. Please log in again.');

  const statusCode = error.statusCode || 500;
  const isProd = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Something went wrong',
    ...(error.details && { details: error.details }),
    ...(!isProd && { stack: error.stack }),
  });
}
