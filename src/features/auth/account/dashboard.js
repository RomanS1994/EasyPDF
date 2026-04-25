import { activateTab } from '../shell/routes.js';
import { refs as accountRefs } from './refs.js';
import { refs as ordersRefs } from '../orders/refs.js';
import { refs as historyRefs } from '../history/refs.js';
import { refs as statsRefs } from '../stats/refs.js';
import { isAdminShell, setGuestVisible } from '../shell/shell.js';
import { state as accountState } from './state.js';
import { state as guestState } from '../guest/state.js';
import { state as ordersState } from '../orders/state.js';
import { state as historyState } from '../history/state.js';
import { state as shellState } from '../shell/state.js';
import { state as managerState, clearManagerState } from '../../manager/state.js';
import {
  formatCycleLabel,
  formatDateLabel,
  localizeRole,
  localizeSubscriptionStatus,
} from '../../../shared/lib/formatters.js';
import { renderOrderList } from '../orders/orders.js';
import { renderOrderDetail } from '../orders/order-detail.js';
import { getMetrics, renderStatsCharts } from '../stats/stats.js';
import {
  renderManagerAccessState,
  renderManagerAudit,
  renderManagerOrders,
  renderManagerPlans,
  renderManagerSelectedUser,
  renderManagerUsers,
} from '../../manager/manager-render.js';
import { getPlanVisual } from '../guest/guest.js';
import { t } from '../../../shared/i18n/app.js';

