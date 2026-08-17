import { Router } from 'express';
import {
  placeOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  reorder,
  getAllOrders,
  getRestaurantOrders,
  getRestaurantAnalytics,
  getAvailableDeliveries,
  acceptDelivery,
  getMyDeliveries,
  getDashboardStats,
  getChartData,
} from '../controllers/orderController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = Router();

// All order routes require authentication.
router.use(protect);

// Dashboard stats (admin)
router.get('/admin/dashboard', restrictTo('admin'), getDashboardStats);
router.get('/admin/charts', restrictTo('admin'), getChartData);
router.get('/admin/all', restrictTo('admin'), getAllOrders);

// Restaurant owner
router.get('/restaurant/mine', restrictTo('restaurant'), getRestaurantOrders);
router.get('/restaurant/analytics', restrictTo('restaurant'), getRestaurantAnalytics);

// Delivery partner
router.get('/delivery/available', restrictTo('delivery'), getAvailableDeliveries);
router.get('/delivery/mine', restrictTo('delivery'), getMyDeliveries);
router.post('/delivery/accept/:id', restrictTo('delivery'), acceptDelivery);

// Customer
router.get('/', getMyOrders);
router.post('/', placeOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/reorder', reorder);

export default router;
