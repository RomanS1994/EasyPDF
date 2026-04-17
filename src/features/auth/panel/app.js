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
  handleUpdateProfileClick,
  refreshAccountData,
} from './account-session.js';
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
import { initAppLoader, setBootLoaderActive } from '../../../shared/ui/loader.js';

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
  bindManagerEvents(refreshAccountData, loadPlansForGuest);
  window.addEventListener('pdf-app:order-created', () => {
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
