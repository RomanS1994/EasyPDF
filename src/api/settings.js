import {
  clearStoredSession,
  getSessionToken,
  setStoredSession,
} from './auth/session.js';
import {
  beginApiLoader,
  endApiLoader,
} from '../js/loaderOverlay.js';

function resolveApiBase() {
  if (import.meta.env.DEV) {
    return (
      import.meta.env.VITE_API_BASE_URL_TEST ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:3001/api'
    );
  }

  return import.meta.env.VITE_API_BASE_URL || '/api';
}

let refreshSessionPromise = null;

function buildQueryString(query) {
  return query
    ? Object.entries(query)
        .map(
          ([key, val]) =>
            `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
        )
        .join('&')
    : '';
}

function buildApiUrl(base, endpoint, query) {
  const queryString = buildQueryString(query);
  return `${base}${endpoint}${queryString ? `?${queryString}` : ''}`;
}

function shouldAttemptRefresh(endpoint) {
  return ![
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/auth/refresh',
  ].some(prefix => endpoint.startsWith(prefix));
}

async function performRequest({
  url,
  method,
  body,
  options,
  apiKey,
  sessionToken,
  loaderMessageKey = 'loading_data',
  showLoader = true,
}) {
  const headers = { ...(options.headers || {}) };

  if (apiKey) {
    headers['X-API-KEY'] = apiKey;
  }

  if (sessionToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }

  if (body && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    ...options,
    credentials: options.credentials || 'include',
    method: method.toUpperCase(),
    headers,
  };

  if (body && fetchOptions.method !== 'GET' && fetchOptions.method !== 'HEAD') {
    fetchOptions.body = JSON.stringify(body);
  }

  if (showLoader) {
    beginApiLoader(loaderMessageKey);
  }

  try {
    return await fetch(url, fetchOptions);
  } finally {
    if (showLoader) {
      endApiLoader();
    }
  }
}

async function refreshAccessSession(base, apiKey) {
  if (refreshSessionPromise) {
    return refreshSessionPromise;
  }

  refreshSessionPromise = (async () => {
    const headers = {};

    if (apiKey) {
      headers['X-API-KEY'] = apiKey;
    }

    beginApiLoader('loading_data');

    let response;
    let payload;

    try {
      response = await fetch(`${base}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });
      payload = await response.json().catch(() => null);
    } finally {
      endApiLoader();
    }

    if (!response.ok || !payload?.token || !payload?.user) {
      clearStoredSession();
      return null;
    }

    setStoredSession({
      token: payload.token,
      user: payload.user,
    });

    return payload;
  })().finally(() => {
    refreshSessionPromise = null;
  });

  return refreshSessionPromise;
}

export const fetchApi = async (
  endpoint = '',
  {
    method = 'GET',
    query,
    body,
    options = {},
    skipAuthRefresh = false,
    loaderMessageKey = 'loading_data',
    showLoader = true,
  }
) => {
  const base = resolveApiBase();
  const API_KEY = import.meta.env.VITE_API_KEY;
  const url = buildApiUrl(base, endpoint, query);

  let response = await performRequest({
    url,
    method,
    body,
    options,
    apiKey: API_KEY,
    sessionToken: getSessionToken(),
    loaderMessageKey,
    showLoader,
  });

  if (
    response.status === 401 &&
    !skipAuthRefresh &&
    shouldAttemptRefresh(endpoint)
  ) {
    const refreshed = await refreshAccessSession(base, API_KEY);

    if (refreshed?.token) {
      response = await performRequest({
        url,
        method,
        body,
        options,
        apiKey: API_KEY,
        sessionToken: refreshed.token,
        loaderMessageKey,
        showLoader,
      });
    }
  }

  return response;
};
