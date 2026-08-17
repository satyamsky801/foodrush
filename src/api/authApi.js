import { request } from './apiClient';

export const authApi = {
  /** POST /api/auth/register → { token, user } */
  register: (data) => request('/auth/register', { method: 'POST', body: data, auth: false }),

  /** POST /api/auth/login — identifier is email or phone → { token, user } */
  login: (identifier, password) =>
    request('/auth/login', { method: 'POST', body: { identifier, password }, auth: false }),

  /** GET /api/auth/me — current session */
  me: () => request('/auth/me'),

  /** PATCH /api/auth/me — update name/phone */
  updateProfile: (data) => request('/auth/me', { method: 'PATCH', body: data }),

  /** POST /api/auth/forgot-password */
  forgotPassword: (email) =>
    request('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),

  /** POST /api/auth/reset-password/:token */
  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, { method: 'POST', body: { password }, auth: false }),
};
