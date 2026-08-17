import { Router } from 'express';
import {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
  getAllReviews,
} from '../controllers/reviewController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/restaurant/:id', getRestaurantReviews);
router.get('/food/:id', getFoodReviews);

// Admin
router.get('/admin/all', protect, restrictTo('admin'), getAllReviews);

// Authenticated
router.post('/', protect, createReview);

export default router;
