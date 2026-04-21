import { getCurrentLanguage, syncPageMeta } from '../../../shared/i18n/app.js';
import { refs, STATS_TAB_NAMES, TAB_NAMES } from './refs.js';
import { state } from './state.js';

export function getShellRouteConfig() {
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
    history: '/cz/pdf/history/',
    account: '/cz/pdf/account/',
    settings: '/cz/pdf/settings/',
  };
}

export function getTabForPath(pathname) {
  const routes = getShellRouteConfig();
  const matchedTab = Object.entries(routes).find(([, routePath]) => routePath === pathname)?.[0] || null;
  return matchedTab;
}

export function activateTab(tabName = 'home') {
  const nextTab = TAB_NAMES.includes(tabName) ? tabName : 'home';
  state.activeTab = nextTab;

  refs.tabButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.tabTarget === nextTab);
  });

  refs.tabScreens.forEach(screen => {
    screen.classList.toggle('is-active', screen.dataset.tabScreen === nextTab);
  });
}

function notifyTabActivated(tabName) {
  window.dispatchEvent(
    new CustomEvent('pdf-app:tab-activated', {
      detail: { tab: tabName },
    }),
  );
}

export function activateStatsTab(tabName = 'usage') {
  const nextTab = STATS_TAB_NAMES.includes(tabName) ? tabName : 'usage';
  state.activeStatsTab = nextTab;

  refs.statsTabButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.statsTabTarget === nextTab);
  });

  refs.statsTabScreens.forEach(screen => {
    screen.classList.toggle('is-active', screen.dataset.statsTabScreen === nextTab);
  });
}

export function navigateToTab(tabName, pathname) {
  if (!TAB_NAMES.includes(tabName)) return;

  document.body.dataset.appTab = tabName;
  activateTab(tabName);
  syncPageMeta(getCurrentLanguage());
  notifyTabActivated(tabName);

  if (window.location.pathname !== pathname) {
    window.history.pushState({ appTab: tabName }, '', pathname);
  }
}

function handleTabPopState() {
  const nextTab = getTabForPath(window.location.pathname);
  if (!nextTab) return;

  document.body.dataset.appTab = nextTab;
  activateTab(nextTab);
  syncPageMeta(getCurrentLanguage());
  notifyTabActivated(nextTab);
}

export function bindNavigationEvents() {
  window.addEventListener('popstate', handleTabPopState);
}

export function unbindNavigationEvents() {
  window.removeEventListener('popstate', handleTabPopState);
}

export function syncInitialRouteState() {
  const nextTab = getTabForPath(window.location.pathname);
  if (!nextTab) return;

  document.body.dataset.appTab = nextTab;
  activateTab(nextTab);
  syncPageMeta(getCurrentLanguage());
}
