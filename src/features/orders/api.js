import { fetchApi } from '../../shared/api/client.js';
import { readJsonResponse } from '../../shared/api/response.js';
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

export async function getOrder(orderId) {
  const response = await fetchApi(`/orders/${orderId}`);
  return readJsonResponse(response, t('api_order_failed'));
}

export async function createOrder(payload) {
  const response = await fetchApi('/orders', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('create_order_failed'));
}

export async function updateOrder(orderId, payload, options = {}) {
  const response = await fetchApi(`/orders/${orderId}`, {
    method: 'PATCH',
    body: payload,
    options,
  });

  return readJsonResponse(response, t('update_order_failed'));
}
