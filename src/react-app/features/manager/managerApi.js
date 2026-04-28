import { baseApi } from '../../app/api/baseApi.js';

function buildManagerPath(path) {
  return `/manager${path}`;
}

export const managerApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getManagerUsers: builder.query({
      query: (query = {}) => ({
        url: buildManagerPath('/users'),
        params: query,
      }),
      providesTags: result => {
        const users = Array.isArray(result?.users) ? result.users : [];

        return [
          { type: 'ManagerUsers', id: 'LIST' },
          ...users.map(user => ({ type: 'ManagerUsers', id: user.id })),
        ];
      },
    }),
    getManagerUser: builder.query({
      query: userId => buildManagerPath(`/users/${userId}`),
      providesTags: (_result, _error, userId) => [
        { type: 'ManagerUsers', id: userId },
      ],
    }),
    updateUserRole: builder.mutation({
      query: ({ userId, role }) => ({
        url: buildManagerPath(`/users/${userId}/role`),
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'ManagerUsers', id: 'LIST' },
        { type: 'ManagerUsers', id: userId },
        { type: 'AuditLogs', id: 'LIST' },
      ],
    }),
    updateUserSubscription: builder.mutation({
      query: ({ userId, payload }) => ({
        url: buildManagerPath(`/users/${userId}/subscription`),
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: (_result, _error, { userId }) => [
        { type: 'ManagerUsers', id: 'LIST' },
        { type: 'ManagerUsers', id: userId },
        { type: 'AuditLogs', id: 'LIST' },
      ],
    }),
    getManagerPlans: builder.query({
      query: () => buildManagerPath('/plans'),
      providesTags: result => {
        const plans = Array.isArray(result?.plans) ? result.plans : [];

        return [
          { type: 'ManagerPlans', id: 'LIST' },
          ...plans.map(plan => ({ type: 'ManagerPlans', id: plan.id })),
        ];
      },
    }),
    createPlan: builder.mutation({
      query: payload => ({
        url: buildManagerPath('/plans'),
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [
        { type: 'ManagerPlans', id: 'LIST' },
        { type: 'AuditLogs', id: 'LIST' },
      ],
    }),
    updatePlan: builder.mutation({
      query: ({ planId, payload }) => ({
        url: buildManagerPath(`/plans/${planId}`),
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: (_result, _error, { planId }) => [
        { type: 'ManagerPlans', id: 'LIST' },
        { type: 'ManagerPlans', id: planId },
        { type: 'AuditLogs', id: 'LIST' },
      ],
    }),
    getManagerOrders: builder.query({
      query: (query = {}) => ({
        url: buildManagerPath('/orders'),
        params: query,
      }),
      providesTags: result => {
        const orders = Array.isArray(result?.orders) ? result.orders : [];

        return [
          { type: 'ManagerOrders', id: 'LIST' },
          ...orders.map(order => ({ type: 'ManagerOrders', id: order.id })),
        ];
      },
    }),
    getAuditLogs: builder.query({
      query: (query = {}) => ({
        url: buildManagerPath('/audit'),
        params: query,
      }),
      providesTags: result => {
        const audit = Array.isArray(result?.audit) ? result.audit : [];

        return [
          { type: 'AuditLogs', id: 'LIST' },
          ...audit.map(entry => ({ type: 'AuditLogs', id: entry.id })),
        ];
      },
    }),
  }),
});

export const {
  useGetManagerUsersQuery,
  useGetManagerUserQuery,
  useUpdateUserRoleMutation,
  useUpdateUserSubscriptionMutation,
  useGetManagerPlansQuery,
  useCreatePlanMutation,
  useUpdatePlanMutation,
  useGetManagerOrdersQuery,
  useGetAuditLogsQuery,
} = managerApi;
