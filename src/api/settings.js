import { getSessionToken } from './auth/session.js';

export const fetchApi = async (
  endpoint = '',
  { method = 'GET', query, body, options = {} }
) => {
  const base =
    import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL_TEST
      ? import.meta.env.VITE_API_BASE_URL_TEST
      : import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
  const API_KEY = import.meta.env.VITE_API_KEY;
  const sessionToken = getSessionToken();
  const queryString = query
    ? Object.entries(query)
        .map(
          ([key, val]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
        )
        .join('&')
    : '';
  const url = `${base}${endpoint}${queryString ? `?${queryString}` : ''}`;

  // build headers and options safely
  const headers = { ...(options.headers || {}) };

  if (API_KEY) {
    headers['X-API-KEY'] = API_KEY;
  }

  if (sessionToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  if (body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    method: method.toUpperCase(),
    headers,
  };

  // do not attach body for GET/HEAD
  if (body && fetchOptions.method !== 'GET' && fetchOptions.method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(body);
  }

  return fetch(url, fetchOptions);
};
