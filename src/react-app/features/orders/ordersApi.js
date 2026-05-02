import { baseApi } from '../../app/api/baseApi.js';

export const ordersApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    getOrders: builder.query({
      query: (query = {}) => ({
        url: '/orders',
        params: {
          page: 1,
          limit: 50,
          ...query,
        },
      }),
      providesTags: result => {
        const orders = Array.isArray(result?.orders) ? result.orders : [];

        return [
          { type: 'Orders', id: 'LIST' },
          ...orders.map(order => ({ type: 'Orders', id: order.id })),
        ];
      },
    }),
    getOrder: builder.query({
      query: orderId => `/orders/${orderId}`,
      providesTags: (_result, _error, orderId) => [
        { type: 'Orders', id: orderId },
      ],
    }),
    createOrder: builder.mutation({
      query: body => ({
        url: '/orders',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Orders', id: 'LIST' }],
    }),
    updateOrder: builder.mutation({
      query: ({ orderId, payload, options }) => ({
        url: `/orders/${orderId}`,
        method: 'PATCH',
        body: payload,
        ...(options || {}),
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: orderId },
      ],
    }),
    archiveOrder: builder.mutation({
      query: orderId => ({
        url: `/orders/${orderId}/archive`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, orderId) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: orderId },
      ],
    }),
    assignDriver: builder.mutation({
      query: ({ orderId, userId }) => ({
        url: `/orders/${orderId}/assign-driver`,
        method: 'PATCH',
        body: {
          userId,
        },
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Orders', id: 'LIST' },
        { type: 'Orders', id: orderId },
      ],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useArchiveOrderMutation,
  useAssignDriverMutation,
} = ordersApi;
