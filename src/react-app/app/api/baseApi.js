import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getToken } from '../../features/auth/authStorage.js';

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

    const result = await baseQuery(args, api, extraOptions);

    return result;
  },
  tagTypes: [
    'Orders',
    'ManagerUsers',
    'ManagerPlans',
    'ManagerOrders',
    'AuditLogs',
    'PublicPlans',
  ],
  endpoints: () => ({}),
});
