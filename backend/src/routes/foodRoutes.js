import { Router } from 'express';
import {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} from '../controllers/foodController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getFoods);
router.get('/:id', getFoodById);

// Admin CRUD (restaurant owners are handled per-route later)
router.post('/', protect, restrictTo('admin'), createFood);
router.patch('/:id', protect, restrictTo('admin'), updateFood);
router.delete('/:id', protect, restrictTo('admin'), deleteFood);

export default router;
