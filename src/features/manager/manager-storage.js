export const MANAGER_SELECTED_USER_KEY = 'pdf-app-admin-selected-user';
export const MANAGER_SELECTED_ORDER_KEY = 'pdf-app-admin-selected-order';
export const MANAGER_ORDERS_SELECTED_ONLY_KEY = 'pdf-app-admin-orders-selected-only';

export function getStoredManagerSelectedUserId() {
  return localStorage.getItem(MANAGER_SELECTED_USER_KEY) || '';
}

export function setStoredManagerSelectedUserId(userId) {
  if (userId) {
    localStorage.setItem(MANAGER_SELECTED_USER_KEY, userId);
    return;
  }

  localStorage.removeItem(MANAGER_SELECTED_USER_KEY);
}

export function getStoredManagerSelectedOrderId() {
  return localStorage.getItem(MANAGER_SELECTED_ORDER_KEY) || '';
}

export function setStoredManagerSelectedOrderId(orderId) {
  if (orderId) {
    localStorage.setItem(MANAGER_SELECTED_ORDER_KEY, orderId);
    return;
  }

  localStorage.removeItem(MANAGER_SELECTED_ORDER_KEY);
}

export function getStoredManagerOrdersSelectedOnly() {
  return localStorage.getItem(MANAGER_ORDERS_SELECTED_ONLY_KEY) === '1';
}

export function setStoredManagerOrdersSelectedOnly(value) {
  if (value) {
    localStorage.setItem(MANAGER_ORDERS_SELECTED_ONLY_KEY, '1');
    return;
  }

  localStorage.removeItem(MANAGER_ORDERS_SELECTED_ONLY_KEY);
}
