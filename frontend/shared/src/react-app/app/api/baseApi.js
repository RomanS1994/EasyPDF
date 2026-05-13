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

let offlineNoticeShownSinceReconnect = false;
let refreshRequestPromise = null;

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

function shouldShowOfflineNotice() {
  return !offlineNoticeShownSinceReconnect;
}

function markOfflineNoticeShown() {
  offlineNoticeShownSinceReconnect = true;
}

function resetOfflineNoticeState() {
  offlineNoticeShownSinceReconnect = false;
}

// Показує offline тільки для явних user-actions, а не для фонових query/refetch.
function shouldSurfaceOfflineForRequest(api) {
  return api?.type === 'mutation';
}

// Виконує refresh у режимі single-flight, щоб паралельні 401 не ротили сесію одночасно.
function getSharedRefreshRequest(runRefreshFlow) {
  if (!refreshRequestPromise) {
    refreshRequestPromise = runRefreshFlow().finally(() => {
      refreshRequestPromise = null;
    });
  }

  return refreshRequestPromise;
}

// Оновлює локальну сесію після вдалого refresh.
function applySuccessfulRefresh(api, refreshResult) {
  const nextToken = refreshResult?.data?.token || '';
  const nextUser = refreshResult?.data?.user || null;

  if (!nextToken || !nextUser) {
    return false;
  }

  saveSession(nextToken, nextUser);
  resetOfflineNoticeState();
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
        const sessionToken = api.getState?.()?.auth?.token || getToken();

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

    // Пробує оновити сесію й повертає структурований результат для поточного запиту.
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

      return getSharedRefreshRequest(async () => {
        let refreshResult = await runRefreshRequest();

        if (applySuccessfulRefresh(api, refreshResult)) {
          return { ok: true, reason: '' };
        }

        const refreshError = refreshResult.error;
        if (refreshError?.status === 401) {
          clearExpiredSession(api, t);
          return { ok: false, reason: 'expired' };
        }

        if (isNetworkRefreshError(refreshError)) {
          await sleep(350);
          refreshResult = await runRefreshRequest();

          if (applySuccessfulRefresh(api, refreshResult)) {
            return { ok: true, reason: '' };
          }
        }

        const finalRefreshError = refreshResult.error;
        if (finalRefreshError?.status === 401) {
          clearExpiredSession(api, t);
          return { ok: false, reason: 'expired' };
        }

        if (!finalRefreshError) {
          return { ok: false, reason: 'server' };
        }

        return {
          ok: false,
          reason: isNetworkRefreshError(finalRefreshError) ? 'offline' : 'server',
        };
      });
    }

    let result = await baseQuery(args, api, extraOptions);

    if (!result.error) {
      resetOfflineNoticeState();
    }

    if (result.error?.status === 401 && !isAuthEndpoint(args)) {
      const refreshed = await refreshSession();

      if (refreshed?.ok) {
        result = await baseQuery(args, api, extraOptions);

        if (!result.error) {
          resetOfflineNoticeState();
        }
      } else if (refreshed?.reason === 'offline') {
        if (shouldSurfaceOfflineForRequest(api) && shouldShowOfflineNotice()) {
          markOfflineNoticeShown();
          api.dispatch(
            setSessionError({
              type: 'offline',
              message: t('auth.connectionLostKeepSession'),
            }),
          );
        }
      } else if (refreshed?.reason === 'server') {
        api.dispatch(
          setSessionError({
            type: 'server',
            message: t('auth.sessionCheckFailedKeepSession'),
          }),
        );
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
