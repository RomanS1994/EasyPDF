import { getCurrentLanguage, syncPageMeta } from '../../../shared/i18n/app.js';
import { refs, STATS_TAB_NAMES, TAB_NAMES } from './refs.js';
import { state } from './state.js';

const SETTINGS_ROUTES = {
  hub: '/cz/pdf/admin/settings/',
  language: '/cz/pdf/admin/settings/language/',
  plans: '/cz/pdf/admin/settings/plans/',
  audit: '/cz/pdf/admin/settings/audit/',
};

const SETTINGS_PAGES = Object.keys(SETTINGS_ROUTES);

function normalizeRoutePath(pathname) {
  if (pathname === '/') return pathname;
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function getShellRouteConfig() {
  const shell = document.body.dataset.appShell;

  if (shell === 'admin') {
    return {
      accounts: '/cz/pdf/admin/accounts/',
      subscriptions: '/cz/pdf/admin/subscriptions/',
      orders: '/cz/pdf/admin/orders/',
      settings: SETTINGS_ROUTES.hub,
      settingsLanguage: SETTINGS_ROUTES.language,
      settingsPlans: SETTINGS_ROUTES.plans,
      settingsAudit: SETTINGS_ROUTES.audit,
    };
  }

  return {
    home: '/cz/pdf/',
    stats: '/cz/pdf/stats/',
    orders: '/cz/pdf/orders/',
    history: '/cz/pdf/history/',
    settings: '/cz/pdf/settings/',
    account: '/cz/pdf/account/',
  };
}

export function getTabForPath(pathname) {
  const routes = getShellRouteConfig();
  const normalizedPath = normalizeRoutePath(pathname);
  const matchedTab = Object.entries(routes).find(([, routePath]) => routePath === normalizedPath)?.[0] || null;
  if (!matchedTab) return null;

  if (matchedTab.startsWith('settings')) return 'settings';
  return matchedTab;
}

export function getSettingsPageForPath(pathname = window.location.pathname) {
  const normalizedPath = normalizeRoutePath(pathname);
  const matchedPage = Object.entries(SETTINGS_ROUTES).find(([, routePath]) => routePath === normalizedPath)?.[0];
  return matchedPage && SETTINGS_PAGES.includes(matchedPage) ? matchedPage : 'hub';
}

export function getSettingsPathForPage(page = 'hub') {
  return SETTINGS_ROUTES[page] || SETTINGS_ROUTES.hub;
}

function activateSettingsPage(pageName = 'hub') {
  const nextPage = SETTINGS_PAGES.includes(pageName) ? pageName : 'hub';
  state.activeSettingsPage = nextPage;
  document.body.dataset.appSettingsPage = nextPage;

  refs.settingsPages.forEach(page => {
    page.classList.toggle('is-hidden', page.dataset.settingsPage !== nextPage);
  });
}

export function activateTab(tabName = 'home', pathname = window.location.pathname) {
  const nextTab = TAB_NAMES.includes(tabName) ? tabName : 'home';
  state.activeTab = nextTab;

  refs.tabButtons.forEach(button => {
    button.classList.toggle('is-active', button.dataset.tabTarget === nextTab);
  });

  refs.tabScreens.forEach(screen => {
    screen.classList.toggle('is-active', screen.dataset.tabScreen === nextTab);
  });

  if (nextTab === 'settings') {
    activateSettingsPage(getSettingsPageForPath(pathname));
  } else {
    activateSettingsPage('hub');
  }
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
  activateTab(tabName, pathname);
  syncPageMeta(getCurrentLanguage());
  notifyTabActivated(tabName);

  if (window.location.pathname !== pathname) {
    window.history.pushState({ appTab: tabName, appSettingsPage: state.activeSettingsPage }, '', pathname);
  }
}

function handleTabPopState() {
  const nextTab = getTabForPath(window.location.pathname);
  if (!nextTab) return;

  document.body.dataset.appTab = nextTab;
  activateTab(nextTab, window.location.pathname);
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
  activateTab(nextTab, window.location.pathname);
  syncPageMeta(getCurrentLanguage());
}
