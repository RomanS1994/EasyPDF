import { fetchApi } from '../../shared/api/client.js';
import { readJsonResponse } from '../../shared/api/response.js';
import { t } from '../../shared/i18n/app.js';

function buildManagerPath(pathname) {
  return `/admin${pathname}`;
}

export async function getManagerUsers(query = {}) {
  const response = await fetchApi(buildManagerPath('/users'), { query });
  return readJsonResponse(response, t('admin_workspace_failed'));
}

export async function getManagerUser(userId) {
  const response = await fetchApi(buildManagerPath(`/users/${userId}`));
  return readJsonResponse(response, t('account_detail_failed'));
}

export async function updateManagerUserSubscription(userId, payload) {
  const response = await fetchApi(buildManagerPath(`/users/${userId}/subscription`), {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, t('update_subscription_failed'));
}

export async function extendManagerUserSubscription(userId, payload = {}) {
  const response = await fetchApi(
    buildManagerPath(`/users/${userId}/subscription/extend`),
    {
      method: 'POST',
      body: payload,
    }
  );

  return readJsonResponse(response, t('extend_subscription_failed'));
}

export async function cancelManagerUserSubscription(userId) {
  const response = await fetchApi(
    buildManagerPath(`/users/${userId}/subscription/cancel`),
    { method: 'POST' }
  );

  return readJsonResponse(response, t('cancel_subscription_failed'));
}

export async function updateManagerUserRole(userId, role) {
  const response = await fetchApi(buildManagerPath(`/users/${userId}/role`), {
    method: 'PATCH',
    body: { role },
  });

  return readJsonResponse(response, t('update_role_failed'));
}

export async function getManagerPlans() {
  const response = await fetchApi(buildManagerPath('/plans'));
  return readJsonResponse(response, t('load_plans_failed'));
}

export async function createManagerPlan(payload) {
  const response = await fetchApi(buildManagerPath('/plans'), {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('save_plan_failed'));
}

export async function updateManagerPlan(planId, payload) {
  const response = await fetchApi(buildManagerPath(`/plans/${planId}`), {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, t('save_plan_failed'));
}

export async function getManagerOrders(query = {}) {
  const response = await fetchApi(buildManagerPath('/orders'), { query });
  return readJsonResponse(response, t('admin_orders_failed'));
}

export async function getManagerAudit(query = {}) {
  const response = await fetchApi(buildManagerPath('/audit'), { query });
  return readJsonResponse(response, t('admin_workspace_failed'));
}
