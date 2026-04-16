export const refs = {
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

export const TAB_NAMES = [
  'home',
  'stats',
  'orders',
  'account',
  'accounts',
  'subscriptions',
  'settings',
];
export const STATS_TAB_NAMES = ['usage', 'activity', 'plan'];
export const AUTH_MODES = ['register', 'login'];
export const CONTRACT_STORAGE_KEY = 'contract-data';
export const MANAGER_SELECTED_USER_KEY = 'pdf-app-admin-selected-user';
export const MANAGER_SELECTED_ORDER_KEY = 'pdf-app-admin-selected-order';
export const MANAGER_ORDERS_SELECTED_ONLY_KEY = 'pdf-app-admin-orders-selected-only';

export const state = {
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

export let managerSearchTimer = 0;
export let managerOrdersSearchTimer = 0;

export function setManagerSearchTimer(value) {
  managerSearchTimer = value;
}

export function setManagerOrdersSearchTimer(value) {
  managerOrdersSearchTimer = value;
}

export function getDefaultAuthMode() {
  return getRouteTab() === 'home' ? 'register' : 'login';
}

export function setFormDisabled(form, disabled) {
  if (!form) return;

  Array.from(form.elements).forEach(element => {
    element.disabled = disabled;
  });
}

export function clearAppStorage() {
  localStorage.removeItem(CONTRACT_STORAGE_KEY);
}

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

export function isAdminShell() {
  return document.body.dataset.appShell === 'admin';
}

export function getRouteTab() {
  const routeTab = document.body.dataset.appTab || 'home';
  return TAB_NAMES.includes(routeTab) ? routeTab : 'home';
}

export function isManagerRole(role) {
  return role === 'manager' || role === 'admin';
}

export function clearManagerState() {
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

export function setGuestVisible(isVisible) {
  document.body.dataset.authState = isVisible ? 'guest' : 'session';
  refs.guestPanel?.classList.toggle('is-hidden', !isVisible);
  refs.accountPanel?.classList.toggle('is-hidden', isVisible);
}
