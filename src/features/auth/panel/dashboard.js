import { activateTab } from './routes.js';
import { refs } from './refs.js';
import { isAdminShell, setGuestVisible } from './shell.js';
import { clearManagerState, state } from './state.js';
import {
  formatCycleLabel,
  localizeRole,
  localizeSubscriptionStatus,
} from './formatters.js';
import { renderOrderList } from './orders.js';
import { getMetrics, renderStatsCharts } from './stats.js';
import {
  renderManagerAccessState,
  renderManagerAudit,
  renderManagerOrders,
  renderManagerPlans,
  renderManagerSelectedUser,
  renderManagerUsers,
} from './manager-render.js';
import { t } from '../../../shared/i18n/app.js';

export function renderDashboard() {
  if (!state.user) return;

  const metrics = getMetrics();
  const usageText = `${metrics.usage.used} / ${metrics.usage.limit}`;
  const contextUser =
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null;

  if (refs.workspaceGreeting) {
    refs.workspaceGreeting.textContent = t('hello', {
      name: state.user.name || t('driver_fallback'),
    });
  }
  if (refs.workspacePlan) {
    refs.workspacePlan.textContent = isAdminShell()
      ? localizeRole(state.user.role || 'user')
      : state.user.plan?.name || '-';
  }
  if (refs.workspaceUsage) {
    refs.workspaceUsage.textContent = isAdminShell()
      ? contextUser?.email || t('no_account')
      : usageText;
  }

  if (refs.accountName) refs.accountName.textContent = state.user.name || '-';
  if (refs.accountEmail) refs.accountEmail.textContent = state.user.email || '-';
  if (refs.accountPlan) refs.accountPlan.textContent = state.user.plan?.name || '-';
  if (refs.accountUsage) refs.accountUsage.textContent = usageText;
  if (refs.accountRole) refs.accountRole.textContent = localizeRole(state.user.role || 'user');
  if (refs.accountSubscriptionStatus) {
    refs.accountSubscriptionStatus.textContent = localizeSubscriptionStatus(
      state.user.subscription?.status || '-',
    );
  }
  if (refs.accountSubscriptionCycle) {
    refs.accountSubscriptionCycle.textContent = formatCycleLabel(state.user.usage);
  }

  const profile = state.user.profile || {};
  const driver = profile.driver || {};
  const provider = profile.provider || {};

  if (refs.accountDriverName) refs.accountDriverName.value = driver.name || '';
  if (refs.accountDriverAddress) refs.accountDriverAddress.value = driver.address || '';
  if (refs.accountDriverSpz) refs.accountDriverSpz.value = driver.spz || '';
  if (refs.accountDriverIco) refs.accountDriverIco.value = driver.ico || '';
  if (refs.accountProviderName) refs.accountProviderName.value = provider.name || '';
  if (refs.accountProviderAddress) refs.accountProviderAddress.value = provider.address || '';
  if (refs.accountProviderIco) refs.accountProviderIco.value = provider.ico || '';

  if (refs.statsMonth) refs.statsMonth.textContent = formatCycleLabel(metrics.usage);
  if (refs.statsPlanValue) refs.statsPlanValue.textContent = state.user.plan?.name || '-';
  if (refs.statsUsageValue) refs.statsUsageValue.textContent = usageText;
  if (refs.statsRemainingValue) refs.statsRemainingValue.textContent = String(metrics.usage.remaining || 0);
  if (refs.statsOrdersValue) refs.statsOrdersValue.textContent = String(metrics.totalOrders);
  if (refs.statsGeneratedValue) refs.statsGeneratedValue.textContent = String(metrics.generatedOrders);
  if (refs.statsUsageBar) refs.statsUsageBar.style.width = `${metrics.usagePercent}%`;
  if (refs.statsUsagePercent) {
    refs.statsUsagePercent.textContent = t('usage_percent_used', { percent: metrics.usagePercent });
  }

  renderStatsCharts(metrics);
  renderOrderList(refs.ordersList, refs.ordersEmpty, state.orders, {
    emptyText: t('orders_empty_home'),
  });
  renderManagerAccessState();
  renderManagerUsers();
  renderManagerSelectedUser();
  renderManagerPlans();
  renderManagerAudit();
  renderManagerOrders();
}

export function broadcastAuthState() {
  window.dispatchEvent(
    new CustomEvent('pdf-app:auth-changed', {
      detail: {
        isAuthenticated: Boolean(state.user),
        user: state.user,
      },
    }),
  );
}

export function renderAuthenticatedState({ resetTab = false } = {}) {
  if (!state.user) {
    if (state.activeTab !== 'home') {
      state.authMode = 'login';
    }

    setGuestVisible(true);
    clearManagerState();
    renderOrderList(refs.ordersList, refs.ordersEmpty, [], {
      emptyText: t('orders_empty_home'),
    });
    renderManagerUsers();
    renderManagerSelectedUser();
    renderManagerPlans();
    renderManagerAudit();
    renderManagerOrders();

    if (resetTab) {
      activateTab(state.activeTab);
    }

    broadcastAuthState();
    return;
  }

  setGuestVisible(false);
  renderDashboard();

  if (resetTab) {
    activateTab(state.activeTab);
  }

  broadcastAuthState();
}
