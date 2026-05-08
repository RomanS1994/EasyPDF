import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { clearSession as clearStoredSession, saveSession } from '../../features/auth/authStorage.js';
import {
  clearSession,
  clearSessionError,
  setSession,
  setSessionError,
} from '../../features/auth/authSlice.js';
import { getToken } from '../../features/auth/authStorage.js';
import { getMessage } from '../i18n/messages.js';
import { readStoredLanguage } from '../i18n/languageStorage.js';

function resolveBaseUrl() {
  if (import.meta.env.DEV) {
    return (
      import.meta.env.VITE_API_BASE_URL_TEST ||
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:3001/api'
    );
  }

  return import.meta.env.VITE_API_BASE_URL || '/api';
}

// Дає коротку паузу перед повторною спробою refresh-запиту.
function sleep(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

// Відрізняє мережеві refresh-помилки від server-side відповіді.
function isNetworkRefreshError(error) {
  return (
    error?.status === 'FETCH_ERROR' ||
    error?.status === 'TIMEOUT_ERROR' ||
    !error?.status
  );
}

// Оновлює локальну сесію після вдалого refresh.
function applySuccessfulRefresh(api, refreshResult) {
  const nextToken = refreshResult?.data?.token || '';
  const nextUser = refreshResult?.data?.user || null;

  if (!nextToken || !nextUser) {
    return false;
  }

  saveSession(nextToken, nextUser);
  api.dispatch(setSession({ token: nextToken, user: nextUser }));
  api.dispatch(clearSessionError());
  return true;
}

// Повністю скидає сесію, якщо refresh підтвердив її завершення.
function clearExpiredSession(api, t) {
  clearStoredSession();
  api.dispatch(clearSession());
  api.dispatch(
    setSessionError({
      type: 'expired',
      message: t('auth.sessionExpiredSignIn'),
    }),
  );
}

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: async (args, api, extraOptions) => {
    const baseQuery = fetchBaseQuery({
      baseUrl: resolveBaseUrl(),
      credentials: 'include',
      prepareHeaders(headers) {
        const apiKey = import.meta.env.VITE_API_KEY;
        const sessionToken = getToken();

        if (apiKey) {
          headers.set('X-API-KEY', apiKey);
        }

        if (sessionToken) {
          headers.set('Authorization', `Bearer ${sessionToken}`);
        }

        return headers;
      },
    });

    function getRequestUrl(requestArgs) {
      if (typeof requestArgs === 'string') {
        return requestArgs;
      }

      return requestArgs?.url || '';
    }

    function isAuthEndpoint(requestArgs) {
      return getRequestUrl(requestArgs).startsWith('/auth/');
    }

    function t(key) {
      return getMessage(readStoredLanguage(), key);
    }

    // Пробує оновити сесію й не показує offline, поки не провалиться retry.
    async function refreshSession() {
      // Виконує один refresh-запит без побічних ефектів.
      async function runRefreshRequest() {
        return baseQuery(
          {
            url: '/auth/refresh',
            method: 'POST',
          },
          api,
          extraOptions,
        );
      }

      let refreshResult = await runRefreshRequest();

      if (applySuccessfulRefresh(api, refreshResult)) {
        return true;
      }

      const refreshError = refreshResult.error;
      if (refreshError?.status === 401) {
        clearExpiredSession(api, t);
        return false;
      }

      if (isNetworkRefreshError(refreshError)) {
        await sleep(350);
        refreshResult = await runRefreshRequest();

        if (applySuccessfulRefresh(api, refreshResult)) {
          return true;
        }
      }

      const finalRefreshError = refreshResult.error;
      if (finalRefreshError?.status === 401) {
        clearExpiredSession(api, t);
        return false;
      }

      if (finalRefreshError) {
        const isOffline = isNetworkRefreshError(finalRefreshError);

        api.dispatch(
          setSessionError({
            type: isOffline ? 'offline' : 'server',
            message: isOffline
              ? t('auth.connectionLostKeepSession')
              : t('auth.sessionCheckFailedKeepSession'),
          }),
        );
      }

      return false;
    }

    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status === 401 && !isAuthEndpoint(args)) {
      const refreshed = await refreshSession();

      if (refreshed) {
        result = await baseQuery(args, api, extraOptions);
      }
    }

    return result;
  },
  tagTypes: [
    'Orders',
    'Usage',
    'Me',
    'AdminUsers',
    'AdminPlans',
    'AdminOrders',
    'ManagerUsers',
    'ManagerPlans',
    'ManagerOrders',
    'AuditLogs',
    'PublicPlans',
  ],
  endpoints: () => ({}),
});
