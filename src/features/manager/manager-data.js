import {
  getManagerAudit,
  getManagerOrders,
  getManagerPlans,
  getManagerUser,
  getManagerUsers,
} from './api.js';
import { getOrder } from '../orders/api.js';
import { t } from '../../shared/i18n/app.js';
import { notifyText } from '../../shared/ui/toast.js';
import { refs } from './refs.js';
import { isAdminShell, isManagerRole } from '../auth/shell/shell.js';
import {
  setStoredManagerOrdersSelectedOnly,
  setStoredManagerSelectedOrderId,
  setStoredManagerSelectedUserId,
} from './manager-storage.js';
import { state } from './state.js';
import { state as accountState } from '../auth/account/state.js';
import { state as shellState } from '../auth/shell/state.js';
import { buildOrderStatusSummary } from '../../shared/lib/formatters.js';
import {
  renderManagerAudit,
  renderManagerOrders,
  renderManagerPlans,
  renderManagerSelectedUser,
  renderManagerUsers,
  syncSelectedManagerOrderFromCollections,
} from './manager-render.js';

export async function refreshManagerUserDetail(userId) {
  if (!userId || !isManagerRole(accountState.user?.role)) {
    state.managerSelectedUser = null;
    state.managerSelectedOrders = [];
    setStoredManagerSelectedUserId('');
    renderManagerSelectedUser();
    return;
  }

  try {
    const data = await getManagerUser(userId);
    state.managerSelectedUser = data.user || null;
    state.managerSelectedUserId = data.user?.id || '';
    setStoredManagerSelectedUserId(state.managerSelectedUserId);
    state.managerSelectedOrders = data.recentOrders || [];
    renderManagerSelectedUser();
  } catch (error) {
    notifyText(error.message || t('account_detail_failed'), 'error');
  }
}

export async function refreshManagerOrderDetail(orderId, { silent = false } = {}) {
  if (!orderId || !isAdminShell() || !isManagerRole(accountState.user?.role)) {
    state.managerSelectedOrderId = '';
    state.managerSelectedOrder = null;
    setStoredManagerSelectedOrderId('');
    syncSelectedManagerOrderFromCollections();
    return;
  }

  try {
    const data = await getOrder(orderId);
    state.managerSelectedOrderId = data.order?.id || orderId;
    state.managerSelectedOrder = data.order || null;
    setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    syncSelectedManagerOrderFromCollections();
  } catch (error) {
    if (!silent) {
      notifyText(error.message || t('order_detail_failed'), 'error');
    }
  }
}

export function getManagerOrdersFilters() {
  if (state.managerOrdersSelectedOnly && !state.managerSelectedUserId) {
    state.managerOrdersSelectedOnly = false;
    setStoredManagerOrdersSelectedOnly(false);
  }

  return {
    search: refs.managerOrdersSearchInput?.value?.trim() || '',
    status: refs.managerOrdersStatusFilter?.value || 'all',
    userId: state.managerOrdersSelectedOnly ? state.managerSelectedUserId || '' : '',
    page: 1,
    limit: 50,
  };
}

export async function loadManagerOrders() {
  if (!isAdminShell() || !isManagerRole(accountState.user?.role)) {
    state.managerOrders = [];
    state.managerOrdersSummary = buildOrderStatusSummary([]);
    renderManagerOrders();
    return;
  }

  try {
    const ordersResponse = await getManagerOrders(getManagerOrdersFilters());
    state.managerOrders = ordersResponse.orders || [];
    state.managerOrdersSummary = ordersResponse.summary || buildOrderStatusSummary(state.managerOrders);

    if (!state.managerSelectedOrderId && shellState.activeTab === 'orders') {
      state.managerSelectedOrderId = state.managerOrders[0]?.id || '';
      setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    }

    syncSelectedManagerOrderFromCollections();
    renderManagerOrders();
  } catch (error) {
    notifyText(error.message || t('admin_orders_failed'), 'error');
  }
}

export async function loadManagerData({ preserveSelection = true } = {}) {
  if (!isAdminShell() || !isManagerRole(accountState.user?.role)) {
    state.managerUsers = [];
    state.managerPlans = [];
    state.managerAudit = [];
    state.managerOrders = [];
    state.managerOrdersSummary = buildOrderStatusSummary([]);
    renderManagerUsers();
    renderManagerSelectedUser();
    renderManagerPlans();
    renderManagerAudit();
    renderManagerOrders();
    return;
  }

  try {
    const shouldLoadOrders = shellState.activeTab === 'orders';
    const filters = {
      search: refs.managerSearchInput?.value?.trim() || '',
      status: refs.managerStatusFilter?.value || 'all',
      role: refs.managerRoleFilter?.value || 'all',
      planId: refs.managerPlanFilter?.value || 'all',
    };

    const [usersResponse, plansResponse, auditResponse] = await Promise.all([
      getManagerUsers(filters),
      getManagerPlans(),
      getManagerAudit({ limit: 40 }),
    ]);

    state.managerUsers = usersResponse.users || [];
    state.managerPlans = plansResponse.plans || [];
    state.managerAudit = auditResponse.audit || [];

    if (shouldLoadOrders) {
      const ordersResponse = await getManagerOrders(getManagerOrdersFilters());
      state.managerOrders = ordersResponse.orders || [];
      state.managerOrdersSummary = ordersResponse.summary || buildOrderStatusSummary(state.managerOrders);
    } else {
      state.managerOrders = [];
      state.managerOrdersSummary = buildOrderStatusSummary([]);
      state.managerSelectedOrderId = '';
      state.managerSelectedOrder = null;
      setStoredManagerSelectedOrderId('');
    }

    if (!state.managerSelectedOrderId && shouldLoadOrders) {
      state.managerSelectedOrderId = state.managerOrders[0]?.id || '';
      setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    }

    renderManagerUsers();
    renderManagerPlans();
    renderManagerAudit();
    syncSelectedManagerOrderFromCollections();
    renderManagerOrders();

    const nextSelected = preserveSelection
      ? state.managerUsers.find(user => user.id === state.managerSelectedUserId)?.id ||
        state.managerUsers[0]?.id ||
        ''
      : state.managerUsers[0]?.id || '';

    if (!nextSelected) {
      state.managerSelectedUserId = '';
      state.managerSelectedUser = null;
      state.managerSelectedOrders = [];
      setStoredManagerSelectedUserId('');
      renderManagerSelectedUser();
      return;
    }

    await refreshManagerUserDetail(nextSelected);
  } catch (error) {
    notifyText(error.message || t('admin_workspace_failed'), 'error');
  }
}
