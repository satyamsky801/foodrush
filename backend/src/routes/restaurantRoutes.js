import { Router } from 'express';
import {
  getRestaurants,
  getRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getAllRestaurants,
  getMyRestaurant,
  updateMyRestaurant,
} from '../controllers/restaurantController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getRestaurants);
router.get('/all', protect, restrictTo('admin'), getAllRestaurants);

// Restaurant owner — their own profile (derived from the JWT, not the URL).
// Must be registered before /:slug so "me" isn't treated as a slug.
router.get('/me', protect, restrictTo('restaurant'), getMyRestaurant);
router.patch('/me', protect, restrictTo('restaurant'), updateMyRestaurant);

router.get('/:slug', getRestaurantBySlug);

// Admin CRUD
router.post('/', protect, restrictTo('admin'), createRestaurant);
router.patch('/:id', protect, restrictTo('admin'), updateRestaurant);
router.delete('/:id', protect, restrictTo('admin'), deleteRestaurant);

export default router;
