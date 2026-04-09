import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';

export async function API_getOrders() {
  const response = await fetchApi('/orders', {
    method: 'GET',
  });

  return readJsonResponse(response, 'Не вдалося завантажити замовлення');
}

export async function API_getOrder(orderId) {
  const response = await fetchApi(`/orders/${orderId}`, {
    method: 'GET',
  });

  return readJsonResponse(response, 'Не вдалося завантажити замовлення');
}

export async function API_createOrder(payload) {
  const response = await fetchApi('/orders', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, 'Не вдалося створити замовлення');
}

export async function API_updateOrder(orderId, payload) {
  const response = await fetchApi(`/orders/${orderId}`, {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, 'Не вдалося оновити замовлення');
}
