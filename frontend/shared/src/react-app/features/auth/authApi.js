import { baseApi } from '../../app/api/baseApi.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    refreshSession: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
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
      providesTags: [{ type: 'Me', id: 'CURRENT' }],
    }),
    getUsage: builder.query({
      query: () => '/me/usage',
      providesTags: [{ type: 'Usage', id: 'CURRENT' }],
    }),
    getTeam: builder.query({
      query: () => '/me/team',
      providesTags: [{ type: 'Me', id: 'TEAM' }],
    }),
    updateProfile: builder.mutation({
      query: body => ({
        url: '/me/profile',
        method: 'PATCH',
        body,
      }),
      transformResponse: response => response.user || response,
    }),
    updateTeam: builder.mutation({
      query: body => ({
        url: '/me/team',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [
        { type: 'Me', id: 'CURRENT' },
        { type: 'Me', id: 'TEAM' },
      ],
    }),
    requestSubscriptionUpgrade: builder.mutation({
      query: body => ({
        url: '/me/subscription/upgrade-request',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        { type: 'Usage', id: 'CURRENT' },
        { type: 'Me', id: 'CURRENT' },
      ],
      transformResponse: response => response.user || response,
    }),
    deleteMe: builder.mutation({
      query: () => ({
        url: '/me',
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useRefreshSessionMutation,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useLazyGetMeQuery,
  useGetUsageQuery,
  useGetTeamQuery,
  useUpdateProfileMutation,
  useUpdateTeamMutation,
  useRequestSubscriptionUpgradeMutation,
  useDeleteMeMutation,
} = authApi;
