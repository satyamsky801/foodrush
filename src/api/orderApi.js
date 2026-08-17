import { request } from './apiClient';

export const orderApi = {
  /**
   * POST /api/orders — place an order.
   * The backend recomputes every price server-side; the client only sends
   * foodIds, quantities, addon/customization ids, addressId and paymentMethod.
   */
  placeOrder: (body) => request('/orders', { method: 'POST', body }),

  /** GET /api/orders — current user's orders (newest first) */
  getMyOrders: () => request('/orders'),

  /** GET /api/orders/:id — single order (owner/admin/restaurant/delivery) */
  getById: (id) => request(`/orders/${id}`),

  /** POST /api/orders/:id/reorder → { restaurantId, items } */
  reorder: (id) => request(`/orders/${id}/reorder`, { method: 'POST' }),
};
