import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import restaurantRoutes from './restaurantRoutes.js';
import foodRoutes from './foodRoutes.js';
import orderRoutes from './orderRoutes.js';
import addressRoutes from './addressRoutes.js';
import couponRoutes from './couponRoutes.js';
import reviewRoutes from './reviewRoutes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, status: 'ok', time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/foods', foodRoutes);
router.use('/orders', orderRoutes);
router.use('/addresses', addressRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);

export default router;
