export const TAB_NAMES =
  document.body.dataset.appShell === 'admin'
    ? ['accounts', 'subscriptions', 'orders', 'settings']
    : ['home', 'stats', 'orders', 'history', 'settings', 'account'];

export const STATS_TAB_NAMES = ['usage', 'activity'];
export const AUTH_MODES = ['login', 'register'];
