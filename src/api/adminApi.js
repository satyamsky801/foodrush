import { request } from './apiClient';

/** Admin-only API calls. All require an admin JWT. */
export const adminApi = {
  // ── Dashboard ────────────────────────────────────────────────────────────
  /** GET /api/orders/admin/dashboard → { stats: { users, restaurants, orders, revenue, byStatus } } */
  dashboard: () => request('/orders/admin/dashboard'),

  /** GET /api/orders/admin/charts → { charts: { daily, popularFoods, popularRestaurants } } */
  charts: () => request('/orders/admin/charts'),

  // ── Orders ───────────────────────────────────────────────────────────────
  /** GET /api/orders/admin/all?status= */
  allOrders: (params = {}) => request('/orders/admin/all', { params }),

  /** PATCH /api/orders/:id/status — advance/set order status */
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),

  // ── Users ────────────────────────────────────────────────────────────────
  /** GET /api/users/admin/all?search=&role= */
  allUsers: (params = {}) => request('/users/admin/all', { params }),

  /** PATCH /api/users/:id — change role */
  updateUserRole: (id, role) =>
    request(`/users/${id}`, { method: 'PATCH', body: { role } }),

  /** DELETE /api/users/:id */
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  // ── Restaurants ──────────────────────────────────────────────────────────
  /** GET /api/restaurants/all — includes inactive (admin) */
  allRestaurants: () => request('/restaurants/all'),

  /** POST /api/restaurants */
  createRestaurant: (data) => request('/restaurants', { method: 'POST', body: data }),

  /** PATCH /api/restaurants/:id */
  updateRestaurant: (id, data) =>
    request(`/restaurants/${id}`, { method: 'PATCH', body: data }),

  /** DELETE /api/restaurants/:id */
  deleteRestaurant: (id) => request(`/restaurants/${id}`, { method: 'DELETE' }),

  // ── Foods ────────────────────────────────────────────────────────────────
  /** GET /api/foods?restaurant=&search=&available= */
  allFoods: (params = {}) => request('/foods', { params }),

  /** POST /api/foods */
  createFood: (data) => request('/foods', { method: 'POST', body: data }),

  /** PATCH /api/foods/:id */
  updateFood: (id, data) => request(`/foods/${id}`, { method: 'PATCH', body: data }),

  /** DELETE /api/foods/:id */
  deleteFood: (id) => request(`/foods/${id}`, { method: 'DELETE' }),

  // ── Categories ───────────────────────────────────────────────────────────
  /** POST /api/categories */
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),

  /** PATCH /api/categories/:id */
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PATCH', body: data }),

  /** DELETE /api/categories/:id */
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // ── Coupons ──────────────────────────────────────────────────────────────
  /** POST /api/coupons */
  createCoupon: (data) => request('/coupons', { method: 'POST', body: data }),

  /** PATCH /api/coupons/:id */
  updateCoupon: (id, data) => request(`/coupons/${id}`, { method: 'PATCH', body: data }),

  /** DELETE /api/coupons/:id */
  deleteCoupon: (id) => request(`/coupons/${id}`, { method: 'DELETE' }),

  // ── Reviews ──────────────────────────────────────────────────────────────
  /** GET /api/reviews/admin/all */
  allReviews: () => request('/reviews/admin/all'),
};
