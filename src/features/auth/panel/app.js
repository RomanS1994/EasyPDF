import {
  deleteMe,
  getMe,
  login,
  logout,
  refreshSession,
  register,
  updateMyProfile,
} from '../api.js';
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '../session.js';
import { getPlans } from '../../plans/api.js';
import { getOrders } from '../../orders/api.js';
import {
  activateStatsTab,
  activateTab,
  bindNavigationEvents,
  getTabForPath,
  navigateToTab,
  syncInitialRouteState,
  unbindNavigationEvents,
} from './routes.js';
import {
  AUTH_MODES,
  clearAppStorage,
  clearManagerState,
  getDefaultAuthMode,
  isAdminShell,
  refs,
  setFormDisabled,
  setGuestVisible,
  state,
} from './context.js';
import {
  focusAuthMode,
  handleGuestLanguageClick,
  handleLanguageSelectChange,
  renderGuestContext,
  renderPlans,
  setAuthMode,
  syncLanguageSelects,
  syncSelectedPlan,
} from './guest.js';
import {
  formatCycleLabel,
  localizeRole,
  localizeSubscriptionStatus,
} from './formatters.js';
import { renderOrderList } from './orders.js';
import { getMetrics, renderStatsCharts } from './stats.js';
import {
  cancelCurrentManagerSubscription,
  extendManagerSubscription,
  handleManagerOrderStatusChange,
  loadManagerData,
  loadManagerOrders,
  refreshManagerOrderDetail,
  refreshManagerUserDetail,
  renderManagerAccessState,
  renderManagerAudit,
  renderManagerOrders,
  renderManagerPlans,
  renderManagerSelectedUser,
  renderManagerUsers,
  resetManagerPlanForm,
  saveManagerPlan,
  saveManagerRole,
  saveManagerSubscription,
} from './manager.js';
import {
  applyLanguage,
  getCurrentLanguage,
  initLanguage,
  syncPageMeta,
  t,
} from '../../../shared/i18n/app.js';
import { initAppLoader, setBootLoaderActive } from '../../../shared/ui/loader.js';
import { notifyText } from '../../../shared/ui/toast.js';

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

