import { getRouteTab } from './shell.js';

export const state = {
  activeTab: getRouteTab(),
  activeSettingsPage: document.body?.dataset?.appSettingsPage || 'hub',
};
