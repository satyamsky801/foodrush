import { Router } from 'express';
import {
  getRestaurants,
  getRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
} from '../controllers/restaurantController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getRestaurants);
router.get('/all', protect, restrictTo('admin'), getAllRestaurants);
router.get('/:slug', getRestaurantBySlug);

// Admin CRUD
router.post('/', protect, restrictTo('admin'), createRestaurant);
router.patch('/:id', protect, restrictTo('admin'), updateRestaurant);
router.delete('/:id', protect, restrictTo('admin'), deleteRestaurant);

export default router;
