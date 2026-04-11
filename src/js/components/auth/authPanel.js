import {
  API_deleteMe,
  API_getMe,
  API_login,
  API_logout,
  API_refreshSession,
  API_register,
  API_updateMyProfile,
} from '../../../api/auth/API_auth.js';
import {
  API_cancelManagerUserSubscription,
  API_createManagerPlan,
  API_extendManagerUserSubscription,
  API_getManagerAudit,
  API_getManagerOrders,
  API_getManagerPlans,
  API_getManagerUser,
  API_getManagerUsers,
  API_updateManagerPlan,
  API_updateManagerUserRole,
  API_updateManagerUserSubscription,
} from '../../../api/manager/API_manager.js';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '../../../api/auth/session.js';
import {
  API_getOrder,
  API_getOrders,
  API_updateOrder,
} from '../../../api/orders/API_orders.js';
import { API_getPlans } from '../../../api/plans/API_getPlans.js';
import {
  applyLanguage,
  getCurrentLanguage,
  getCurrentLocale,
  initLanguage,
  syncPageMeta,
  t,
} from '../../i18n/app.js';
import { initAppLoader, setBootLoaderActive } from '../../loaderOverlay.js';
import { notifyText } from '../../toastify.js';

const refs = {
  hub: document.getElementById('accountHub'),
  guestPanel: document.getElementById('guestPanel'),
  guestRouteBadge: document.getElementById('guestRouteBadge'),
  accountPanel: document.getElementById('accountPanel'),
  registerForm: document.getElementById('registerForm'),
  loginForm: document.getElementById('loginForm'),
  guestAuthNote: document.getElementById('guestAuthNote'),
  guestLanguageButtons: document.querySelectorAll('[data-language-option]'),
  authModeButtons: document.querySelectorAll('[data-auth-mode]'),
  authModePanels: document.querySelectorAll('[data-auth-mode-panel]'),
  logoutBtn: document.getElementById('logoutBtn'),
  deleteAccountBtn: document.getElementById('deleteAccountBtn'),
  authHeadline: document.getElementById('authHeadline'),
  authSubline: document.getElementById('authSubline'),
  planSelect: document.getElementById('registerPlan'),
  planCards: document.getElementById('planCards'),
  tabButtons: document.querySelectorAll('[data-tab-target]'),
  tabScreens: document.querySelectorAll('[data-tab-screen]'),
  statsTabButtons: document.querySelectorAll('[data-stats-tab-target]'),
  statsTabScreens: document.querySelectorAll('[data-stats-tab-screen]'),
  accountName: document.getElementById('accountName'),
  accountEmail: document.getElementById('accountEmail'),
  accountPlan: document.getElementById('accountPlan'),
  accountUsage: document.getElementById('accountUsage'),
  accountRole: document.getElementById('accountRole'),
  accountSubscriptionStatus: document.getElementById('accountSubscriptionStatus'),
  accountSubscriptionCycle: document.getElementById('accountSubscriptionCycle'),
  accountDriverName: document.getElementById('accountDriverName'),
  accountDriverAddress: document.getElementById('accountDriverAddress'),
  accountDriverSpz: document.getElementById('accountDriverSpz'),
  accountDriverIco: document.getElementById('accountDriverIco'),
  accountProviderName: document.getElementById('accountProviderName'),
  accountProviderAddress: document.getElementById('accountProviderAddress'),
  accountProviderIco: document.getElementById('accountProviderIco'),
  accountLanguageSelect: document.getElementById('accountLanguageSelect'),
  updateProfileBtn: document.getElementById('updateProfileBtn'),
  managerEntrySection: document.getElementById('managerEntrySection'),
  workspaceGreeting: document.getElementById('workspaceGreeting'),
  workspacePlan: document.getElementById('workspacePlan'),
  workspaceUsage: document.getElementById('workspaceUsage'),
  ordersList: document.getElementById('ordersList'),
  ordersEmpty: document.getElementById('ordersEmpty'),
  statsMonth: document.getElementById('statsMonth'),
  statsPlanValue: document.getElementById('statsPlanValue'),
  statsUsageValue: document.getElementById('statsUsageValue'),
  statsRemainingValue: document.getElementById('statsRemainingValue'),
  statsOrdersValue: document.getElementById('statsOrdersValue'),
  statsGeneratedValue: document.getElementById('statsGeneratedValue'),
  statsUsageBar: document.getElementById('statsUsageBar'),
  statsUsagePercent: document.getElementById('statsUsagePercent'),
  statsRing: document.getElementById('statsRing'),
  statsRingValue: document.getElementById('statsRingValue'),
  statsQuotaLabel: document.getElementById('statsQuotaLabel'),
  statsActivitySummary: document.getElementById('statsActivitySummary'),
  statsActivityBars: document.getElementById('statsActivityBars'),
  statsStatusSummary: document.getElementById('statsStatusSummary'),
  statsStatusStack: document.getElementById('statsStatusStack'),
  statsStatusLegend: document.getElementById('statsStatusLegend'),
  statsPlanLimit: document.getElementById('statsPlanLimit'),
  statsPlanBar: document.getElementById('statsPlanBar'),
  statsForecastVolume: document.getElementById('statsForecastVolume'),
  statsForecastDate: document.getElementById('statsForecastDate'),
  managerGate: document.getElementById('managerGate'),
  managerWorkspace: document.getElementById('managerWorkspace'),
  managerUsersCount: document.getElementById('managerUsersCount'),
  managerActiveCount: document.getElementById('managerActiveCount'),
  managerInactiveCount: document.getElementById('managerInactiveCount'),
  managerStaffCount: document.getElementById('managerStaffCount'),
  managerSearchInput: document.getElementById('managerSearchInput'),
  managerStatusFilter: document.getElementById('managerStatusFilter'),
  managerRoleFilter: document.getElementById('managerRoleFilter'),
  managerPlanFilter: document.getElementById('managerPlanFilter'),
  managerRefreshBtn: document.getElementById('managerRefreshBtn'),
  managerUsersList: document.getElementById('managerUsersList'),
  managerUsersEmpty: document.getElementById('managerUsersEmpty'),
  managerSelectedEmpty: document.getElementById('managerSelectedEmpty'),
  managerSelectedCard: document.getElementById('managerSelectedCard'),
  managerSelectedName: document.getElementById('managerSelectedName'),
  managerSelectedEmail: document.getElementById('managerSelectedEmail'),
  managerSelectedRole: document.getElementById('managerSelectedRole'),
  managerSelectedPlan: document.getElementById('managerSelectedPlan'),
  managerSelectedStatus: document.getElementById('managerSelectedStatus'),
  managerSelectedCycle: document.getElementById('managerSelectedCycle'),
  managerSelectedUsage: document.getElementById('managerSelectedUsage'),
  managerSelectedOrdersCount: document.getElementById('managerSelectedOrdersCount'),
  managerSubscriptionPlan: document.getElementById('managerSubscriptionPlan'),
  managerSubscriptionStatus: document.getElementById('managerSubscriptionStatus'),
  managerSubscriptionStart: document.getElementById('managerSubscriptionStart'),
  managerSubscriptionEnd: document.getElementById('managerSubscriptionEnd'),
  managerSubscriptionQuota: document.getElementById('managerSubscriptionQuota'),
  managerSubscriptionNotes: document.getElementById('managerSubscriptionNotes'),
  managerSubscriptionSaveBtn: document.getElementById('managerSubscriptionSaveBtn'),
  managerSubscriptionExtendBtn: document.getElementById('managerSubscriptionExtendBtn'),
  managerSubscriptionCancelBtn: document.getElementById('managerSubscriptionCancelBtn'),
  managerRoleSection: document.getElementById('managerRoleSection'),
  managerRoleSelect: document.getElementById('managerRoleSelect'),
  managerRoleSaveBtn: document.getElementById('managerRoleSaveBtn'),
  managerRecentOrdersLabel: document.getElementById('managerRecentOrdersLabel'),
  managerSelectedOrdersList: document.getElementById('managerSelectedOrdersList'),
  managerSelectedOrdersEmpty: document.getElementById('managerSelectedOrdersEmpty'),
  managerPlansList: document.getElementById('managerPlansList'),
  managerPlansEmpty: document.getElementById('managerPlansEmpty'),
  managerPlanForm: document.getElementById('managerPlanForm'),
  managerPlanId: document.getElementById('managerPlanId'),
  managerPlanName: document.getElementById('managerPlanName'),
  managerPlanLimit: document.getElementById('managerPlanLimit'),
  managerPlanDescription: document.getElementById('managerPlanDescription'),
  managerPlanActive: document.getElementById('managerPlanActive'),
  managerPlanSubmitBtn: document.getElementById('managerPlanSubmitBtn'),
  managerPlanResetBtn: document.getElementById('managerPlanResetBtn'),
  adminLanguageSelect: document.getElementById('adminLanguageSelect'),
  managerAuditList: document.getElementById('managerAuditList'),
  managerAuditEmpty: document.getElementById('managerAuditEmpty'),
  managerSubscriptionEmpty: document.getElementById('managerSubscriptionEmpty'),
  managerSubscriptionCard: document.getElementById('managerSubscriptionCard'),
  managerSubscriptionName: document.getElementById('managerSubscriptionName'),
  managerSubscriptionEmail: document.getElementById('managerSubscriptionEmail'),
  managerSubscriptionStatusLabel: document.getElementById(
    'managerSubscriptionStatusLabel'
  ),
  managerSubscriptionUsageLabel: document.getElementById('managerSubscriptionUsageLabel'),
  managerOrdersSearchInput: document.getElementById('managerOrdersSearchInput'),
  managerOrdersStatusFilter: document.getElementById('managerOrdersStatusFilter'),
  managerOrdersSelectedUserBtn: document.getElementById('managerOrdersSelectedUserBtn'),
  managerOrdersRefreshBtn: document.getElementById('managerOrdersRefreshBtn'),
  managerOrdersList: document.getElementById('managerOrdersList'),
  managerOrdersEmpty: document.getElementById('managerOrdersEmpty'),
  managerOrdersContextNote: document.getElementById('managerOrdersContextNote'),
  managerOrdersAllCount: document.getElementById('managerOrdersAllCount'),
  managerOrdersPendingCount: document.getElementById('managerOrdersPendingCount'),
  managerOrdersFailedCount: document.getElementById('managerOrdersFailedCount'),
  managerOrdersGeneratedCount: document.getElementById('managerOrdersGeneratedCount'),
  managerOrdersStatusButtons: document.querySelectorAll('[data-manager-orders-status]'),
  managerOrderDetailEmpty: document.getElementById('managerOrderDetailEmpty'),
  managerOrderDetailCard: document.getElementById('managerOrderDetailCard'),
  managerOrderDetailNumber: document.getElementById('managerOrderDetailNumber'),
  managerOrderDetailStatus: document.getElementById('managerOrderDetailStatus'),
  managerOrderDetailAccount: document.getElementById('managerOrderDetailAccount'),
  managerOrderDetailCustomer: document.getElementById('managerOrderDetailCustomer'),
  managerOrderDetailTime: document.getElementById('managerOrderDetailTime'),
  managerOrderDetailTotal: document.getElementById('managerOrderDetailTotal'),
  managerOrderDetailCreated: document.getElementById('managerOrderDetailCreated'),
  managerOrderDetailUpdated: document.getElementById('managerOrderDetailUpdated'),
  managerOrderDetailRoute: document.getElementById('managerOrderDetailRoute'),
  managerOrderDetailPdf: document.getElementById('managerOrderDetailPdf'),
  managerOrderDetailHint: document.getElementById('managerOrderDetailHint'),
  managerOrderMarkPendingBtn: document.getElementById('managerOrderMarkPendingBtn'),
  managerOrderMarkGeneratedBtn: document.getElementById('managerOrderMarkGeneratedBtn'),
  managerOrderMarkFailedBtn: document.getElementById('managerOrderMarkFailedBtn'),
};

