import { fetchApi } from '../../shared/api/client.js';
import { readJsonResponse } from '../../shared/api/response.js';
import { beginApiLoader, endApiLoader } from '../../shared/ui/loader.js';
import { t } from '../../shared/i18n/app.js';

export async function getOrders(query = {}) {
  const response = await fetchApi('/orders', {
    query: {
      page: 1,
      limit: 50,
      ...query,
    },
  });
  return readJsonResponse(response, t('api_orders_failed'));
}

export async function getAllOrders(query = {}) {
  const baseQuery = { ...query };
  delete baseQuery.page;
  delete baseQuery.limit;

  const limit = 50;
  const orders = [];

  beginApiLoader();

  try {
    let page = 1;

    while (true) {
      const response = await fetchApi('/orders', {
        query: {
          ...baseQuery,
          page,
          limit,
        },
      });
      const payload = await readJsonResponse(response, t('api_orders_failed'));
      const pageOrders = Array.isArray(payload.orders) ? payload.orders : [];

      orders.push(...pageOrders);

      if (pageOrders.length < limit) {
        break;
      }

      page += 1;
    }
  } finally {
    endApiLoader();
  }

  return { orders };
}

export async function getOrder(orderId) {
  const response = await fetchApi(`/orders/${orderId}`);
  return readJsonResponse(response, t('api_order_failed'));
}

export async function createOrder(payload) {
  const response = await fetchApi('/orders', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('api_create_order_failed'));
}

export async function updateOrder(orderId, payload, options = {}) {
  const response = await fetchApi(`/orders/${orderId}`, {
    method: 'PATCH',
    body: payload,
    options,
  });

  return readJsonResponse(response, t('api_update_order_failed'));
}

export async function archiveOrder(orderId) {
  const response = await fetchApi(`/orders/${orderId}/archive`, {
    method: 'PATCH',
  });

  return readJsonResponse(response, t('api_archive_order_failed'));
}

export async function assignOrderDriver(orderId, payload) {
  const response = await fetchApi(`/orders/${orderId}/assign-driver`, {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, t('api_assign_order_failed'));
}
