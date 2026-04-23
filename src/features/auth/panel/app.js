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
  setHistoryDateFilter,
  setOrdersHistorySort,
  setOrdersHistoryTab,
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
  handleAccountAvatarButtonClick,
  handleAccountAvatarChange,
  handleAccountAvatarRemoveClick,
  handleLogoutClick,
  handleRequestUpgradeClick,
  handleUpdateAccountClick,
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
  handleSettingsNavClick,
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
  refs.saveAccountProfileBtn?.addEventListener('click', handleUpdateAccountClick);
  refs.accountAvatarButton?.addEventListener('click', handleAccountAvatarButtonClick);
  refs.accountAvatarInput?.addEventListener('change', handleAccountAvatarChange);
  refs.accountAvatarRemoveBtn?.addEventListener('click', handleAccountAvatarRemoveClick);
  refs.updateProfileBtn?.addEventListener('click', handleUpdateProfileClick);
  refs.requestUpgradeBtn?.addEventListener('click', handleRequestUpgradeClick);
  refs.accountLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.settingsLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.adminLanguageSelect?.addEventListener('change', handleLanguageSelectChange);
  refs.planCards?.addEventListener('click', handlePlanCardClick);
  refs.planCards?.addEventListener('keydown', handlePlanCardKeydown);
  refs.settingsNavButtons.forEach(button => button.addEventListener('click', handleSettingsNavClick));
  refs.planSelect?.addEventListener('change', event => {
    setAuthMode('register');
    syncSelectedPlan(event.target.value);
  });
  refs.statsHistoryDateFilter?.addEventListener('change', event => {
    setHistoryDateFilter(event.target.value);
    renderAuthenticatedState();
  });
  refs.statsHistorySortSelect?.addEventListener('change', event => {
    setOrdersHistorySort(event.target.value);
    renderAuthenticatedState();
  });
  refs.statsHistoryTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      setOrdersHistoryTab(button.dataset.historyTabTarget);
      renderAuthenticatedState();
    });
  });
  refs.statsHistoryDateResetBtn?.addEventListener('click', () => {
    setHistoryDateFilter('');
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
  window.addEventListener('pdf-app:order-created', () => {
    void refreshAccountData();
  });
  window.addEventListener('pdf-app:tab-activated', event => {
    if (!state.user || !['stats', 'history', 'settings', 'account'].includes(event.detail?.tab)) return;

    void refreshAccountData();
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
