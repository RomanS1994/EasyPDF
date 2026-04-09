import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';
import { t } from '../../js/i18n/app.js';

export async function API_getOrders() {
  const response = await fetchApi('/orders', {
    method: 'GET',
  });

  return readJsonResponse(response, t('api_orders_failed'));
}

export async function API_getOrder(orderId) {
  const response = await fetchApi(`/orders/${orderId}`, {
    method: 'GET',
  });

  return readJsonResponse(response, t('api_order_failed'));
}

export async function API_createOrder(payload) {
  const response = await fetchApi('/orders', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('api_create_order_failed'));
}

export async function API_updateOrder(orderId, payload) {
  const response = await fetchApi(`/orders/${orderId}`, {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, t('api_update_order_failed'));
}
