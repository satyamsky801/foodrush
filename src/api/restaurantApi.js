import { request } from './apiClient';

export const restaurantApi = {
  /**
   * GET /api/restaurants — supports search, category, cuisine, rating,
   * maxTime, maxPrice, pureVeg and sort (relevance | rating | delivery-time | price).
   */
  list: (params = {}) => request('/restaurants', { params, auth: false }),

  /** GET /api/restaurants/:slug → { restaurant, sections } */
  getBySlug: (slug) => request(`/restaurants/${slug}`, { auth: false }),
};
