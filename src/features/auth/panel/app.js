import {
  getStoredSession,
} from '../session.js';
import {
  activateStatsTab,
  activateTab,
  bindNavigationEvents,
  syncInitialRouteState,
  unbindNavigationEvents,
} from './routes.js';
import { refs } from './refs.js';
import { state } from './state.js';
import {
  setOrdersDateFilter,
  getTodayLocalDateKey,
} from './orders.js';
import {
  handleGuestLanguageClick,
  handleLanguageSelectChange,
  renderGuestContext,
  renderPlans,
  setAuthMode,
  syncSelectedPlan,
  syncLanguageSelects,
} from './guest.js';
import { renderAuthenticatedState } from './dashboard.js';
import {
  handleDeleteAccountClick,
  handleLogoutClick,
  handleRequestUpgradeClick,
  handleUpdateProfileClick,
  refreshAccountData,
} from './account-session.js';
import { bindOrderDetailEvents, handleOrderListClick } from './order-detail.js';
import {
  handleAuthModeClick,
  handleAuthModeKeydown,
  handleLoginSubmit,
  handlePasswordToggleClick,
  handlePlanCardClick,
  handlePlanCardKeydown,
  handleRegisterSubmit,
  handleTabClick,
  loadPlansForGuest,
} from './forms.js';
import { bindManagerEvents } from './manager-bindings.js';
import {
  initLanguage,
} from '../../../shared/i18n/app.js';
import { initAppLoader } from '../../../shared/ui/loader.js';
import {
  hideStartupSplash,
  waitForStartupSplashMinVisible,
} from '../../../shared/ui/startup-splash.js';
import { initDatePickers } from '../../contracts/date-pickers.js';

function bindEvents() {
  bindNavigationEvents();
  refs.registerForm?.addEventListener('submit', handleRegisterSubmit);
  refs.loginForm?.addEventListener('submit', handleLoginSubmit);
  refs.guestPanel?.addEventListener('click', handlePasswordToggleClick);
  refs.guestLanguageButtons.forEach(button => button.addEventListener('click', handleGuestLanguageClick));
  refs.authModeButtons.forEach(button => {
    button.addEventListener('click', handleAuthModeClick);
    button.addEventListener('keydown', handleAuthModeKeydown);
  });
  refs.logoutBtn?.addEventListener('click', handleLogoutClick);
  refs.settingsLogoutBtn?.addEventListener('click', handleLogoutClick);
  refs.deleteAccountBtn?.addEventListener('click', handleDeleteAccountClick);
  refs.updateProfileBtn?.addEventListener('click', handleUpdateProfileClick);
  refs.requestUpgradeBtn?.addEventListener('click', handleRequestUpgradeClick);
  refs.accountLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.settingsLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.adminLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.planCards?.addEventListener('click', handlePlanCardClick);
  refs.planCards?.addEventListener('keydown', handlePlanCardKeydown);
  refs.planSelect?.addEventListener('change', event => {
    setAuthMode('register');
    syncSelectedPlan(event.target.value);
  });
  refs.statsHistoryDateFilter?.addEventListener('change', event => {
    setOrdersDateFilter(event.target.value);
    renderAuthenticatedState();
  });
  refs.statsHistoryDateResetBtn?.addEventListener('click', () => {
    setOrdersDateFilter('');
    renderAuthenticatedState();
  });
  refs.ordersList?.addEventListener('click', handleOrderListClick);
  refs.statsHistoryList?.addEventListener('click', handleOrderListClick);
  refs.statsTabButtons.forEach(button => {
    button.addEventListener('click', () => activateStatsTab(button.dataset.statsTabTarget));
  });
  refs.tabButtons.forEach(button => button.addEventListener('click', handleTabClick));
  bindManagerEvents(refreshAccountData, loadPlansForGuest);
  bindOrderDetailEvents();
  window.addEventListener('pdf-app:order-created', event => {
    if (event?.detail?.refresh === false) return;
    refreshAccountData();
  });
  window.addEventListener('pdf-app:language-changed', () => {
    syncLanguageSelects();
    renderPlans();
    renderGuestContext();
    renderAuthenticatedState();
  });
}

export async function initAuthPage() {
  if (!refs.hub) return;

  initAppLoader();
  initLanguage();
  syncInitialRouteState();
  initDatePickers(document);
  if (!state.ordersDateFilter) {
    setOrdersDateFilter(getTodayLocalDateKey());
  }
  bindEvents();
  syncLanguageSelects();
  setAuthMode(state.authMode);
  activateTab(state.activeTab);
  activateStatsTab(state.activeStatsTab);

  try {
    await loadPlansForGuest();
    await refreshAccountData();
  } finally {
    await waitForStartupSplashMinVisible();
    hideStartupSplash();
  }
}

window.addEventListener('beforeunload', unbindNavigationEvents);

export function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}

export async function refreshAuthPanel() {
  await refreshAccountData();
}
