import { request } from './apiClient';

export const reviewApi = {
  /** POST /api/reviews — only for delivered orders of that restaurant */
  create: (body) => request('/reviews', { method: 'POST', body }),

  /** GET /api/reviews/restaurant/:id → { reviews, distribution } */
  getRestaurantReviews: (restaurantId) =>
    request(`/reviews/restaurant/${restaurantId}`, { auth: false }),

  /** GET /api/reviews/food/:id */
  getFoodReviews: (foodId) => request(`/reviews/food/${foodId}`, { auth: false }),
};