async function refreshAccountData({ resetTab = false } = {}) {
  const hadUser = Boolean(state.user);
  let session = getStoredSession();

  if (!session?.token) {
    try {
      const refreshed = await refreshSession();
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
    const meResponse = await getMe();
    let orders = [];

    try {
      const ordersResponse = await getOrders();
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

    if (isAdminShell()) {
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

async function loadPlansForGuest() {
  try {
    const data = await getPlans();
    state.plans = data.plans || [];
    if (!state.selectedPlanId) {
      state.selectedPlanId = state.plans[0]?.id || '';
    }
    renderPlans();
  } catch (error) {
    notifyText(error.message || t('load_plans_failed'), 'error');
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
    const data = await register(payload);
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
    const data = await login(payload);
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
    await logout();
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
  if (!window.confirm(t('delete_account_confirm'))) return;

  try {
    await deleteMe();
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
    const data = await updateMyProfile(profile);
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

async function bindManagerActions(event) {
  const userButton = event.target.closest('[data-manager-user-id]');
  if (userButton) {
    state.managerSelectedUserId = userButton.dataset.managerUserId || '';
    await refreshManagerUserDetail(state.managerSelectedUserId);
    if (state.managerOrdersSelectedOnly) {
      await loadManagerOrders();
    }
  }
}

async function handleManagerOrdersClick(event) {
  const orderButton = event.target.closest('[data-manager-order-id]');
  if (!orderButton) return;

  const nextOrderId = orderButton.dataset.managerOrderId || '';
  if (!nextOrderId) return;

  state.managerSelectedOrderId = nextOrderId;
  state.managerSelectedOrder =
    state.managerOrders.find(order => order.id === nextOrderId) || state.managerSelectedOrder;
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
  if (refs.managerPlanLimit) refs.managerPlanLimit.value = String(plan.monthlyGenerationLimit || '');
  if (refs.managerPlanDescription) refs.managerPlanDescription.value = plan.description || '';
  if (refs.managerPlanActive) refs.managerPlanActive.checked = plan.isActive !== false;
  renderManagerPlans();
}

function bindEvents() {
  bindNavigationEvents();
  refs.registerForm?.addEventListener('submit', handleRegisterSubmit);
  refs.loginForm?.addEventListener('submit', handleLoginSubmit);
  refs.guestLanguageButtons.forEach(button => button.addEventListener('click', handleGuestLanguageClick));
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
    button.addEventListener('click', () => activateStatsTab(button.dataset.statsTabTarget));
  });
  refs.tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
  refs.managerUsersList?.addEventListener('click', bindManagerActions);
  refs.managerPlansList?.addEventListener('click', handleManagerPlansClick);
  refs.managerRefreshBtn?.addEventListener('click', () => loadManagerData({ preserveSelection: true }));
  refs.managerSearchInput?.addEventListener('input', () => loadManagerData({ preserveSelection: false }));
  refs.managerStatusFilter?.addEventListener('change', () => loadManagerData({ preserveSelection: false }));
  refs.managerRoleFilter?.addEventListener('change', () => loadManagerData({ preserveSelection: false }));
  refs.managerPlanFilter?.addEventListener('change', () => loadManagerData({ preserveSelection: false }));
  refs.managerOrdersRefreshBtn?.addEventListener('click', () => loadManagerOrders());
  refs.managerOrdersSearchInput?.addEventListener('input', () => loadManagerOrders());
  refs.managerOrdersStatusFilter?.addEventListener('change', () => loadManagerOrders());
  refs.managerOrdersSelectedUserBtn?.addEventListener('click', async () => {
    if (!state.managerSelectedUserId) return;
    state.managerOrdersSelectedOnly = !state.managerOrdersSelectedOnly;
    renderManagerOrders();
    await loadManagerOrders();
  });
  refs.managerOrdersList?.addEventListener('click', handleManagerOrdersClick);
  refs.managerOrdersStatusButtons.forEach(button => {
    button.addEventListener('click', async () => {
      if (refs.managerOrdersStatusFilter) {
        refs.managerOrdersStatusFilter.value = button.dataset.managerOrdersStatus || 'all';
      }
      await loadManagerOrders();
    });
  });
  refs.managerOrderMarkPendingBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pending_pdf', refreshAccountData);
  });
  refs.managerOrderMarkGeneratedBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pdf_generated', refreshAccountData);
  });
  refs.managerOrderMarkFailedBtn?.addEventListener('click', () => {
    handleManagerOrderStatusChange('pdf_failed', refreshAccountData);
  });
  refs.managerSubscriptionSaveBtn?.addEventListener('click', async () => {
    await saveManagerSubscription();
    await refreshAccountData();
  });
  refs.managerSubscriptionExtendBtn?.addEventListener('click', async () => {
    await extendManagerSubscription();
    await refreshAccountData();
  });
  refs.managerSubscriptionCancelBtn?.addEventListener('click', async () => {
    await cancelCurrentManagerSubscription();
    await refreshAccountData();
  });
  refs.managerRoleSaveBtn?.addEventListener('click', async () => {
    await saveManagerRole();
    await refreshAccountData();
  });
  refs.managerPlanForm?.addEventListener('submit', async event => {
    event.preventDefault();
    await saveManagerPlan();
    await loadPlansForGuest();
    await refreshAccountData();
  });
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

export async function initAuthPage() {
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
    await loadPlansForGuest();
    await refreshAccountData();
  } finally {
    setBootLoaderActive(false);
  }
}

window.addEventListener('beforeunload', unbindNavigationEvents);

export function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

export async function refreshAuthPanel() {
  await refreshAccountData();
}
