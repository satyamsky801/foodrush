import { Router } from 'express';
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from '../controllers/couponController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// Public
router.get('/', getCoupons);
router.post('/validate', validateCoupon);

// Admin CRUD
router.post('/', protect, restrictTo('admin'), createCoupon);
router.patch('/:id', protect, restrictTo('admin'), updateCoupon);
router.delete('/:id', protect, restrictTo('admin'), deleteCoupon);

export default router;
