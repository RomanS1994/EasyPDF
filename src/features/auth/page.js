import { getStoredSession } from '../../shared/lib/session-storage.js';
import {
  activateStatsTab,
  activateTab,
  bindShellEvents,
  syncInitialRouteState,
} from './shell/routes.js';
import { refs as shellRefs } from './shell/refs.js';
import { state as shellState } from './shell/state.js';
import { state as guestState } from './guest/state.js';
import { state as ordersState } from './orders/state.js';
import { state as statsState } from './stats/state.js';
import { setOrdersDateFilter, getTodayLocalDateKey } from './orders/orders.js';
import { bindGuestEvents, loadPlansForGuest } from './guest/forms.js';
import { setAuthMode, syncLanguageSelects } from './guest/guest.js';
import { bindAccountEvents, refreshAccountData } from './account/account-session.js';
import { bindOrderDetailEvents } from './orders/order-detail.js';
import { bindHistoryEvents } from './history/history.js';
import { bindStatsEvents } from './stats/stats.js';
import { bindManagerEvents } from '../manager/manager-bindings.js';
import { renderAuthenticatedState } from './account/dashboard.js';
import { initLanguage } from '../../shared/i18n/app.js';
import { initAppLoader } from '../../shared/ui/loader.js';
import {
  hideStartupSplash,
  waitForStartupSplashMinVisible,
} from '../../shared/ui/startup-splash.js';

export async function initAuthPage() {
  if (!shellRefs.hub) return;

  initAppLoader();
  initLanguage();
  syncInitialRouteState();

  if (!ordersState.ordersDateFilter) {
    setOrdersDateFilter(getTodayLocalDateKey());
  }

  bindShellEvents();
  bindGuestEvents(renderAuthenticatedState);
  bindAccountEvents(refreshAccountData);
  bindOrderDetailEvents();
  bindHistoryEvents(renderAuthenticatedState);
  bindStatsEvents();
  bindManagerEvents(refreshAccountData, loadPlansForGuest);

  syncLanguageSelects();
  setAuthMode(guestState.authMode);
  activateTab(shellState.activeTab);
  activateStatsTab(statsState.activeStatsTab);

  try {
    await loadPlansForGuest();
    await refreshAccountData();
  } finally {
    await waitForStartupSplashMinVisible();
    hideStartupSplash();
  }
}

export function hasAuthenticatedSession() {
  return Boolean(getStoredSession()?.token);
}
