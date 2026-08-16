import { Router } from 'express';
import {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/restaurant/:id', getRestaurantReviews);
router.get('/food/:id', getFoodReviews);

// Authenticated
router.post('/', protect, createReview);

export default router;