const TAB_NAMES = [
  'home',
  'stats',
  'orders',
  'account',
  'accounts',
  'subscriptions',
  'settings',
];
const STATS_TAB_NAMES = ['usage', 'activity', 'plan'];
const AUTH_MODES = ['register', 'login'];
const CONTRACT_STORAGE_KEY = 'contract-data';
const MANAGER_SELECTED_USER_KEY = 'pdf-app-admin-selected-user';
const MANAGER_SELECTED_ORDER_KEY = 'pdf-app-admin-selected-order';
const MANAGER_ORDERS_SELECTED_ONLY_KEY = 'pdf-app-admin-orders-selected-only';

const state = {
  plans: [],
  user: null,
  orders: [],
  activeTab: getRouteTab(),
  activeStatsTab: 'usage',
  selectedPlanId: '',
  authMode: getDefaultAuthMode(),
  managerUsers: [],
  managerPlans: [],
  managerAudit: [],
  managerOrders: [],
  managerOrdersSummary: {
    all: 0,
    pending: 0,
    failed: 0,
    generated: 0,
  },
  managerSelectedUserId: getStoredManagerSelectedUserId(),
  managerSelectedUser: null,
  managerSelectedOrders: [],
  managerSelectedOrderId: getStoredManagerSelectedOrderId(),
  managerSelectedOrder: null,
  managerOrdersSelectedOnly: getStoredManagerOrdersSelectedOnly(),
};

let managerSearchTimer = 0;
let managerOrdersSearchTimer = 0;

function getDefaultAuthMode() {
  return getRouteTab() === 'home' ? 'register' : 'login';
}

function setFormDisabled(form, disabled) {
  if (!form) return;

  Array.from(form.elements).forEach(element => {
    element.disabled = disabled;
  });
}

function clearAppStorage() {
  localStorage.removeItem(CONTRACT_STORAGE_KEY);
}

function getStoredManagerSelectedUserId() {
  return localStorage.getItem(MANAGER_SELECTED_USER_KEY) || '';
}

function setStoredManagerSelectedUserId(userId) {
  if (userId) {
    localStorage.setItem(MANAGER_SELECTED_USER_KEY, userId);
    return;
  }

  localStorage.removeItem(MANAGER_SELECTED_USER_KEY);
}

function getStoredManagerSelectedOrderId() {
  return localStorage.getItem(MANAGER_SELECTED_ORDER_KEY) || '';
}

function setStoredManagerSelectedOrderId(orderId) {
  if (orderId) {
    localStorage.setItem(MANAGER_SELECTED_ORDER_KEY, orderId);
    return;
  }

  localStorage.removeItem(MANAGER_SELECTED_ORDER_KEY);
}

function getStoredManagerOrdersSelectedOnly() {
  return localStorage.getItem(MANAGER_ORDERS_SELECTED_ONLY_KEY) === '1';
}

function setStoredManagerOrdersSelectedOnly(value) {
  if (value) {
    localStorage.setItem(MANAGER_ORDERS_SELECTED_ONLY_KEY, '1');
    return;
  }

  localStorage.removeItem(MANAGER_ORDERS_SELECTED_ONLY_KEY);
}

function isAdminShell() {
  return document.body.dataset.appShell === 'admin';
}

function getRouteTab() {
  const routeTab = document.body.dataset.appTab || 'home';
  return TAB_NAMES.includes(routeTab) ? routeTab : 'home';
}

function getShellRouteConfig() {
  const shell = document.body.dataset.appShell;

  if (shell === 'admin') {
    return {
      accounts: '/cz/pdf/admin/accounts/',
      subscriptions: '/cz/pdf/admin/subscriptions/',
      orders: '/cz/pdf/admin/orders/',
      settings: '/cz/pdf/admin/settings/',
    };
  }

  return {
    home: '/cz/pdf/',
    stats: '/cz/pdf/stats/',
    orders: '/cz/pdf/orders/',
    account: '/cz/pdf/account/',
  };
}

function getTabForPath(pathname) {
  const routes = getShellRouteConfig();
  return (
    Object.entries(routes).find(([, routePath]) => routePath === pathname)?.[0] || null
  );
}

