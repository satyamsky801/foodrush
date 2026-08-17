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

// CRUD — admins manage any restaurant's menu; restaurant owners only their own.
// Ownership is enforced in the controller (never trust a client-supplied id).
router.post('/', protect, restrictTo('admin', 'restaurant'), createFood);
router.patch('/:id', protect, restrictTo('admin', 'restaurant'), updateFood);
router.delete('/:id', protect, restrictTo('admin', 'restaurant'), deleteFood);

export default router;