const SUPPORT_WHATSAPP_NUMBER = '+420773633433';
const DEFAULT_WHATSAPP_URL = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER.replace(/\D/g, '')}`;
const WHATSAPP_URL = import.meta.env.VITE_SUPPORT_WHATSAPP_URL || DEFAULT_WHATSAPP_URL;
const TELEGRAM_URL = import.meta.env.VITE_SUPPORT_TELEGRAM_URL || '';
const WORKSPACE_PLAN_THEMES = {
  free: {
    border: 'rgba(79, 111, 255, 0.24)',
    soft: '#edf2ff',
    glow: 'rgba(95, 126, 255, 0.36)',
  },
  bronze: {
    border: 'rgba(168, 102, 53, 0.22)',
    soft: '#fff0e1',
    glow: 'rgba(196, 126, 73, 0.34)',
  },
  silver: {
    border: 'rgba(91, 109, 132, 0.22)',
    soft: '#eef3f8',
    glow: 'rgba(125, 144, 168, 0.34)',
  },
  gold: {
    border: 'rgba(194, 142, 31, 0.24)',
    soft: '#fff4d2',
    glow: 'rgba(255, 209, 97, 0.4)',
  },
};

function getInitials(name = '') {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'D';

  return parts
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

function resolvePlanName(planId) {
  if (!planId) return '-';
  return guestState.plans.find(plan => plan.id === planId)?.name || planId;
}

function applyWorkspacePlanTheme(plan) {
  const top = accountRefs.workspaceTop;
  if (!top) return;

  const tone = !plan || isAdminShell() ? null : getPlanVisual(plan).tone;
  const theme = tone ? WORKSPACE_PLAN_THEMES[tone] || WORKSPACE_PLAN_THEMES.free : null;

  if (!theme) {
    top.removeAttribute('data-plan-tone');
    top.style.removeProperty('--plan-border');
    top.style.removeProperty('--plan-soft');
    top.style.removeProperty('--plan-glow');
    return;
  }

  top.dataset.planTone = tone;
  top.style.setProperty('--plan-border', theme.border);
  top.style.setProperty('--plan-soft', theme.soft);
  top.style.setProperty('--plan-glow', theme.glow);
}

function syncAvatarPreview({
  avatarUrl = '',
  name = accountState.user?.name || '',
  imageElement = null,
  fallbackElement = null,
  removeButton = null,
  actionsElement = null,
  altLabel = t('account'),
} = {}) {
  const hasAvatar = Boolean(avatarUrl);
  const initials = getInitials(name || accountState.user?.email || '');

  if (imageElement) {
    if (hasAvatar) {
      imageElement.src = avatarUrl;
    } else {
      imageElement.removeAttribute('src');
    }
    imageElement.alt = name || accountState.user?.email || altLabel;
    imageElement.hidden = !hasAvatar;
    imageElement.classList.toggle('is-hidden', !hasAvatar);
    imageElement.onerror = () => {
      imageElement.hidden = true;
      imageElement.classList.add('is-hidden');
      if (fallbackElement) {
        fallbackElement.hidden = false;
        fallbackElement.classList.remove('is-hidden');
      }
    };
  }

  if (fallbackElement) {
    fallbackElement.textContent = initials;
    fallbackElement.hidden = hasAvatar;
    fallbackElement.classList.toggle('is-hidden', hasAvatar);
  }

  if (removeButton) {
    removeButton.hidden = !hasAvatar;
    removeButton.classList.toggle('is-hidden', !hasAvatar);
  }

  if (actionsElement) {
    actionsElement.hidden = !hasAvatar;
    actionsElement.classList.toggle('is-hidden', !hasAvatar);
  }
}

export function syncAccountAvatarPreview({ avatarUrl = '', name = accountState.user?.name || '' } = {}) {
  syncAvatarPreview({
    avatarUrl,
    name,
    imageElement: accountRefs.accountAvatarImage,
    fallbackElement: accountRefs.accountAvatarFallback,
    removeButton: accountRefs.accountAvatarRemoveBtn,
    actionsElement: accountRefs.accountAvatarActions,
  });
}

export function syncAccountSummaryPreview({ avatarUrl = '', name = accountState.user?.name || '' } = {}) {
  syncAvatarPreview({
    avatarUrl,
    name,
    imageElement: accountRefs.accountSummaryAvatarImage,
    fallbackElement: accountRefs.accountSummaryAvatarFallback,
  });
}

export function renderDashboard() {
  if (!accountState.user) return;

  applyWorkspacePlanTheme(accountState.user.plan || null);

  const metrics = getMetrics();
  const usageText = `${metrics.usage.used} / ${metrics.usage.limit}`;
  const usagePercentText = `${metrics.usagePercent}%`;
  const contextUser =
    managerState.managerSelectedUser ||
    managerState.managerUsers.find(user => user.id === managerState.managerSelectedUserId) ||
    null;
  const orderSummaryText = metrics.totalOrders > 0 ? String(metrics.totalOrders) : '0';
  const accountSummaryText = accountState.user.name || accountState.user.email || t('no_account');

  if (accountRefs.workspaceGreeting) {
    accountRefs.workspaceGreeting.textContent = t('hello', {
      name: accountState.user.name || t('driver_fallback'),
    });
  }
  if (accountRefs.workspacePlan) {
    accountRefs.workspacePlan.textContent = isAdminShell()
      ? localizeRole(accountState.user.role || 'user')
      : accountState.user.plan?.name || '-';
  }
  if (accountRefs.workspaceCycleHome) {
    accountRefs.workspaceCycleHome.textContent = formatCycleLabel(accountState.user.usage);
  }
  if (accountRefs.workspaceUsage) {
    accountRefs.workspaceUsage.textContent = isAdminShell()
      ? contextUser?.email || t('no_account')
      : usageText;
  }
  if (accountRefs.workspaceUsageHome) {
    accountRefs.workspaceUsageHome.textContent = `${usagePercentText} · ${usageText}`;
  }
  if (accountRefs.workspaceOrdersHome) {
    accountRefs.workspaceOrdersHome.textContent = orderSummaryText;
  }
  if (accountRefs.workspaceAccountHome) {
    accountRefs.workspaceAccountHome.textContent = accountSummaryText;
  }
  if (accountRefs.workspaceAccountHomeNote) {
    accountRefs.workspaceAccountHomeNote.textContent = accountState.user.email || t('no_account');
  }
  if (ordersRefs.ordersDateFilter && ordersState.ordersDateFilter) {
    ordersRefs.ordersDateFilter.value = ordersState.ordersDateFilter;
  }
  if (historyRefs.statsHistoryDateFilter) {
    historyRefs.statsHistoryDateFilter.value = historyState.ordersHistoryDateFilter;
  }

  if (accountRefs.accountName) accountRefs.accountName.textContent = accountState.user.name || '-';
  if (accountRefs.accountEmail) accountRefs.accountEmail.textContent = accountState.user.email || '-';
  if (accountRefs.accountSummaryName) accountRefs.accountSummaryName.textContent = accountState.user.name || accountState.user.email || '-';
  if (accountRefs.accountSummaryEmail) accountRefs.accountSummaryEmail.textContent = accountState.user.email || '-';
  if (accountRefs.accountDisplayName && document.activeElement !== accountRefs.accountDisplayName) {
    accountRefs.accountDisplayName.value = accountState.user.name || '';
  }
  if (accountRefs.accountPlan) accountRefs.accountPlan.textContent = accountState.user.plan?.name || '-';
  if (accountRefs.accountUsage) accountRefs.accountUsage.textContent = usageText;
  if (accountRefs.accountRole) accountRefs.accountRole.textContent = localizeRole(accountState.user.role || 'user');
  if (accountRefs.accountSubscriptionStatus) {
    accountRefs.accountSubscriptionStatus.textContent = localizeSubscriptionStatus(
      accountState.user.subscription?.status || '-',
    );
  }
  if (accountRefs.accountSubscriptionCycle) {
    accountRefs.accountSubscriptionCycle.textContent = formatCycleLabel(accountState.user.usage);
  }
  syncAccountAvatarPreview({
    avatarUrl: accountState.user.profile?.avatarUrl || '',
    name: accountState.user.name || accountState.user.email || '',
  });
  syncAccountSummaryPreview({
    avatarUrl: accountState.user.profile?.avatarUrl || '',
    name: accountState.user.name || accountState.user.email || '',
  });
  const pendingPlanId = accountState.user.subscription?.pendingPlanId || '';
  const hasPendingUpgrade = Boolean(pendingPlanId);
  const pendingPlan = guestState.plans.find(plan => plan.id === pendingPlanId) || null;
  const activePaidPlanId = Number(accountState.user.plan?.priceCzk) > 0 ? accountState.user.plan?.id : '';
  const upgradePlans = guestState.plans.filter(
    plan => Number(plan.priceCzk) > 0 && plan.id !== activePaidPlanId,
  );
  if (accountRefs.accountPendingUpgradeSection) {
    accountRefs.accountPendingUpgradeSection.classList.toggle('is-hidden', !hasPendingUpgrade);
  }
  if (accountRefs.accountPendingUpgradePlan) {
    accountRefs.accountPendingUpgradePlan.textContent = resolvePlanName(pendingPlanId);
  }
  if (accountRefs.accountPendingUpgradeRequestedAt) {
    accountRefs.accountPendingUpgradeRequestedAt.textContent = accountState.user.subscription?.pendingRequestedAt
      ? formatDateLabel(accountState.user.subscription.pendingRequestedAt)
      : '-';
  }
  if (accountRefs.accountPendingUpgradeAmount) {
    accountRefs.accountPendingUpgradeAmount.textContent =
      pendingPlan && Number(pendingPlan.priceCzk) > 0
        ? t('plan_price_month', { price: `${pendingPlan.priceCzk} Kc` })
        : '-';
  }
  if (accountRefs.accountUpgradeSection) {
    accountRefs.accountUpgradeSection.classList.toggle('is-hidden', !upgradePlans.length);
  }
  if (accountRefs.accountUpgradePlan) {
    accountRefs.accountUpgradePlan.innerHTML = upgradePlans.length
      ? upgradePlans
          .map(
            plan =>
              `<option value="${plan.id}">${plan.name} - ${t('plan_option_suffix', {
                limit: plan.monthlyGenerationLimit,
              })} - ${t('plan_price_month', { price: `${plan.priceCzk} Kc` })}</option>`,
          )
          .join('')
      : `<option value="">${t('no_paid_plans_available')}</option>`;
    if (upgradePlans.length && !upgradePlans.some(plan => plan.id === accountRefs.accountUpgradePlan.value)) {
      accountRefs.accountUpgradePlan.value = upgradePlans[0].id;
    }
  }
  if (accountRefs.requestUpgradeBtn) {
    accountRefs.requestUpgradeBtn.disabled = !upgradePlans.length;
  }
  if (accountRefs.accountUpgradeHint) {
    accountRefs.accountUpgradeHint.textContent = hasPendingUpgrade
      ? t('upgrade_pending_hint')
      : t('upgrade_request_note');
  }
  if (accountRefs.accountUpgradeWhatsappNumber) {
    accountRefs.accountUpgradeWhatsappNumber.classList.toggle('is-hidden', !WHATSAPP_URL);
    accountRefs.accountUpgradeWhatsappNumber.textContent = SUPPORT_WHATSAPP_NUMBER;
    if (WHATSAPP_URL) accountRefs.accountUpgradeWhatsappNumber.href = WHATSAPP_URL;
  }
  if (accountRefs.accountUpgradeTelegram) {
    accountRefs.accountUpgradeTelegram.classList.toggle('is-hidden', !TELEGRAM_URL);
    if (TELEGRAM_URL) accountRefs.accountUpgradeTelegram.href = TELEGRAM_URL;
  }

  const profile = accountState.user.profile || {};
  const driver = profile.driver || {};
  const provider = profile.provider || {};

  if (accountRefs.accountDriverName) accountRefs.accountDriverName.value = driver.name || '';
  if (accountRefs.accountDriverAddress) accountRefs.accountDriverAddress.value = driver.address || '';
  if (accountRefs.accountDriverSpz) accountRefs.accountDriverSpz.value = driver.spz || '';
  if (accountRefs.accountDriverIco) accountRefs.accountDriverIco.value = driver.ico || '';
  if (accountRefs.accountProviderName) accountRefs.accountProviderName.value = provider.name || '';
  if (accountRefs.accountProviderAddress) accountRefs.accountProviderAddress.value = provider.address || '';
  if (accountRefs.accountProviderIco) accountRefs.accountProviderIco.value = provider.ico || '';

  if (statsRefs.statsMonth) statsRefs.statsMonth.textContent = formatCycleLabel(metrics.usage);
  if (statsRefs.statsPlanValue) statsRefs.statsPlanValue.textContent = accountState.user.plan?.name || '-';
  if (statsRefs.statsUsageValue) statsRefs.statsUsageValue.textContent = usageText;
  if (statsRefs.statsRemainingValue) statsRefs.statsRemainingValue.textContent = String(metrics.usage.remaining || 0);
  if (statsRefs.statsOrdersValue) statsRefs.statsOrdersValue.textContent = String(metrics.totalOrders);
  if (statsRefs.statsGeneratedValue) statsRefs.statsGeneratedValue.textContent = String(metrics.generatedOrders);
  if (statsRefs.statsUsageBar) statsRefs.statsUsageBar.style.width = `${metrics.usagePercent}%`;
  if (statsRefs.statsUsagePercent) {
    statsRefs.statsUsagePercent.textContent = t('usage_percent_used', { percent: metrics.usagePercent });
  }

  renderStatsCharts(metrics);
  renderOrderList(ordersRefs.ordersList, ordersRefs.ordersEmpty, accountState.orders, {
    emptyText: t('orders_empty_home'),
  });
  renderOrderList(historyRefs.statsHistoryList, historyRefs.statsHistoryEmpty, accountState.orders, {
    emptyText: t('orders_empty_history'),
    historyMode: true,
    dateFilter: historyState.ordersHistoryDateFilter,
  });
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
        isAuthenticated: Boolean(accountState.user),
        user: accountState.user,
      },
    }),
  );
}

export function renderAuthenticatedState({ resetTab = false } = {}) {
  if (!accountState.user) {
    applyWorkspacePlanTheme(null);

    setGuestVisible(true);
    clearManagerState();
    renderOrderList(ordersRefs.ordersList, ordersRefs.ordersEmpty, [], {
      emptyText: t('orders_empty_home'),
    });
    renderOrderList(historyRefs.statsHistoryList, historyRefs.statsHistoryEmpty, [], {
      emptyText: t('orders_empty_history'),
      historyMode: true,
      dateFilter: historyState.ordersHistoryDateFilter,
    });
    renderManagerUsers();
    renderManagerSelectedUser();
    renderManagerPlans();
    renderManagerAudit();
    renderManagerOrders();

    if (resetTab) {
      activateTab(shellState.activeTab);
    }

    broadcastAuthState();
    return;
  }

  setGuestVisible(false);
  renderDashboard();

  if (resetTab) {
    activateTab(shellState.activeTab);
  }

  broadcastAuthState();
}
