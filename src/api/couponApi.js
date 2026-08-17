import { request } from './apiClient';

export const couponApi = {
  /** GET /api/coupons — active coupons */
  list: () => request('/coupons', { auth: false }),

  /**
   * POST /api/coupons/validate — the backend decides whether a code is valid
   * and how much it discounts. Throws ApiError with the server's message when
   * the code is invalid or the minimum order isn't met.
   */
  validate: (body) => request('/coupons/validate', { method: 'POST', body, auth: false }),
};
