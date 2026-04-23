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
import { getPlanVisual } from './guest.js';
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
  return state.plans.find(plan => plan.id === planId)?.name || planId;
}

function applyWorkspacePlanTheme(plan) {
  const top = refs.workspaceTop;
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
  name = state.user?.name || '',
  imageElement = null,
  fallbackElement = null,
  removeButton = null,
  actionsElement = null,
  altLabel = t('account'),
} = {}) {
  const hasAvatar = Boolean(avatarUrl);
  const initials = getInitials(name || state.user?.email || '');

  if (imageElement) {
    if (hasAvatar) {
      imageElement.src = avatarUrl;
    } else {
      imageElement.removeAttribute('src');
    }
    imageElement.alt = name || state.user?.email || altLabel;
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

export function syncAccountAvatarPreview({ avatarUrl = '', name = state.user?.name || '' } = {}) {
  syncAvatarPreview({
    avatarUrl,
    name,
    imageElement: refs.accountAvatarImage,
    fallbackElement: refs.accountAvatarFallback,
    removeButton: refs.accountAvatarRemoveBtn,
    actionsElement: refs.accountAvatarActions,
  });
}

export function syncAccountSummaryPreview({ avatarUrl = '', name = state.user?.name || '' } = {}) {
  syncAvatarPreview({
    avatarUrl,
    name,
    imageElement: refs.accountSummaryAvatarImage,
    fallbackElement: refs.accountSummaryAvatarFallback,
  });
}

export function renderDashboard() {
  if (!state.user) return;

  applyWorkspacePlanTheme(state.user.plan || null);

  const metrics = getMetrics();
  const usageText = `${metrics.usage.used} / ${metrics.usage.limit}`;
  const usagePercentText = `${metrics.usagePercent}%`;
  const contextUser =
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null;
  const orderSummaryText = metrics.totalOrders > 0 ? String(metrics.totalOrders) : '0';
  const accountSummaryText = state.user.name || state.user.email || t('no_account');

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
    refs.statsHistoryDateFilter.value = state.ordersHistoryDateFilter;
  }

  if (refs.accountName) refs.accountName.textContent = state.user.name || '-';
  if (refs.accountEmail) refs.accountEmail.textContent = state.user.email || '-';
  if (refs.accountSummaryName) refs.accountSummaryName.textContent = state.user.name || state.user.email || '-';
  if (refs.accountSummaryEmail) refs.accountSummaryEmail.textContent = state.user.email || '-';
  if (refs.accountDisplayName && document.activeElement !== refs.accountDisplayName) {
    refs.accountDisplayName.value = state.user.name || '';
  }
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
  syncAccountAvatarPreview({
    avatarUrl: state.user.profile?.avatarUrl || '',
    name: state.user.name || state.user.email || '',
  });
  syncAccountSummaryPreview({
    avatarUrl: state.user.profile?.avatarUrl || '',
    name: state.user.name || state.user.email || '',
  });
  const pendingPlanId = state.user.subscription?.pendingPlanId || '';
  const hasPendingUpgrade = Boolean(pendingPlanId);
  const pendingPlan = state.plans.find(plan => plan.id === pendingPlanId) || null;
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
  if (refs.accountPendingUpgradeAmount) {
    refs.accountPendingUpgradeAmount.textContent =
      pendingPlan && Number(pendingPlan.priceCzk) > 0
        ? t('plan_price_month', { price: `${pendingPlan.priceCzk} Kc` })
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
  if (refs.accountUpgradeWhatsappNumber) {
    refs.accountUpgradeWhatsappNumber.classList.toggle('is-hidden', !WHATSAPP_URL);
    refs.accountUpgradeWhatsappNumber.textContent = SUPPORT_WHATSAPP_NUMBER;
    if (WHATSAPP_URL) refs.accountUpgradeWhatsappNumber.href = WHATSAPP_URL;
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
  const historyRender = renderOrderList(refs.statsHistoryList, refs.statsHistoryEmpty, state.orders, {
    emptyText: t('orders_empty_history'),
    historyMode: true,
    dateFilter: state.ordersHistoryDateFilter,
  });
  if (refs.statsHistorySummary) {
    refs.statsHistorySummary.textContent = t('orders_count', { count: historyRender.visibleCount });
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
    applyWorkspacePlanTheme(null);

    if (state.activeTab !== 'home') {
      state.authMode = 'login';
    }

    setGuestVisible(true);
    clearManagerState();
    renderOrderList(refs.ordersList, refs.ordersEmpty, [], {
      emptyText: t('orders_empty_home'),
    });
    renderOrderList(refs.statsHistoryList, refs.statsHistoryEmpty, [], {
      emptyText: t('orders_empty_history'),
      historyMode: true,
      dateFilter: state.ordersHistoryDateFilter,
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