function navigateToTab(tabName, pathname) {
  if (!TAB_NAMES.includes(tabName)) return;

  document.body.dataset.appTab = tabName;
  activateTab(tabName);
  syncPageMeta(getCurrentLanguage());

  if (window.location.pathname !== pathname) {
    window.history.pushState({ appTab: tabName }, '', pathname);
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function titleCase(value) {
  return String(value || '')
    .split(/[_\s.-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function localizeRole(value) {
  const key = `role_${value || 'user'}`;
  const translated = t(key);
  return translated !== key ? translated : titleCase(value || 'user');
}

function localizeSubscriptionStatus(value) {
  const key = `subscription_${value || 'inactive'}`;
  const translated = t(key);
  return translated !== key ? translated : titleCase(value || '-');
}

function localizeAuditAction(value) {
  const key = `audit_${String(value || 'system.event').replaceAll('.', '_')}`;
  const translated = t(key);
  return translated !== key ? translated : titleCase(value || 'system.event');
}

function formatDateLabel(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString(getCurrentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTimeLabel(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(getCurrentLocale());
}

function formatCycleLabel(usage) {
  if (usage?.cycleLabel) return usage.cycleLabel;
  if (!usage?.periodStart || !usage?.periodEnd) return '-';
  return `${formatDateLabel(usage.periodStart)} - ${formatDateLabel(usage.periodEnd)}`;
}

function isoToDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function isManagerRole(role) {
  return role === 'manager' || role === 'admin';
}

function clearManagerState() {
  state.managerUsers = [];
  state.managerPlans = [];
  state.managerAudit = [];
  state.managerOrders = [];
  state.managerOrdersSummary = {
    all: 0,
    pending: 0,
    failed: 0,
    generated: 0,
  };
  state.managerSelectedUserId = '';
  state.managerSelectedUser = null;
  state.managerSelectedOrders = [];
  state.managerSelectedOrderId = '';
  state.managerSelectedOrder = null;
  state.managerOrdersSelectedOnly = false;
  setStoredManagerSelectedUserId('');
  setStoredManagerSelectedOrderId('');
  setStoredManagerOrdersSelectedOnly(false);
}

function setGuestVisible(isVisible) {
  document.body.dataset.authState = isVisible ? 'guest' : 'session';
  refs.guestPanel?.classList.toggle('is-hidden', !isVisible);
  refs.accountPanel?.classList.toggle('is-hidden', isVisible);
}

function syncLanguageSelects() {
  const language = getCurrentLanguage();

  if (refs.accountLanguageSelect) {
    refs.accountLanguageSelect.value = language;
  }

  if (refs.adminLanguageSelect) {
    refs.adminLanguageSelect.value = language;
  }

  refs.guestLanguageButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.languageOption === language);
    button.setAttribute(
      'aria-pressed',
      button.dataset.languageOption === language ? 'true' : 'false'
    );
  });
}

function handleLanguageSelectChange(event) {
  const nextLanguage = event.target.value;
  applyLanguage(nextLanguage);
}

function handleGuestLanguageClick(event) {
  const button = event.target.closest('[data-language-option]');
  if (!button) return;

  applyLanguage(button.dataset.languageOption || 'uk');
}

function activateTab(tabName = 'home') {
  const nextTab = TAB_NAMES.includes(tabName) ? tabName : 'home';
  state.activeTab = nextTab;

  refs.tabButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.tabTarget === nextTab);
  });

  refs.tabScreens.forEach(screen => {
    screen.classList.toggle('is-active', screen.dataset.tabScreen === nextTab);
  });

  if (!state.user) {
    renderGuestContext();
  }
}

function activateStatsTab(tabName = 'usage') {
  const nextTab = STATS_TAB_NAMES.includes(tabName) ? tabName : 'usage';
  state.activeStatsTab = nextTab;

  refs.statsTabButtons.forEach(button => {
    button.classList.toggle(
      'is-active',
      button.dataset.statsTabTarget === nextTab
    );
  });

  refs.statsTabScreens.forEach(screen => {
    screen.classList.toggle(
      'is-active',
      screen.dataset.statsTabScreen === nextTab
    );
  });
}

function getGuestRouteLabel() {
  if (state.activeTab === 'home') {
    return t('guest_start_screen');
  }

  return t('guest_continue_to', { screen: t(state.activeTab) });
}

function renderGuestContext() {
  const routeLabel = getGuestRouteLabel();
  const authMode = AUTH_MODES.includes(state.authMode) ? state.authMode : getDefaultAuthMode();

  if (refs.guestRouteBadge) {
    refs.guestRouteBadge.textContent = routeLabel;
  }

  if (refs.authSubline) {
    refs.authSubline.textContent =
      state.activeTab === 'home'
        ? t('guest_subline')
        : t('guest_redirect_note', { screen: t(state.activeTab) });
  }

  if (refs.authHeadline) {
    refs.authHeadline.textContent =
      authMode === 'login' ? t('guest_login_headline') : t('guest_headline');
  }

  if (refs.guestAuthNote) {
    refs.guestAuthNote.textContent =
      authMode === 'login' ? t('guest_login_note') : t('guest_note');
  }
}

function setAuthMode(mode = getDefaultAuthMode()) {
  const nextMode = AUTH_MODES.includes(mode) ? mode : getDefaultAuthMode();
  const showPlans = nextMode === 'register';

  state.authMode = nextMode;
  refs.guestPanel?.setAttribute('data-auth-mode', nextMode);
  if (refs.planCards) {
    refs.planCards.hidden = !showPlans;
    refs.planCards.setAttribute('aria-hidden', showPlans ? 'false' : 'true');
  }

  refs.authModeButtons.forEach(button => {
    const isActive = button.dataset.authMode === nextMode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  refs.authModePanels.forEach(panel => {
    const isActive = panel.dataset.authModePanel === nextMode;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  renderGuestContext();
}

function focusAuthMode(mode) {
  const button = Array.from(refs.authModeButtons).find(item => item.dataset.authMode === mode);
  button?.focus();
}

function syncSelectedPlan(planId, { scrollToForm = false } = {}) {
  if (!planId) return;

  state.selectedPlanId = planId;

  if (refs.planSelect) {
    refs.planSelect.value = planId;
  }

  refs.planCards?.querySelectorAll('.planCard').forEach(card => {
    const isActive = card.dataset.planSelect === planId;
    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  refs.planCards?.querySelectorAll('.planCard-action').forEach(action => {
    const isActive = action.closest('.planCard')?.dataset.planSelect === planId;
    action.classList.toggle('is-active', isActive);
  });

  if (scrollToForm) {
    refs.registerForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function formatPlanPrice(priceCzk) {
  const value = Number(priceCzk);
  if (!Number.isFinite(value) || value <= 0) return '';

  return `${new Intl.NumberFormat(getCurrentLocale(), {
    maximumFractionDigits: 0,
  }).format(value)} Kč`;
}

function getPlanVisual(plan) {
  const haystack = `${plan?.id || ''} ${plan?.name || ''}`.toLowerCase();
  const limit = Number(plan?.monthlyGenerationLimit) || 0;

  if (haystack.includes('trial') || limit <= 10) {
    return {
      tone: 'trial',
      tierLabel: t('plan_tier_trial'),
      note: t('plan_note_trial'),
    };
  }

  if (haystack.includes('scale') || haystack.includes('gold') || limit >= 100) {
    return {
      tone: 'gold',
      tierLabel: t('plan_tier_gold'),
      note: t('plan_note_gold'),
    };
  }

  if (haystack.includes('growth') || haystack.includes('silver') || limit >= 50) {
    return {
      tone: 'silver',
      tierLabel: t('plan_tier_silver'),
      note: t('plan_note_silver'),
    };
  }

  return {
    tone: 'bronze',
    tierLabel: t('plan_tier_bronze'),
    note: t('plan_note_bronze'),
  };
}

function renderPlans() {
  if (!state.plans.length) return;

  if (refs.planSelect) {
    refs.planSelect.innerHTML = state.plans
      .map(plan => {
        const priceLabel = formatPlanPrice(plan.priceCzk);
        const suffix = t('plan_option_suffix', { limit: plan.monthlyGenerationLimit });
        const optionLabel = priceLabel
          ? `${plan.name} - ${suffix} - ${t('plan_price_month', { price: priceLabel })}`
          : `${plan.name} - ${suffix}`;

        return `<option value="${plan.id}">${escapeHtml(optionLabel)}</option>`;
      })
      .join('');
  }

  if (refs.planCards) {
    refs.planCards.innerHTML = state.plans
      .map(plan => {
        const visual = getPlanVisual(plan);
        const priceLabel = formatPlanPrice(plan.priceCzk);
        const quotaLabel = `${plan.monthlyGenerationLimit} ${t('plan_card_caption')}`;
        const valueLabel = priceLabel || String(plan.monthlyGenerationLimit);
        const isSelected = plan.id === state.selectedPlanId;

        return `
          <article
            class="planCard planCard--${visual.tone} ${isSelected ? 'is-active' : ''}"
            data-plan-select="${plan.id}"
            role="button"
            tabindex="0"
            aria-pressed="${isSelected ? 'true' : 'false'}"
          >
            <div class="planCard-tierRow">
              <span class="planCard-tier">${escapeHtml(visual.tierLabel)}</span>
              <span class="planCard-limit">${escapeHtml(
                t('plan_option_suffix', { limit: plan.monthlyGenerationLimit })
              )}</span>
            </div>
            <div class="planCard-head">
              <p>${escapeHtml(plan.name)}</p>
              <strong>${escapeHtml(valueLabel)}</strong>
              <span class="planCard-price">${escapeHtml(quotaLabel)}</span>
            </div>
            <p class="planCard-copy">${escapeHtml(visual.note)}</p>
            <div class="planCard-footer">
              <span class="planCard-action" aria-hidden="true">
                ${escapeHtml(t('choose_plan', { plan: plan.name }))}
              </span>
            </div>
          </article>
        `;
      })
      .join('');
  }

  if (!state.selectedPlanId) {
    syncSelectedPlan(state.plans[0]?.id || '');
  } else {
    syncSelectedPlan(state.selectedPlanId);
  }
}

function getMetrics() {
  const usage = state.user?.usage || {
    periodStart: '',
    periodEnd: '',
    cycleLabel: '-',
    used: 0,
    limit: 0,
    remaining: 0,
    status: 'inactive',
  };
  const generatedOrders = state.orders.filter(
    order => order.status === 'pdf_generated'
  ).length;

  return {
    usage,
    totalOrders: state.orders.length,
    generatedOrders,
    usagePercent: usage.limit
      ? Math.min(100, Math.round((usage.used / usage.limit) * 100))
      : 0,
  };
}

function categorizeOrderStatus(status) {
  const value = String(status || '').toLowerCase();

  if (value.includes('fail')) return 'failed';
  if (value === 'pdf_generated') return 'generated';
  return 'pending';
}

function buildOrderStatusSummary(orders = []) {
  return orders.reduce(
    (summary, order) => {
      summary.all += 1;
      summary[categorizeOrderStatus(order.status)] += 1;
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

function buildActivitySeries(usage) {
  const endDate = usage?.periodEnd ? new Date(usage.periodEnd) : new Date();
  const now = new Date();
  const rangeEnd = endDate.getTime() > now.getTime() ? now : endDate;

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(rangeEnd);
    date.setDate(rangeEnd.getDate() - (6 - index));

    const key = date.toISOString().slice(0, 10);
    const count = state.orders.filter(order => {
      return String(order.createdAt || '').slice(0, 10) === key;
    }).length;

    return {
      key,
      count,
      label: date.toLocaleDateString(getCurrentLocale(), { weekday: 'short' }).slice(0, 2),
    };
  });
}

function buildStatusBreakdown() {
  const counts = {
    generated: 0,
    pending: 0,
    failed: 0,
  };

  state.orders.forEach(order => {
    counts[categorizeOrderStatus(order.status)] += 1;
  });

  return counts;
}

function buildPlanForecast(usage) {
  const start = usage?.periodStart ? new Date(usage.periodStart) : null;
  const end = usage?.periodEnd ? new Date(usage.periodEnd) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      projectedVolume: 0,
      forecastLabel: t('no_data'),
      projectedPercent: 0,
    };
  }

  const now = new Date();
  const effectiveNow = now.getTime() > end.getTime() ? end : now;
  const elapsedDays = Math.max(
    1,
    Math.ceil((effectiveNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const perDay = usage.used / elapsedDays;
  const projectedVolume = Math.round(perDay * totalDays);
  const projectedPercent = usage.limit
    ? Math.min(100, Math.round((projectedVolume / usage.limit) * 100))
    : 0;

  let forecastLabel = t('on_track');
  if (perDay <= 0) {
    forecastLabel = t('no_activity_yet');
  } else if (projectedVolume > usage.limit && usage.limit > 0) {
    const remaining = Math.max(usage.limit - usage.used, 0);
    const daysToLimit = remaining > 0 ? Math.ceil(remaining / perDay) : 0;
    const forecastDate = new Date(effectiveNow);
    forecastDate.setDate(forecastDate.getDate() + daysToLimit);
    forecastLabel = t('limit_around', {
      date: forecastDate.toLocaleDateString(getCurrentLocale(), {
        day: 'numeric',
        month: 'short',
      }),
    });
  }

  return {
    projectedVolume,
    forecastLabel,
    projectedPercent,
  };
}

function formatOrderStatusLabel(status) {
  const value = String(status || '').trim();
  if (!value) return t('order_created');

  const translated = t(`order_${value}`);
  if (translated !== `order_${value}`) return translated;

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function renderStatsCharts(metrics) {
  if (refs.statsRing) {
    refs.statsRing.style.setProperty('--progress', `${metrics.usagePercent}%`);
  }
  if (refs.statsRingValue) {
    refs.statsRingValue.textContent = `${metrics.usagePercent}%`;
  }
  if (refs.statsQuotaLabel) {
    refs.statsQuotaLabel.textContent = t('quota_label', {
      used: metrics.usage.used,
      limit: metrics.usage.limit,
    });
  }

  const activitySeries = buildActivitySeries(metrics.usage);
  const maxActivity = Math.max(1, ...activitySeries.map(item => item.count));

  if (refs.statsActivityBars) {
    refs.statsActivityBars.innerHTML = activitySeries
      .map(item => {
        const height = Math.max(12, Math.round((item.count / maxActivity) * 100));

        return `
          <div class="activityBarItem">
            <span class="activityBarValue">${item.count}</span>
            <div class="activityBarTrack">
              <span class="activityBarFill" style="height:${height}%"></span>
            </div>
            <span class="activityBarLabel">${escapeHtml(item.label)}</span>
          </div>
        `;
      })
      .join('');
  }

  if (refs.statsActivitySummary) {
    const totalWeekOrders = activitySeries.reduce((sum, item) => sum + item.count, 0);
    refs.statsActivitySummary.textContent = t('orders_count', { count: totalWeekOrders });
  }

  const statusCounts = buildStatusBreakdown();
  const statusTotal = Math.max(
    1,
    statusCounts.generated + statusCounts.pending + statusCounts.failed
  );

  if (refs.statsStatusStack) {
    if (metrics.totalOrders === 0) {
      refs.statsStatusStack.innerHTML =
        '<div class="statusSegment" style="width:100%; background:#e5e5ea"></div>';
    } else {
      refs.statsStatusStack.innerHTML = `
        <div class="statusSegment statusSegment-generated" style="width:${(statusCounts.generated / statusTotal) * 100}%"></div>
        <div class="statusSegment statusSegment-pending" style="width:${(statusCounts.pending / statusTotal) * 100}%"></div>
        <div class="statusSegment statusSegment-failed" style="width:${(statusCounts.failed / statusTotal) * 100}%"></div>
      `;
    }
  }

  if (refs.statsStatusLegend) {
    refs.statsStatusLegend.innerHTML = `
      <div class="statusLegendItem">
        <span class="statusLegendDot statusLegendDot-generated"></span>
        <span>${escapeHtml(t('generated'))}</span>
        <strong>${statusCounts.generated}</strong>
      </div>
      <div class="statusLegendItem">
        <span class="statusLegendDot statusLegendDot-pending"></span>
        <span>${escapeHtml(t('pending'))}</span>
        <strong>${statusCounts.pending}</strong>
      </div>
      <div class="statusLegendItem">
        <span class="statusLegendDot statusLegendDot-failed"></span>
        <span>${escapeHtml(t('failed'))}</span>
        <strong>${statusCounts.failed}</strong>
      </div>
    `;
  }

  if (refs.statsStatusSummary) {
    refs.statsStatusSummary.textContent = t('total_count', { count: metrics.totalOrders });
  }

  const forecast = buildPlanForecast(metrics.usage);

  if (refs.statsPlanLimit) {
    refs.statsPlanLimit.textContent = t('docs_per_cycle', { count: metrics.usage.limit });
  }
  if (refs.statsForecastVolume) {
    refs.statsForecastVolume.textContent = t('projected_volume', {
      count: forecast.projectedVolume,
    });
  }
  if (refs.statsForecastDate) {
    refs.statsForecastDate.textContent = forecast.forecastLabel;
  }
  if (refs.statsPlanBar) {
    refs.statsPlanBar.style.width = `${forecast.projectedPercent}%`;
  }
}

function buildOrderMarkup(order, { compact = false, showOwner = false } = {}) {
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString(getCurrentLocale())
    : '-';
  const route = [order.trip?.from, order.trip?.to]
    .filter(Boolean)
    .join(' → ');
  const customerName = order.customer?.name || t('no_customer_name');
  const totalPrice = order.totalPrice || t('no_total');
  const ownerLabel = order.user
    ? `${order.user.name || t('no_name')} · ${order.user.email || '-'}`
    : t('no_account');
  const statusLabel = formatOrderStatusLabel(order.status || 'created');

  return `
    <li class="orderItem ${compact ? 'orderItem-compact' : ''} ${showOwner ? 'orderItem-admin' : ''}">
      <div class="orderItem-main">
        <strong>${escapeHtml(order.orderNumber || '-')}</strong>
        ${showOwner ? `<p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>` : ''}
        <p>${escapeHtml(customerName)}</p>
        <p>${escapeHtml(route || t('route_not_set'))}</p>
      </div>
      <div class="orderItem-meta">
        <span>${escapeHtml(totalPrice)}</span>
        <span>${escapeHtml(createdAt)}</span>
        <span class="orderStatus">${escapeHtml(statusLabel)}</span>
      </div>
    </li>
  `;
}

function renderOrderList(listElement, emptyElement, orders, options = {}) {
  if (!listElement || !emptyElement) return;

  const items = options.limit ? orders.slice(0, options.limit) : orders;

  if (!items.length) {
    listElement.innerHTML = '';
    emptyElement.hidden = false;
    if (options.emptyText) {
      emptyElement.textContent = options.emptyText;
    }
    return;
  }

  emptyElement.hidden = true;
  listElement.innerHTML = items.map(order => buildOrderMarkup(order, options)).join('');
}

function buildManagerOrderListMarkup(order) {
  const createdAt = formatDateTimeLabel(order.createdAt);
  const route =
    [order.trip?.from, order.trip?.to].filter(Boolean).join(' → ') || t('route_not_set');
  const ownerLabel = order.user
    ? `${order.user.name || t('no_name')} · ${order.user.email || '-'}`
    : t('no_account');
  const customerLabel = order.customer?.name || order.customer?.email || t('no_customer');
  const statusLabel = formatOrderStatusLabel(order.status || 'created');
  const isActive = order.id === state.managerSelectedOrderId;

  return `
    <li class="orderItem ${isActive ? 'is-active' : ''}">
      <button type="button" class="orderItemButton" data-manager-order-id="${order.id}">
        <div class="orderItem-main">
          <strong>${escapeHtml(order.orderNumber || '-')}</strong>
          <p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>
          <p>${escapeHtml(customerLabel)}</p>
          <p>${escapeHtml(route)}</p>
        </div>
        <div class="orderItem-meta">
          <span>${escapeHtml(order.totalPrice || t('no_total'))}</span>
          <span>${escapeHtml(createdAt)}</span>
          <span class="orderStatus">${escapeHtml(statusLabel)}</span>
        </div>
      </button>
    </li>
  `;
}

function renderManagerOrderDetail() {
  const order = state.managerSelectedOrder;
  const contextUser =
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null;
  const isVisibleInCurrentResults = Boolean(
    order && state.managerOrders.some(item => item.id === order.id)
  );

  refs.managerOrderDetailEmpty?.classList.toggle('is-hidden', Boolean(order));
  refs.managerOrderDetailCard?.classList.toggle('is-hidden', !order);

  if (!order) {
    setManagerOrderActionButtonsDisabled(true);
    if (refs.managerOrderDetailNumber) refs.managerOrderDetailNumber.textContent = '-';
    if (refs.managerOrderDetailStatus) refs.managerOrderDetailStatus.textContent = '-';
    if (refs.managerOrderDetailAccount) refs.managerOrderDetailAccount.textContent = '-';
    if (refs.managerOrderDetailCustomer) refs.managerOrderDetailCustomer.textContent = '-';
    if (refs.managerOrderDetailTime) refs.managerOrderDetailTime.textContent = '-';
    if (refs.managerOrderDetailTotal) refs.managerOrderDetailTotal.textContent = '-';
    if (refs.managerOrderDetailCreated) refs.managerOrderDetailCreated.textContent = '-';
    if (refs.managerOrderDetailUpdated) refs.managerOrderDetailUpdated.textContent = '-';
    if (refs.managerOrderDetailRoute) refs.managerOrderDetailRoute.textContent = '-';
    if (refs.managerOrderDetailPdf) refs.managerOrderDetailPdf.textContent = '-';
    if (refs.managerOrderDetailHint) {
      refs.managerOrderDetailHint.textContent = t('visible_in_results');
    }
    return;
  }

  setManagerOrderActionButtonsDisabled(false);

  if (refs.managerOrderDetailNumber) {
    refs.managerOrderDetailNumber.textContent = order.orderNumber || '-';
  }
  if (refs.managerOrderDetailStatus) {
    refs.managerOrderDetailStatus.textContent = formatOrderStatusLabel(order.status || '-');
  }
  if (refs.managerOrderDetailAccount) {
    refs.managerOrderDetailAccount.textContent = order.user
      ? `${order.user.name || order.user.email || t('no_account')}`
      : '-';
  }
  if (refs.managerOrderDetailCustomer) {
    refs.managerOrderDetailCustomer.textContent =
      order.customer?.name || order.customer?.email || '-';
  }
  if (refs.managerOrderDetailTime) {
    refs.managerOrderDetailTime.textContent = order.trip?.time || '-';
  }
  if (refs.managerOrderDetailTotal) {
    refs.managerOrderDetailTotal.textContent = order.totalPrice || '-';
  }
  if (refs.managerOrderDetailCreated) {
    refs.managerOrderDetailCreated.textContent = formatDateTimeLabel(order.createdAt);
  }
  if (refs.managerOrderDetailUpdated) {
    refs.managerOrderDetailUpdated.textContent = formatDateTimeLabel(order.updatedAt);
  }
  if (refs.managerOrderDetailRoute) {
    refs.managerOrderDetailRoute.textContent =
      [order.trip?.from, order.trip?.to].filter(Boolean).join(' → ') || t('route_not_set');
  }
  if (refs.managerOrderDetailPdf) {
    const pdfLabel = order.pdf?.fileName || order.pdf?.url || t('not_attached');
    refs.managerOrderDetailPdf.textContent = pdfLabel;
  }
  if (refs.managerOrderDetailHint) {
    refs.managerOrderDetailHint.textContent = isVisibleInCurrentResults
      ? state.managerOrdersSelectedOnly && contextUser
        ? t('filtered_to_user', { name: contextUser.name || contextUser.email })
        : t('visible_in_results')
      : t('selected_order_outside_filters');
  }
}

function renderManagerOrders() {
  if (!refs.managerOrdersList || !refs.managerOrdersEmpty) return;

  const contextUser =
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null;
  const summary = state.managerOrdersSummary || buildOrderStatusSummary(state.managerOrders);
  if (refs.managerOrdersAllCount) refs.managerOrdersAllCount.textContent = String(summary.all || 0);
  if (refs.managerOrdersPendingCount) {
    refs.managerOrdersPendingCount.textContent = String(summary.pending || 0);
  }
  if (refs.managerOrdersFailedCount) {
    refs.managerOrdersFailedCount.textContent = String(summary.failed || 0);
  }
  if (refs.managerOrdersGeneratedCount) {
    refs.managerOrdersGeneratedCount.textContent = String(summary.generated || 0);
  }

  const activeStatus = refs.managerOrdersStatusFilter?.value || 'all';
  refs.managerOrdersStatusButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.managerOrdersStatus === activeStatus);
  });

  if (refs.managerOrdersContextNote) {
    refs.managerOrdersContextNote.textContent = contextUser
      ? state.managerOrdersSelectedOnly
        ? t('filtered_to_selected_account', {
            name: contextUser.name || contextUser.email,
          })
        : t('selected_account_context', {
            name: contextUser.name || contextUser.email,
          })
      : t('all_accounts_visible');
  }

  if (!state.managerOrders.length) {
    refs.managerOrdersList.innerHTML = '';
    refs.managerOrdersEmpty.hidden = false;
  } else {
    refs.managerOrdersEmpty.hidden = true;
    refs.managerOrdersList.innerHTML = state.managerOrders
      .map(order => buildManagerOrderListMarkup(order))
      .join('');
  }

  if (refs.managerOrdersSelectedUserBtn) {
    const canUseSelected = Boolean(state.managerSelectedUserId);
    refs.managerOrdersSelectedUserBtn.disabled = !canUseSelected;
    refs.managerOrdersSelectedUserBtn.classList.toggle(
      'is-active',
      canUseSelected && state.managerOrdersSelectedOnly
    );
    refs.managerOrdersSelectedUserBtn.textContent = canUseSelected
      ? state.managerOrdersSelectedOnly
        ? t('showing_selected_account')
        : t('selected_account_only')
      : t('select_account_first');
  }

  renderManagerOrderDetail();
}

function renderManagerPlanOptions() {
  const plans = state.managerPlans.length ? state.managerPlans : state.plans;

  if (refs.managerSubscriptionPlan) {
    refs.managerSubscriptionPlan.innerHTML = plans
      .map(plan => {
        return `<option value="${plan.id}">${escapeHtml(plan.name)} - ${escapeHtml(
          t('per_cycle', { count: plan.monthlyGenerationLimit })
        )}</option>`;
      })
      .join('');
  }

  if (refs.managerPlanFilter) {
    const currentValue = refs.managerPlanFilter.value || 'all';
    refs.managerPlanFilter.innerHTML = [
      `<option value="all">${escapeHtml(t('all_plans_filter'))}</option>`,
      ...plans.map(plan => `<option value="${plan.id}">${escapeHtml(plan.name)}</option>`),
    ].join('');
    refs.managerPlanFilter.value = plans.some(plan => plan.id === currentValue)
      ? currentValue
      : 'all';
  }
}

function renderManagerUsers() {
  if (refs.managerUsersCount) {
    refs.managerUsersCount.textContent = String(state.managerUsers.length);
  }
  if (refs.managerActiveCount) {
    refs.managerActiveCount.textContent = String(
      state.managerUsers.filter(user => ['active', 'trial'].includes(user.subscription?.status)).length
    );
  }
  if (refs.managerInactiveCount) {
    refs.managerInactiveCount.textContent = String(
      state.managerUsers.filter(user => !['active', 'trial'].includes(user.subscription?.status)).length
    );
  }
  if (refs.managerStaffCount) {
    refs.managerStaffCount.textContent = String(
      state.managerUsers.filter(user => isManagerRole(user.role)).length
    );
  }

  if (!refs.managerUsersList || !refs.managerUsersEmpty) return;

  if (!state.managerUsers.length) {
    refs.managerUsersList.innerHTML = '';
    refs.managerUsersEmpty.hidden = false;
    return;
  }

  refs.managerUsersEmpty.hidden = true;
  refs.managerUsersList.innerHTML = state.managerUsers
    .map(user => {
      const isActive = user.id === state.managerSelectedUserId;
      return `
        <li class="managerUserItem ${isActive ? 'is-active' : ''}">
          <button type="button" class="managerUserButton" data-manager-user-id="${user.id}">
            <div class="managerUserCopy">
              <strong>${escapeHtml(user.name || t('no_name'))}</strong>
              <p>${escapeHtml(user.email || '-')}</p>
            </div>
            <div class="managerUserMeta">
              <span>${escapeHtml(user.plan?.name || '-')}</span>
              <span>${escapeHtml(localizeSubscriptionStatus(user.subscription?.status || '-'))}</span>
            </div>
          </button>
        </li>
      `;
    })
    .join('');
}

function renderManagerSelectedUser() {
  const user = state.managerSelectedUser;

  refs.managerSelectedEmpty?.classList.toggle('is-hidden', Boolean(user));
  refs.managerSelectedCard?.classList.toggle('is-hidden', !user);
  refs.managerSubscriptionEmpty?.classList.toggle('is-hidden', Boolean(user));
  refs.managerSubscriptionCard?.classList.toggle('is-hidden', !user);

  if (isAdminShell() && refs.workspaceUsage) {
    refs.workspaceUsage.textContent = user?.email || t('no_account');
  }

  if (!user) {
    state.managerOrdersSelectedOnly = false;
    setStoredManagerOrdersSelectedOnly(false);
    renderOrderList(
      refs.managerSelectedOrdersList,
      refs.managerSelectedOrdersEmpty,
      [],
      { emptyText: t('recent_orders_empty') }
    );
    if (refs.managerSubscriptionName) refs.managerSubscriptionName.textContent = '-';
    if (refs.managerSubscriptionEmail) refs.managerSubscriptionEmail.textContent = '-';
    if (refs.managerSubscriptionStatusLabel) {
      refs.managerSubscriptionStatusLabel.textContent = '-';
    }
    if (refs.managerSubscriptionUsageLabel) {
      refs.managerSubscriptionUsageLabel.textContent = '-';
    }
    renderManagerOrders();
    return;
  }

  if (refs.managerSelectedName) refs.managerSelectedName.textContent = user.name || '-';
  if (refs.managerSelectedEmail) refs.managerSelectedEmail.textContent = user.email || '-';
  if (refs.managerSelectedRole) refs.managerSelectedRole.textContent = localizeRole(user.role || 'user');
  if (refs.managerSelectedPlan) refs.managerSelectedPlan.textContent = user.plan?.name || '-';
  if (refs.managerSelectedStatus) {
    refs.managerSelectedStatus.textContent = localizeSubscriptionStatus(
      user.subscription?.status || '-'
    );
  }
  if (refs.managerSelectedCycle) {
    refs.managerSelectedCycle.textContent = formatCycleLabel(user.usage);
  }
  if (refs.managerSelectedUsage) {
    refs.managerSelectedUsage.textContent = `${user.usage?.used || 0} / ${user.usage?.limit || 0}`;
  }
  if (refs.managerSelectedOrdersCount) {
    refs.managerSelectedOrdersCount.textContent = String(user.totalOrders || 0);
  }
  if (refs.managerRecentOrdersLabel) {
    refs.managerRecentOrdersLabel.textContent = t('recent_count', {
      count: state.managerSelectedOrders.length,
    });
  }
  if (refs.managerSubscriptionName) {
    refs.managerSubscriptionName.textContent = user.name || '-';
  }
  if (refs.managerSubscriptionEmail) {
    refs.managerSubscriptionEmail.textContent = user.email || '-';
  }
  if (refs.managerSubscriptionStatusLabel) {
    refs.managerSubscriptionStatusLabel.textContent = localizeSubscriptionStatus(
      user.subscription?.status || '-'
    );
  }
  if (refs.managerSubscriptionUsageLabel) {
    refs.managerSubscriptionUsageLabel.textContent = `${user.usage?.used || 0} / ${
      user.usage?.limit || 0
    }`;
  }

  renderManagerPlanOptions();

  if (refs.managerSubscriptionPlan) {
    refs.managerSubscriptionPlan.value = user.planId || '';
  }
  if (refs.managerSubscriptionStatus) {
    refs.managerSubscriptionStatus.value = user.subscription?.status || 'active';
  }
  if (refs.managerSubscriptionStart) {
    refs.managerSubscriptionStart.value = isoToDateInput(user.subscription?.currentPeriodStart);
  }
  if (refs.managerSubscriptionEnd) {
    refs.managerSubscriptionEnd.value = isoToDateInput(user.subscription?.currentPeriodEnd);
  }
  if (refs.managerSubscriptionQuota) {
    refs.managerSubscriptionQuota.value = user.subscription?.quotaOverride ?? '';
  }
  if (refs.managerSubscriptionNotes) {
    refs.managerSubscriptionNotes.value = user.subscription?.notes || '';
  }

  refs.managerRoleSection?.classList.toggle('is-hidden', state.user?.role !== 'admin');
  if (refs.managerRoleSelect) {
    refs.managerRoleSelect.value = user.role || 'user';
  }

  renderOrderList(
    refs.managerSelectedOrdersList,
    refs.managerSelectedOrdersEmpty,
    state.managerSelectedOrders,
    { compact: true, emptyText: t('recent_orders_empty') }
  );
  renderManagerOrders();
}

function renderManagerPlans() {
  renderManagerPlanOptions();

  if (!refs.managerPlansList || !refs.managerPlansEmpty) return;

  if (!state.managerPlans.length) {
    refs.managerPlansList.innerHTML = '';
    refs.managerPlansEmpty.hidden = false;
    return;
  }

  refs.managerPlansEmpty.hidden = true;
  refs.managerPlansList.innerHTML = state.managerPlans
    .map(plan => {
      const isEditing = refs.managerPlanId?.value === plan.id;
      return `
        <li class="managerPlanItem ${isEditing ? 'is-active' : ''}">
          <button type="button" class="managerPlanButton" data-manager-plan-id="${plan.id}">
            <div>
              <strong>${escapeHtml(plan.name)}</strong>
              <p>${escapeHtml(plan.description || t('no_description'))}</p>
            </div>
            <div class="managerPlanMeta">
              <span>${escapeHtml(t('per_cycle', { count: plan.monthlyGenerationLimit }))}</span>
              <span>${escapeHtml(
                plan.isActive === false ? t('plan_inactive_status') : t('plan_active_status')
              )}</span>
            </div>
          </button>
        </li>
      `;
    })
    .join('');
}

function buildAuditMarkup(record) {
  const actor = record.actor?.name || record.actor?.email || t('system_actor');
  const target = record.target?.email || record.target?.name || '-';
  const createdAt = formatDateTimeLabel(record.createdAt);

  return `
    <li class="auditItem">
      <div>
        <strong>${escapeHtml(localizeAuditAction(record.action || 'system.event'))}</strong>
        <p>${escapeHtml(t('audit_target_arrow', { actor, target }))}</p>
      </div>
      <span>${escapeHtml(createdAt)}</span>
    </li>
  `;
}

function renderManagerAudit() {
  if (!refs.managerAuditList || !refs.managerAuditEmpty) return;

  if (!state.managerAudit.length) {
    refs.managerAuditList.innerHTML = '';
    refs.managerAuditEmpty.hidden = false;
    return;
  }

  refs.managerAuditEmpty.hidden = true;
  refs.managerAuditList.innerHTML = state.managerAudit.map(buildAuditMarkup).join('');
}

function renderManagerAccessState() {
  const canManage = isManagerRole(state.user?.role);

  refs.managerEntrySection?.classList.toggle('is-hidden', !canManage);
  refs.managerGate?.classList.toggle('is-hidden', canManage);
  refs.managerWorkspace?.classList.toggle('is-hidden', !canManage);
}

function renderDashboard() {
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
      state.user.subscription?.status || '-'
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
  if (refs.statsRemainingValue) {
    refs.statsRemainingValue.textContent = String(metrics.usage.remaining || 0);
  }
  if (refs.statsOrdersValue) refs.statsOrdersValue.textContent = String(metrics.totalOrders);
  if (refs.statsGeneratedValue) {
    refs.statsGeneratedValue.textContent = String(metrics.generatedOrders);
  }
  if (refs.statsUsageBar) {
    refs.statsUsageBar.style.width = `${metrics.usagePercent}%`;
  }
  if (refs.statsUsagePercent) {
    refs.statsUsagePercent.textContent = t('usage_percent_used', {
      percent: metrics.usagePercent,
    });
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

function broadcastAuthState() {
  window.dispatchEvent(
    new CustomEvent('pdf-app:auth-changed', {
      detail: {
        isAuthenticated: Boolean(state.user),
        user: state.user,
      },
    })
  );
}

function renderAuthenticatedState({ resetTab = false } = {}) {
  if (!state.user) {
    if (state.activeTab !== 'home') {
      state.authMode = 'login';
    }

    setGuestVisible(true);
    clearManagerState();
    renderGuestContext();

    renderOrderList(refs.ordersList, refs.ordersEmpty, [], {
      emptyText: t('orders_empty_home'),
    });
    renderManagerUsers();
    renderManagerSelectedUser();
    renderManagerPlans();
    renderManagerAudit();
    renderManagerOrders();

    if (resetTab) {
      activateTab(getRouteTab());
    }

    broadcastAuthState();
    return;
  }

  setGuestVisible(false);
  renderDashboard();

  if (resetTab) {
    activateTab(getRouteTab());
  }

  broadcastAuthState();
}

async function refreshManagerUserDetail(userId) {
  if (!userId || !isManagerRole(state.user?.role)) {
    state.managerSelectedUser = null;
    state.managerSelectedOrders = [];
    setStoredManagerSelectedUserId('');
    renderManagerSelectedUser();
    return;
  }

  try {
    const data = await API_getManagerUser(userId);
    state.managerSelectedUser = data.user || null;
    state.managerSelectedUserId = data.user?.id || '';
    setStoredManagerSelectedUserId(state.managerSelectedUserId);
    state.managerSelectedOrders = data.recentOrders || [];
    renderManagerSelectedUser();
  } catch (error) {
    notifyText(error.message || t('account_detail_failed'), 'error');
  }
}

function syncSelectedManagerOrderFromCollections() {
  if (!state.managerSelectedOrderId) {
    state.managerSelectedOrder = null;
    renderManagerOrderDetail();
    return;
  }

  const nextOrder =
    state.managerOrders.find(order => order.id === state.managerSelectedOrderId) ||
    state.managerSelectedOrders.find(order => order.id === state.managerSelectedOrderId) ||
    state.managerSelectedOrder;

  state.managerSelectedOrder = nextOrder || null;

  if (!state.managerSelectedOrder) {
    state.managerSelectedOrderId = '';
    setStoredManagerSelectedOrderId('');
  }

  renderManagerOrderDetail();
}

async function refreshManagerOrderDetail(orderId, { silent = false } = {}) {
  if (!orderId || !isAdminShell() || !isManagerRole(state.user?.role)) {
    state.managerSelectedOrderId = '';
    state.managerSelectedOrder = null;
    setStoredManagerSelectedOrderId('');
    renderManagerOrderDetail();
    return;
  }

  try {
    const data = await API_getOrder(orderId);
    state.managerSelectedOrderId = data.order?.id || orderId;
    state.managerSelectedOrder = data.order || null;
    setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    renderManagerOrderDetail();
  } catch (error) {
    if (!silent) {
      notifyText(error.message || t('order_detail_failed'), 'error');
    }
  }
}

function getManagerOrdersFilters() {
  if (state.managerOrdersSelectedOnly && !state.managerSelectedUserId) {
    state.managerOrdersSelectedOnly = false;
    setStoredManagerOrdersSelectedOnly(false);
  }

  return {
    search: refs.managerOrdersSearchInput?.value?.trim() || '',
    status: refs.managerOrdersStatusFilter?.value || 'all',
    userId: state.managerOrdersSelectedOnly ? state.managerSelectedUserId || '' : '',
    limit: 100,
  };
}

async function loadManagerOrders() {
  if (!isAdminShell() || !isManagerRole(state.user?.role)) {
    state.managerOrders = [];
    state.managerOrdersSummary = buildOrderStatusSummary([]);
    renderManagerOrders();
    return;
  }

  try {
    const ordersResponse = await API_getManagerOrders(getManagerOrdersFilters());
    state.managerOrders = ordersResponse.orders || [];
    state.managerOrdersSummary = ordersResponse.summary || buildOrderStatusSummary(state.managerOrders);

    if (!state.managerSelectedOrderId && state.activeTab === 'orders') {
      state.managerSelectedOrderId = state.managerOrders[0]?.id || '';
      setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    }

    syncSelectedManagerOrderFromCollections();
    renderManagerOrders();
  } catch (error) {
    notifyText(error.message || t('admin_orders_failed'), 'error');
  }
}

async function loadManagerData({ preserveSelection = true } = {}) {
  if (!isAdminShell() || !isManagerRole(state.user?.role)) {
    clearManagerState();
    renderManagerUsers();
    renderManagerSelectedUser();
    renderManagerPlans();
    renderManagerAudit();
    renderManagerOrders();
    return;
  }

  try {
    const shouldLoadOrders = state.activeTab === 'orders';
    const filters = {
      search: refs.managerSearchInput?.value?.trim() || '',
      status: refs.managerStatusFilter?.value || 'all',
      role: refs.managerRoleFilter?.value || 'all',
      planId: refs.managerPlanFilter?.value || 'all',
    };

    const [usersResponse, plansResponse, auditResponse] = await Promise.all([
      API_getManagerUsers(filters),
      API_getManagerPlans(),
      API_getManagerAudit({ limit: 40 }),
    ]);

    state.managerUsers = usersResponse.users || [];
    state.managerPlans = plansResponse.plans || [];
    state.managerAudit = auditResponse.audit || [];
    if (shouldLoadOrders) {
      const ordersResponse = await API_getManagerOrders(getManagerOrdersFilters());
      state.managerOrders = ordersResponse.orders || [];
      state.managerOrdersSummary =
        ordersResponse.summary || buildOrderStatusSummary(state.managerOrders);
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

async function refreshAccountData({ resetTab = false } = {}) {
  const hadUser = Boolean(state.user);
  let session = getStoredSession();

  if (!session?.token) {
    try {
      const refreshed = await API_refreshSession();
      setStoredSession({ token: refreshed.token, user: refreshed.user });
      session = getStoredSession();
    } catch {
      state.user = null;
      state.orders = [];
      clearManagerState();
      renderAuthenticatedState({ resetTab });
      return;
    }
  }

  try {
    const meResponse = await API_getMe();
    let orders = [];

    try {
      const ordersResponse = await API_getOrders();
      orders = ordersResponse.orders || [];
    } catch (error) {
      orders = [];
      notifyText(error.message || t('api_orders_failed'), 'error');
    }

    state.user = meResponse.user;
    state.orders = orders;

    setStoredSession({
      token: session.token,
      user: state.user,
    });

    renderAuthenticatedState({ resetTab });

    if (isAdminShell() && isManagerRole(state.user?.role)) {
      await loadManagerData();
    }
  } catch (error) {
    if (error.status === 401) {
      clearStoredSession();
      state.user = null;
      state.orders = [];
      clearManagerState();
      renderAuthenticatedState({ resetTab: true });
      notifyText(t('session_expired'), 'error');
      return;
    }

    if (!hadUser) {
      state.user = null;
      state.orders = [];
      clearManagerState();
      renderAuthenticatedState({ resetTab });
    }

    notifyText(error.message || t('account_load_failed'), 'error');
  }
}

async function handleRegisterSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.name || !payload.email || !payload.password || !payload.planId) {
    notifyText(t('register_validation'), 'error');
    return;
  }

  setFormDisabled(refs.registerForm, true);

  try {
    const data = await API_register(payload);
    setStoredSession({ token: data.token, user: data.user });
    state.user = data.user;
    notifyText(t('account_created_signed_in'), 'success');
    await refreshAccountData({ resetTab: true });
    refs.registerForm?.reset();
    syncSelectedPlan(state.selectedPlanId);
  } catch (error) {
    notifyText(error.message || t('register_failed'), 'error');
  } finally {
    setFormDisabled(refs.registerForm, false);
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.email || !payload.password) {
    notifyText(t('login_validation'), 'error');
    return;
  }

  setFormDisabled(refs.loginForm, true);

  try {
    const data = await API_login(payload);
    setStoredSession({ token: data.token, user: data.user });
    state.user = data.user;
    notifyText(t('signed_in_successfully'), 'success');
    await refreshAccountData({ resetTab: true });
    refs.loginForm?.reset();
  } catch (error) {
    notifyText(error.message || t('sign_in_failed'), 'error');
  } finally {
    setFormDisabled(refs.loginForm, false);
  }
}

async function handleLogoutClick() {
  try {
    await API_logout();
  } catch {
    // Local session must still be cleared.
  }

  clearStoredSession();
  clearAppStorage();
  state.user = null;
  state.orders = [];
  clearManagerState();
  renderAuthenticatedState({ resetTab: true });
  notifyText(t('signed_out'), 'success');
}

async function handleDeleteAccountClick() {
  if (!state.user) return;

  const confirmed = window.confirm(
    t('delete_account_confirm')
  );

  if (!confirmed) return;

  try {
    await API_deleteMe();
    clearStoredSession();
    clearAppStorage();
    state.user = null;
    state.orders = [];
    clearManagerState();
    renderAuthenticatedState({ resetTab: true });
    refs.hub?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    notifyText(t('account_deleted'), 'success');
  } catch (error) {
    notifyText(error.message || t('delete_account_failed'), 'error');
  }
}

async function handleUpdateProfileClick() {
  if (!state.user) return;

  const profile = {
    driver: {
      name: refs.accountDriverName?.value || '',
      address: refs.accountDriverAddress?.value || '',
      spz: refs.accountDriverSpz?.value || '',
      ico: refs.accountDriverIco?.value || '',
    },
    provider: {
      name: refs.accountProviderName?.value || '',
      address: refs.accountProviderAddress?.value || '',
      ico: refs.accountProviderIco?.value || '',
    },
  };

  if (refs.updateProfileBtn) refs.updateProfileBtn.disabled = true;

  try {
    const data = await API_updateMyProfile(profile);
    state.user = data.user;

    const session = getStoredSession();
    if (session?.token) {
      setStoredSession({ token: session.token, user: state.user });
    }

    notifyText(t('business_profile_updated'), 'success');
    renderAuthenticatedState();
  } catch (error) {
    notifyText(error.message || t('update_profile_failed'), 'error');
  } finally {
    if (refs.updateProfileBtn) refs.updateProfileBtn.disabled = false;
  }
}

async function handleManagerSubscriptionSave() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;

  const payload = {
    planId: refs.managerSubscriptionPlan?.value || '',
    status: refs.managerSubscriptionStatus?.value || 'active',
    currentPeriodStart: refs.managerSubscriptionStart?.value || '',
    currentPeriodEnd: refs.managerSubscriptionEnd?.value || '',
    quotaOverride: refs.managerSubscriptionQuota?.value || null,
    notes: refs.managerSubscriptionNotes?.value || '',
  };

  refs.managerSubscriptionSaveBtn && (refs.managerSubscriptionSaveBtn.disabled = true);

  try {
    await API_updateManagerUserSubscription(userId, payload);
    notifyText(t('subscription_updated'), 'success');
    await refreshAccountData();
  } catch (error) {
    notifyText(error.message || t('update_subscription_failed'), 'error');
  } finally {
    refs.managerSubscriptionSaveBtn && (refs.managerSubscriptionSaveBtn.disabled = false);
  }
}

async function handleManagerSubscriptionExtend() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;

  refs.managerSubscriptionExtendBtn &&
    (refs.managerSubscriptionExtendBtn.disabled = true);

  try {
    await API_extendManagerUserSubscription(userId, { months: 1 });
    notifyText(t('subscription_extended_30'), 'success');
    await refreshAccountData();
  } catch (error) {
    notifyText(error.message || t('extend_subscription_failed'), 'error');
  } finally {
    refs.managerSubscriptionExtendBtn &&
      (refs.managerSubscriptionExtendBtn.disabled = false);
  }
}

async function handleManagerSubscriptionCancel() {
  const userId = state.managerSelectedUserId;
  if (!userId) return;

  const confirmed = window.confirm(t('cancel_subscription_confirm'));
  if (!confirmed) return;

  refs.managerSubscriptionCancelBtn &&
    (refs.managerSubscriptionCancelBtn.disabled = true);

  try {
    await API_cancelManagerUserSubscription(userId);
    notifyText(t('subscription_canceled_message'), 'success');
    await refreshAccountData();
  } catch (error) {
    notifyText(error.message || t('cancel_subscription_failed'), 'error');
  } finally {
    refs.managerSubscriptionCancelBtn &&
      (refs.managerSubscriptionCancelBtn.disabled = false);
  }
}

async function handleManagerRoleSave() {
  const userId = state.managerSelectedUserId;
  if (!userId || state.user?.role !== 'admin') return;

  const role = refs.managerRoleSelect?.value || 'user';
  refs.managerRoleSaveBtn && (refs.managerRoleSaveBtn.disabled = true);

  try {
    await API_updateManagerUserRole(userId, role);
    notifyText(t('role_updated'), 'success');
    await refreshAccountData();
  } catch (error) {
    notifyText(error.message || t('update_role_failed'), 'error');
  } finally {
    refs.managerRoleSaveBtn && (refs.managerRoleSaveBtn.disabled = false);
  }
}

function resetManagerPlanForm() {
  if (refs.managerPlanId) refs.managerPlanId.value = '';
  if (refs.managerPlanName) refs.managerPlanName.value = '';
  if (refs.managerPlanLimit) refs.managerPlanLimit.value = '';
  if (refs.managerPlanDescription) refs.managerPlanDescription.value = '';
  if (refs.managerPlanActive) refs.managerPlanActive.checked = true;
}

async function handleManagerPlanSubmit(event) {
  event.preventDefault();

  const planId = refs.managerPlanId?.value || '';
  const payload = {
    name: refs.managerPlanName?.value || '',
    monthlyGenerationLimit: refs.managerPlanLimit?.value || '',
    description: refs.managerPlanDescription?.value || '',
    isActive: refs.managerPlanActive?.checked ?? true,
  };

  if (!payload.name || !payload.monthlyGenerationLimit) {
    notifyText(t('plan_validation'), 'error');
    return;
  }

  refs.managerPlanSubmitBtn && (refs.managerPlanSubmitBtn.disabled = true);

  try {
    if (planId) {
      await API_updateManagerPlan(planId, payload);
      notifyText(t('plan_updated'), 'success');
    } else {
      await API_createManagerPlan(payload);
      notifyText(t('plan_created'), 'success');
    }

    resetManagerPlanForm();
    await loadPlans();
    await refreshAccountData();
  } catch (error) {
    notifyText(error.message || t('save_plan_failed'), 'error');
  } finally {
    refs.managerPlanSubmitBtn && (refs.managerPlanSubmitBtn.disabled = false);
  }
}

function handlePlanCardClick(event) {
  const card = event.target.closest('.planCard[data-plan-select]');
  if (!card) return;

  setAuthMode('register');
  syncSelectedPlan(card.dataset.planSelect, { scrollToForm: true });
}

function handlePlanCardKeydown(event) {
  const card = event.target.closest('.planCard[data-plan-select]');
  if (!card) return;

  if (event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();
  setAuthMode('register');
  syncSelectedPlan(card.dataset.planSelect, { scrollToForm: true });
}

function handleAuthModeClick(event) {
  const button = event.target.closest('[data-auth-mode]');
  if (!button) return;

  setAuthMode(button.dataset.authMode || getDefaultAuthMode());
}

function handleAuthModeKeydown(event) {
  const button = event.target.closest('[data-auth-mode]');
  if (!button) return;

  const currentIndex = AUTH_MODES.indexOf(button.dataset.authMode || '');
  if (currentIndex === -1) return;

  let nextMode = null;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextMode = AUTH_MODES[(currentIndex + 1) % AUTH_MODES.length];
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextMode = AUTH_MODES[(currentIndex - 1 + AUTH_MODES.length) % AUTH_MODES.length];
  } else if (event.key === 'Home') {
    nextMode = AUTH_MODES[0];
  } else if (event.key === 'End') {
    nextMode = AUTH_MODES[AUTH_MODES.length - 1];
  }

  if (!nextMode) return;

  event.preventDefault();
  setAuthMode(nextMode);
  focusAuthMode(nextMode);
}

function handleTabClick(event) {
  const button = event.target.closest('[data-tab-target]');
  if (!button) return;

  const href = button.getAttribute('href');
  if (!href) {
    activateTab(button.dataset.tabTarget);
    return;
  }

  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const url = new URL(href, window.location.origin);
  const nextTab = getTabForPath(url.pathname);
  if (!nextTab) return;

  event.preventDefault();
  navigateToTab(nextTab, url.pathname);
}

function handleTabPopState() {
  const nextTab = getTabForPath(window.location.pathname);
  if (!nextTab) return;

  document.body.dataset.appTab = nextTab;
  activateTab(nextTab);
  syncPageMeta(getCurrentLanguage());
}

function bindNavigationEvents() {
  window.addEventListener('popstate', handleTabPopState);
}

function unbindNavigationEvents() {
  window.removeEventListener('popstate', handleTabPopState);
}

function syncInitialRouteState() {
  const nextTab = getTabForPath(window.location.pathname);
  if (!nextTab) return;

  document.body.dataset.appTab = nextTab;
  activateTab(nextTab);
  syncPageMeta(getCurrentLanguage());
}

async function loadPlans() {
  try {
    const data = await API_getPlans();
    state.plans = data.plans || [];
    if (!state.selectedPlanId) {
      state.selectedPlanId = state.plans[0]?.id || '';
    }
    renderPlans();
  } catch (error) {
    notifyText(error.message || t('load_plans_failed'), 'error');
  }
}

async function handleManagerUsersClick(event) {
  const button = event.target.closest('[data-manager-user-id]');
  if (!button) return;

  state.managerSelectedUserId = button.dataset.managerUserId || '';
  await refreshManagerUserDetail(state.managerSelectedUserId);

  if (state.managerOrdersSelectedOnly) {
    await loadManagerOrders();
  }
}

async function handleManagerOrdersClick(event) {
  const button = event.target.closest('[data-manager-order-id]');
  if (!button) return;

  const nextOrderId = button.dataset.managerOrderId || '';
  if (!nextOrderId) return;

  state.managerSelectedOrderId = nextOrderId;
  state.managerSelectedOrder =
    state.managerOrders.find(order => order.id === nextOrderId) || state.managerSelectedOrder;
  setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
  renderManagerOrders();
  await refreshManagerOrderDetail(nextOrderId, { silent: true });
}

function handleManagerPlansClick(event) {
  const button = event.target.closest('[data-manager-plan-id]');
  if (!button) return;

  const plan = state.managerPlans.find(item => item.id === button.dataset.managerPlanId);
  if (!plan) return;

  if (refs.managerPlanId) refs.managerPlanId.value = plan.id;
  if (refs.managerPlanName) refs.managerPlanName.value = plan.name || '';
  if (refs.managerPlanLimit) {
    refs.managerPlanLimit.value = String(plan.monthlyGenerationLimit || '');
  }
  if (refs.managerPlanDescription) {
    refs.managerPlanDescription.value = plan.description || '';
  }
  if (refs.managerPlanActive) refs.managerPlanActive.checked = plan.isActive !== false;
  renderManagerPlans();
}

function queueManagerSearchRefresh() {
  window.clearTimeout(managerSearchTimer);
  managerSearchTimer = window.setTimeout(() => {
    loadManagerData({ preserveSelection: false });
  }, 250);
}

function queueManagerOrdersRefresh() {
  window.clearTimeout(managerOrdersSearchTimer);
  managerOrdersSearchTimer = window.setTimeout(() => {
    loadManagerOrders();
  }, 250);
}

async function handleManagerOrdersSelectedToggle() {
  if (!state.managerSelectedUserId) return;

  state.managerOrdersSelectedOnly = !state.managerOrdersSelectedOnly;
  setStoredManagerOrdersSelectedOnly(state.managerOrdersSelectedOnly);
  renderManagerOrders();
  await loadManagerOrders();
}

async function handleManagerOrdersStatusPresetClick(event) {
  const button = event.currentTarget;
  const nextStatus = button.dataset.managerOrdersStatus || 'all';

  if (refs.managerOrdersStatusFilter) {
    refs.managerOrdersStatusFilter.value = nextStatus;
  }

  await loadManagerOrders();
}

function setManagerOrderActionButtonsDisabled(disabled) {
  if (refs.managerOrderMarkPendingBtn) refs.managerOrderMarkPendingBtn.disabled = disabled;
  if (refs.managerOrderMarkGeneratedBtn) refs.managerOrderMarkGeneratedBtn.disabled = disabled;
  if (refs.managerOrderMarkFailedBtn) refs.managerOrderMarkFailedBtn.disabled = disabled;
}

function getOrderStatusActionLabel(status) {
  if (status === 'pending_pdf') return t('order_pending_pdf');
  if (status === 'pdf_generated') return t('order_pdf_generated');
  if (status === 'pdf_failed') return t('order_pdf_failed');
  return formatOrderStatusLabel(status);
}

async function handleManagerOrderStatusChange(nextStatus) {
  const orderId = state.managerSelectedOrderId;
  if (!orderId) return;

  setManagerOrderActionButtonsDisabled(true);

  try {
    const data = await API_updateOrder(orderId, { status: nextStatus });
    state.managerSelectedOrder = data.order || state.managerSelectedOrder;
    state.managerSelectedOrderId = data.order?.id || state.managerSelectedOrderId;
    setStoredManagerSelectedOrderId(state.managerSelectedOrderId);
    notifyText(
      t('order_marked_as', { status: getOrderStatusActionLabel(nextStatus) }),
      'success'
    );

    const refreshTasks = [loadManagerOrders()];
    if (state.managerSelectedUserId && data.order?.userId === state.managerSelectedUserId) {
      refreshTasks.push(refreshManagerUserDetail(state.managerSelectedUserId));
    }

    await Promise.all(refreshTasks);
  } catch (error) {
    notifyText(error.message || t('update_order_status_failed'), 'error');
  } finally {
    setManagerOrderActionButtonsDisabled(false);
  }
}

function bindEvents() {
  bindNavigationEvents();
  refs.registerForm?.addEventListener('submit', handleRegisterSubmit);
  refs.loginForm?.addEventListener('submit', handleLoginSubmit);
  refs.guestLanguageButtons.forEach(button => {
    button.addEventListener('click', handleGuestLanguageClick);
  });
  refs.authModeButtons.forEach(button => {
    button.addEventListener('click', handleAuthModeClick);
    button.addEventListener('keydown', handleAuthModeKeydown);
  });
  refs.logoutBtn?.addEventListener('click', handleLogoutClick);
  refs.deleteAccountBtn?.addEventListener('click', handleDeleteAccountClick);
  refs.updateProfileBtn?.addEventListener('click', handleUpdateProfileClick);
  refs.accountLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.adminLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.planCards?.addEventListener('click', handlePlanCardClick);
  refs.planCards?.addEventListener('keydown', handlePlanCardKeydown);
  refs.planSelect?.addEventListener('change', event => {
    setAuthMode('register');
    syncSelectedPlan(event.target.value);
  });
  refs.statsTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      activateStatsTab(button.dataset.statsTabTarget);
    });
  });
  refs.tabButtons.forEach(button => {
    button.addEventListener('click', handleTabClick);
  });
  refs.managerUsersList?.addEventListener('click', handleManagerUsersClick);
  refs.managerPlansList?.addEventListener('click', handleManagerPlansClick);
  refs.managerRefreshBtn?.addEventListener('click', () => {
    loadManagerData({ preserveSelection: true });
  });
  refs.managerSearchInput?.addEventListener('input', queueManagerSearchRefresh);
  refs.managerStatusFilter?.addEventListener('change', () => {
    loadManagerData({ preserveSelection: false });
  });
  refs.managerRoleFilter?.addEventListener('change', () => {
    loadManagerData({ preserveSelection: false });
  });
  refs.managerPlanFilter?.addEventListener('change', () => {
    loadManagerData({ preserveSelection: false });
  });
  refs.managerOrdersRefreshBtn?.addEventListener('click', () => {
    loadManagerOrders();
  });
  refs.managerOrdersSearchInput?.addEventListener('input', queueManagerOrdersRefresh);
  refs.managerOrdersStatusFilter?.addEventListener('change', () => {
    loadManagerOrders();
  });
  refs.managerOrdersSelectedUserBtn?.addEventListener(
    'click',
    handleManagerOrdersSelectedToggle
  );
  refs.managerOrdersList?.addEventListener('click', handleManagerOrdersClick);
  refs.managerOrdersStatusButtons.forEach(button => {
    button.addEventListener('click', handleManagerOrdersStatusPresetClick);
  });
  refs.managerOrderMarkPendingBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pending_pdf');
  });
  refs.managerOrderMarkGeneratedBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pdf_generated');
  });
  refs.managerOrderMarkFailedBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pdf_failed');
  });
  refs.managerSubscriptionSaveBtn?.addEventListener('click', handleManagerSubscriptionSave);
  refs.managerSubscriptionExtendBtn?.addEventListener(
    'click',
    handleManagerSubscriptionExtend
  );
  refs.managerSubscriptionCancelBtn?.addEventListener(
    'click',
    handleManagerSubscriptionCancel
  );
  refs.managerRoleSaveBtn?.addEventListener('click', handleManagerRoleSave);
  refs.managerPlanForm?.addEventListener('submit', handleManagerPlanSubmit);
  refs.managerPlanResetBtn?.addEventListener('click', resetManagerPlanForm);
  window.addEventListener('pdf-app:order-created', () => {
    refreshAccountData();
  });
  window.addEventListener('pdf-app:language-changed', () => {
    syncLanguageSelects();
    renderPlans();
    renderAuthenticatedState();
  });
}

async function init() {
  if (!refs.hub) return;

  initAppLoader();
  setBootLoaderActive(document.body.dataset.authState === 'booting');
  initLanguage();
  syncInitialRouteState();
  bindEvents();
  syncLanguageSelects();
  setAuthMode(state.authMode);
  activateTab(state.activeTab);
  activateStatsTab(state.activeStatsTab);
  try {
    await loadPlans();
    await refreshAccountData();
  } finally {
    setBootLoaderActive(false);
  }
}

init();

window.addEventListener('beforeunload', unbindNavigationEvents);

export function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

export async function refreshAuthPanel() {
  await refreshAccountData();
}
