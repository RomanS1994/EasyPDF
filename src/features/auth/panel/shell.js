import { refs, TAB_NAMES } from './refs.js';

export function isAdminShell() {
  return document.body.dataset.appShell === 'admin';
}

export function getRouteTab() {
  const routeTab = document.body.dataset.appTab || 'home';
  return TAB_NAMES.includes(routeTab) ? routeTab : 'home';
}

export function getDefaultAuthMode() {
  return 'login';
}

export function isManagerRole(role) {
  return role === 'manager' || role === 'admin';
}

export function setFormDisabled(form, disabled) {
  if (!form) return;
  Array.from(form.elements).forEach(element => {
    element.disabled = disabled;
  });
}

export function setGuestVisible(isVisible) {
  document.body.dataset.authState = isVisible ? 'guest' : 'session';
  refs.guestPanel?.classList.toggle('is-hidden', !isVisible);
  refs.accountPanel?.classList.toggle('is-hidden', isVisible);
}
