import { request } from './apiClient';

/**
 * Restaurant APIs.
 *
 * Public/customer methods (`list`, `getBySlug`) need no auth. The
 * restaurant-owner methods require a restaurant-role JWT; the backend derives
 * the restaurant from the authenticated user — the client never supplies (or
 * trusts) a restaurant id for ownership decisions.
 */
export const restaurantApi = {
  // ── Public (customer) ────────────────────────────────────────────────────
  /**
   * GET /api/restaurants — supports search, category, cuisine, rating,
   * maxTime, maxPrice, pureVeg and sort (relevance | rating | delivery-time | price).
   */
  list: (params = {}) => request('/restaurants', { params, auth: false }),

  /** GET /api/restaurants/:slug → { restaurant, sections } */
  getBySlug: (slug) => request(`/restaurants/${slug}`, { auth: false }),

  // ── Restaurant owner: profile ────────────────────────────────────────────
  /** GET /api/restaurants/me — the owner's own restaurant profile */
  me: () => request('/restaurants/me'),

  /** PATCH /api/restaurants/me — update the owner's own profile */
  updateProfile: (data) => request('/restaurants/me', { method: 'PATCH', body: data }),

  // ── Restaurant owner: orders ─────────────────────────────────────────────
  /** GET /api/orders/restaurant/mine — only this restaurant's orders */
  orders: (params = {}) => request('/orders/restaurant/mine', { params }),

  /** PATCH /api/orders/:id/status — accept / preparing / ready (role-gated) */
  updateOrderStatus: (id, status) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),

  /** GET /api/orders/restaurant/analytics — daily orders/revenue, popular foods */
  analytics: () => request('/orders/restaurant/analytics'),

  // ── Restaurant owner: menu ───────────────────────────────────────────────
  /** GET /api/foods?restaurant= — menu items for the owner's restaurant */
  foods: (params = {}) => request('/foods', { params }),

  /** POST /api/foods — create a dish (scoped to the owner's restaurant) */
  createFood: (data) => request('/foods', { method: 'POST', body: data }),

  /** PATCH /api/foods/:id — update a dish (ownership enforced) */
  updateFood: (id, data) => request(`/foods/${id}`, { method: 'PATCH', body: data }),

  /** DELETE /api/foods/:id — delete a dish (ownership enforced) */
  deleteFood: (id) => request(`/foods/${id}`, { method: 'DELETE' }),

  // ── Restaurant owner: reviews ────────────────────────────────────────────
  /** GET /api/reviews/restaurant/:id — reviews for the owner's restaurant */
  reviews: (restaurantId) => request(`/reviews/restaurant/${restaurantId}`),
};
