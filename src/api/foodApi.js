import { request } from './apiClient';

export const foodApi = {
  /** GET /api/foods — supports search, restaurant, category, veg, available */
  list: (params = {}) => request('/foods', { params, auth: false }),

  /** GET /api/foods/:id — food with populated restaurant */
  getById: (id) => request(`/foods/${id}`, { auth: false }),
};
