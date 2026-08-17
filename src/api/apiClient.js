/**
 * Centralized API client.
 *
 * - Reads the base URL from VITE_API_URL (falls back to the Vite dev proxy `/api`).
 * - Attaches the JWT (Bearer) to authenticated requests.
 * - Normalizes errors into ApiError with a user-friendly message.
 * - On 401 (expired/invalid token) clears the session and notifies the app.
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'foodrush_token';

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message || 'Something went wrong. Please try again.');
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable — fail silently.
  }
};

/** Fired when any API call returns 401 so AuthContext can drop the session. */
const notifyUnauthorized = () => {
  try {
    window.dispatchEvent(new Event('foodrush:unauthorized'));
  } catch {
    // Ignore.
  }
};

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, v));
    } else {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
};

/**
 * Core request helper.
 * @param {string} path  e.g. '/restaurants'
 * @param {object} opts  { method, body, params, auth }
 */
export async function request(path, { method = 'GET', body, params, auth = true } = {}) {
  const headers = {};
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_URL}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: payload,
    });
  } catch {
    throw new ApiError('Cannot reach the FoodRush server. Make sure the backend is running (cd backend && npm run dev).', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Empty/non-JSON response.
  }

  if (res.status === 401) {
    setToken(null);
    notifyUnauthorized();
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data);
  }

  // Some endpoints may return a non-JSON success (shouldn't happen, but be safe).
  return data && typeof data === 'object' ? data : { success: true };
}
