import { baseApi } from '../../app/api/baseApi.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    login: builder.mutation({
      query: body => ({
        url: '/auth/login',
        method: 'POST',
        body,
      }),
    }),
    register: builder.mutation({
      query: body => ({
        url: '/auth/register',
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query({
      query: () => '/me',
    }),
    updateProfile: builder.mutation({
      query: body => ({
        url: '/me/profile',
        method: 'PATCH',
        body,
      }),
      transformResponse: response => response.user || response,
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLazyGetMeQuery,
  useUpdateProfileMutation,
} = authApi;
