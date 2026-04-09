import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';
import { t } from '../../js/i18n/app.js';

function matchesManagerUserQuery(user, query = {}) {
  const search = String(query.search || '').trim().toLowerCase();
  const status = String(query.status || 'all').trim().toLowerCase();
  const role = String(query.role || 'all').trim().toLowerCase();
  const planId = String(query.planId || 'all').trim();

  if (status && status !== 'all' && String(user.subscription?.status || '').toLowerCase() !== status) {
    return false;
  }

  if (role && role !== 'all' && String(user.role || '').toLowerCase() !== role) {
    return false;
  }

  const resolvedPlanId = String(user.planId || user.subscription?.planId || '').trim();
  if (planId && planId !== 'all' && resolvedPlanId !== planId) {
    return false;
  }

  if (!search) return true;

  const haystack = [user.name, user.email].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(search);
}

function sortByUpdatedAtDesc(items = []) {
  return [...items].sort((left, right) =>
    String(right.updatedAt || '').localeCompare(String(left.updatedAt || ''))
  );
}

function categorizeManagerOrderStatus(status) {
  const value = String(status || '').toLowerCase();

  if (value === 'pdf_generated') return 'generated';
  if (value.includes('fail')) return 'failed';
  return 'pending';
}

function matchesManagerOrderQuery(order, query = {}) {
  const search = String(query.search || '').trim().toLowerCase();
  const status = String(query.status || 'all').trim().toLowerCase();
  const userId = String(query.userId || '').trim();

  if (userId && order.userId !== userId) {
    return false;
  }

  if (status && status !== 'all') {
    const category = categorizeManagerOrderStatus(order.status);
    const exact = String(order.status || '').toLowerCase();

    if (status === 'pending' || status === 'generated' || status === 'failed') {
      if (category !== status) return false;
    } else if (exact !== status) {
      return false;
    }
  }

  if (!search) return true;

  const haystack = [
    order.orderNumber,
    order.customer?.name,
    order.customer?.email,
    order.trip?.from,
    order.trip?.to,
    order.user?.name,
    order.user?.email,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search);
}

function buildManagerOrdersSummary(orders = []) {
  return orders.reduce(
    (summary, order) => {
      summary.all += 1;
      summary[categorizeManagerOrderStatus(order.status)] += 1;
      return summary;
    },
    {
      all: 0,
      pending: 0,
      failed: 0,
      generated: 0,
    }
  );
}

export async function API_getManagerUsers(query = {}) {
  try {
    const response = await fetchApi('/manager/users', {
      method: 'GET',
      query,
    });

    return await readJsonResponse(response, t('api_manager_users_failed'));
  } catch (error) {
    if (error?.status !== 404) {
      throw error;
    }

    const legacyResponse = await fetchApi('/admin/users', {
      method: 'GET',
    });
    const payload = await readJsonResponse(
      legacyResponse,
      t('api_manager_users_failed')
    );

    return {
      users: sortByUpdatedAtDesc(payload.users || []).filter(user =>
        matchesManagerUserQuery(user, query)
      ),
    };
  }
}

export async function API_getManagerUser(userId) {
  try {
    const response = await fetchApi(`/manager/users/${userId}`, {
      method: 'GET',
    });

    return await readJsonResponse(response, t('api_account_details_failed'));
  } catch (error) {
    if (error?.status !== 404) {
      throw error;
    }

    const [usersResult, ordersResult, auditResult] = await Promise.allSettled([
      API_getManagerUsers(),
      API_getManagerOrders({ userId, limit: 8 }),
      API_getManagerAudit({ targetUserId: userId, limit: 20 }),
    ]);

    const users = usersResult.status === 'fulfilled' ? usersResult.value.users || [] : [];
    const user = users.find(item => item.id === userId) || null;

    if (!user) {
      throw error;
    }

    return {
      user,
      recentOrders:
        ordersResult.status === 'fulfilled' ? ordersResult.value.orders || [] : [],
      audit: auditResult.status === 'fulfilled' ? auditResult.value.audit || [] : [],
    };
  }
}

export async function API_updateManagerUserSubscription(userId, payload) {
  const response = await fetchApi(`/manager/users/${userId}/subscription`, {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, t('api_subscription_update_failed'));
}

export async function API_extendManagerUserSubscription(userId, payload = {}) {
  const response = await fetchApi(`/manager/users/${userId}/subscription/extend`, {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('api_subscription_extend_failed'));
}

export async function API_cancelManagerUserSubscription(userId) {
  const response = await fetchApi(`/manager/users/${userId}/subscription/cancel`, {
    method: 'POST',
  });

  return readJsonResponse(response, t('api_subscription_cancel_failed'));
}

export async function API_updateManagerUserRole(userId, role) {
  const response = await fetchApi(`/manager/users/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });

  return readJsonResponse(response, t('api_role_update_failed'));
}

export async function API_getManagerPlans() {
  try {
    const response = await fetchApi('/manager/plans', {
      method: 'GET',
    });

    return await readJsonResponse(response, t('api_manager_plans_failed'));
  } catch (error) {
    if (error?.status !== 404) {
      throw error;
    }

    const fallbackResponse = await fetchApi('/plans', {
      method: 'GET',
    });

    return readJsonResponse(fallbackResponse, t('api_manager_plans_failed'));
  }
}

export async function API_getManagerOrders(query = {}) {
  try {
    const response = await fetchApi('/manager/orders', {
      method: 'GET',
      query,
    });

    return await readJsonResponse(response, t('api_manager_orders_failed'));
  } catch (error) {
    if (error?.status !== 404) {
      throw error;
    }

    const legacyResponse = await fetchApi('/admin/orders', {
      method: 'GET',
      query: query.userId ? { userId: query.userId } : {},
    });
    const payload = await readJsonResponse(
      legacyResponse,
      t('api_manager_orders_failed')
    );
    const allOrders = payload.orders || [];
    const filteredOrders = allOrders.filter(order => matchesManagerOrderQuery(order, query));
    const limit = Math.max(1, Number(query.limit) || filteredOrders.length || 100);

    return {
      orders: filteredOrders.slice(0, limit),
      summary: buildManagerOrdersSummary(filteredOrders),
    };
  }
}

export async function API_createManagerPlan(payload) {
  const response = await fetchApi('/manager/plans', {
    method: 'POST',
    body: payload,
  });

  return readJsonResponse(response, t('api_plan_create_failed'));
}

export async function API_updateManagerPlan(planId, payload) {
  const response = await fetchApi(`/manager/plans/${planId}`, {
    method: 'PATCH',
    body: payload,
  });

  return readJsonResponse(response, t('api_plan_update_failed'));
}

export async function API_getManagerAudit(query = {}) {
  try {
    const response = await fetchApi('/manager/audit', {
      method: 'GET',
      query,
    });

    return await readJsonResponse(response, t('api_audit_failed'));
  } catch (error) {
    if (error?.status !== 404) {
      throw error;
    }

    return { audit: [] };
  }
}
