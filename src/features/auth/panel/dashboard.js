import { activateTab } from './routes.js';
import { refs } from './refs.js';
import { isAdminShell, setGuestVisible } from './shell.js';
import { clearManagerState, state } from './state.js';
import {
  formatCycleLabel,
  formatDateLabel,
  localizeRole,
  localizeSubscriptionStatus,
} from './formatters.js';
import { renderOrderList } from './orders.js';
import { renderOrderDetail } from './order-detail.js';
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

const WHATSAPP_URL = import.meta.env.VITE_SUPPORT_WHATSAPP_URL || '';
const TELEGRAM_URL = import.meta.env.VITE_SUPPORT_TELEGRAM_URL || '';

function resolvePlanName(planId) {
  if (!planId) return '-';
  return state.plans.find(plan => plan.id === planId)?.name || planId;
}

export function renderDashboard() {
  if (!state.user) return;

  const metrics = getMetrics();
  const usageText = `${metrics.usage.used} / ${metrics.usage.limit}`;
  const usagePercentText = `${metrics.usagePercent}%`;
  const contextUser =
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null;
  const orderSummaryText = metrics.totalOrders > 0 ? String(metrics.totalOrders) : '0';
  const accountSummaryText = localizeRole(state.user.role || 'user');

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
  if (refs.workspaceCycleHome) {
    refs.workspaceCycleHome.textContent = formatCycleLabel(state.user.usage);
  }
  if (refs.workspaceUsage) {
    refs.workspaceUsage.textContent = isAdminShell()
      ? contextUser?.email || t('no_account')
      : usageText;
  }
  if (refs.workspaceUsageHome) {
    refs.workspaceUsageHome.textContent = `${usagePercentText} · ${usageText}`;
  }
  if (refs.workspaceOrdersHome) {
    refs.workspaceOrdersHome.textContent = orderSummaryText;
  }
  if (refs.workspaceAccountHome) {
    refs.workspaceAccountHome.textContent = accountSummaryText;
  }
  if (refs.workspaceAccountHomeNote) {
    refs.workspaceAccountHomeNote.textContent = state.user.email || t('no_account');
  }
  if (refs.ordersDateFilter && state.ordersDateFilter) {
    refs.ordersDateFilter.value = state.ordersDateFilter;
  }
  if (refs.statsHistoryDateFilter) {
    refs.statsHistoryDateFilter.value = state.ordersDateFilter;
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
  const pendingPlanId = state.user.subscription?.pendingPlanId || '';
  const hasPendingUpgrade = Boolean(pendingPlanId);
  const activePaidPlanId = Number(state.user.plan?.priceCzk) > 0 ? state.user.plan?.id : '';
  const upgradePlans = state.plans.filter(
    plan => Number(plan.priceCzk) > 0 && plan.id !== activePaidPlanId,
  );
  if (refs.accountPendingUpgradeSection) {
    refs.accountPendingUpgradeSection.classList.toggle('is-hidden', !hasPendingUpgrade);
  }
  if (refs.accountPendingUpgradePlan) {
    refs.accountPendingUpgradePlan.textContent = resolvePlanName(pendingPlanId);
  }
  if (refs.accountPendingUpgradeRequestedAt) {
    refs.accountPendingUpgradeRequestedAt.textContent = state.user.subscription?.pendingRequestedAt
      ? formatDateLabel(state.user.subscription.pendingRequestedAt)
      : '-';
  }
  if (refs.accountUpgradeSection) {
    refs.accountUpgradeSection.classList.toggle('is-hidden', !upgradePlans.length);
  }
  if (refs.accountUpgradePlan) {
    refs.accountUpgradePlan.innerHTML = upgradePlans.length
      ? upgradePlans
          .map(
            plan =>
              `<option value="${plan.id}">${plan.name} - ${t('plan_option_suffix', {
                limit: plan.monthlyGenerationLimit,
              })} - ${t('plan_price_month', { price: `${plan.priceCzk} Kc` })}</option>`,
          )
          .join('')
      : `<option value="">${t('no_paid_plans_available')}</option>`;
    if (upgradePlans.length && !upgradePlans.some(plan => plan.id === refs.accountUpgradePlan.value)) {
      refs.accountUpgradePlan.value = upgradePlans[0].id;
    }
  }
  if (refs.requestUpgradeBtn) {
    refs.requestUpgradeBtn.disabled = !upgradePlans.length;
  }
  if (refs.accountUpgradeHint) {
    refs.accountUpgradeHint.textContent = hasPendingUpgrade
      ? t('upgrade_pending_hint')
      : t('upgrade_request_note');
  }
  if (refs.accountUpgradeWhatsapp) {
    refs.accountUpgradeWhatsapp.classList.toggle('is-hidden', !WHATSAPP_URL);
    if (WHATSAPP_URL) refs.accountUpgradeWhatsapp.href = WHATSAPP_URL;
  }
  if (refs.accountUpgradeTelegram) {
    refs.accountUpgradeTelegram.classList.toggle('is-hidden', !TELEGRAM_URL);
    if (TELEGRAM_URL) refs.accountUpgradeTelegram.href = TELEGRAM_URL;
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
  renderOrderList(refs.statsHistoryList, refs.statsHistoryEmpty, state.orders, {
    emptyText: t('orders_empty_home'),
  });
  if (refs.statsHistorySummary) {
    refs.statsHistorySummary.textContent = t('orders_count', { count: state.orders.length });
  }
  renderOrderDetail();
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
    renderOrderList(refs.statsHistoryList, refs.statsHistoryEmpty, [], {
      emptyText: t('orders_empty_home'),
      ignoreDateFilter: true,
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
