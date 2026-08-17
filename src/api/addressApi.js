import { request } from './apiClient';

export const addressApi = {
  list: () => request('/addresses'),
  create: (data) => request('/addresses', { method: 'POST', body: data }),
  update: (id, data) => request(`/addresses/${id}`, { method: 'PATCH', body: data }),
  remove: (id) => request(`/addresses/${id}`, { method: 'DELETE' }),
};
