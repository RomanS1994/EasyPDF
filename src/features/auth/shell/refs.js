export const refs = {
  hub: document.getElementById('accountHub') || document.querySelector('.appRoot'),
  guestPanel: document.getElementById('guestPanel'),
  accountPanel: document.getElementById('accountPanel'),
  tabButtons: document.querySelectorAll('[data-tab-target]'),
  tabScreens: document.querySelectorAll('[data-tab-screen]'),
  settingsPages: document.querySelectorAll('[data-settings-page]'),
  settingsNavButtons: document.querySelectorAll('[data-settings-target]'),
};
