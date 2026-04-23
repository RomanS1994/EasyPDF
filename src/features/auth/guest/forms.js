import { login, register } from '../api.js';
import { setStoredSession } from '../../../shared/lib/session-storage.js';
import { getPlans } from '../../plans/api.js';
import { refs } from './refs.js';
import { AUTH_MODES } from '../shell/constants.js';
import { getDefaultAuthMode, setFormDisabled } from '../shell/shell.js';
import { state } from './state.js';
import {
  focusAuthMode,
  handleGuestLanguageClick,
  renderGuestContext,
  renderPlans,
  setAuthMode,
  syncLanguageSelects,
  syncSelectedPlan,
} from './guest.js';
import { t } from '../../../shared/i18n/app.js';
import { notifyText } from '../../../shared/ui/toast.js';
import { withAppLoader } from '../../../shared/ui/loader.js';

function buildSplashRedirectUrl(nextPath = window.location.pathname) {
  const safeNextPath = nextPath.startsWith('/') ? nextPath : '/cz/pdf/';
  const url = new URL('/', window.location.origin);
  url.searchParams.set('next', safeNextPath);
  return url.toString();
}

function redirectThroughSplash(nextPath = window.location.pathname) {
  window.location.replace(buildSplashRedirectUrl(nextPath));
}

export async function loadPlansForGuest() {
  try {
    const data = await getPlans();
    state.plans = data.plans || [];
    if (!state.selectedPlanId) {
      state.selectedPlanId = state.plans[0]?.id || '';
    }
    renderPlans();
  } catch (error) {
    notifyText(error.message || t('load_plans_failed'), 'error');
  }
}

export async function handleRegisterSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.name || !payload.email || !payload.password) {
    notifyText(t('register_validation'), 'error');
    return;
  }

  await withAppLoader(async () => {
    setFormDisabled(refs.registerForm, true);

    try {
      const data = await register(payload);
      setStoredSession({ token: data.token, user: data.user });
      redirectThroughSplash(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    } catch (error) {
      notifyText(error.message || t('register_failed'), 'error');
    } finally {
      setFormDisabled(refs.registerForm, false);
    }
  });
}

export async function handleLoginSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.email || !payload.password) {
    notifyText(t('login_validation'), 'error');
    return;
  }

  await withAppLoader(async () => {
    setFormDisabled(refs.loginForm, true);

    try {
      const data = await login(payload);
      setStoredSession({ token: data.token, user: data.user });
      redirectThroughSplash(`${window.location.pathname}${window.location.search}${window.location.hash}`);
    } catch (error) {
      notifyText(error.message || t('sign_in_failed'), 'error');
    } finally {
      setFormDisabled(refs.loginForm, false);
    }
  });
}

function updatePasswordToggle(button, isVisible) {
  const nextLabel = isVisible ? t('hide_password') : t('show_password');

  button.setAttribute('aria-pressed', isVisible ? 'true' : 'false');
  button.setAttribute('aria-label', nextLabel);
}

function restoreSelection(input, selectionStart, selectionEnd) {
  if (selectionStart === null || selectionEnd === null) return;
  if (document.activeElement !== input) return;

  try {
    input.setSelectionRange(selectionStart, selectionEnd);
  } catch {
    // Some browsers reject selection restore while toggling password fields.
  }
}

export function handlePasswordToggleClick(event) {
  const button = event.target.closest('[data-password-toggle]');
  if (!button) return;

  const targetId = button.dataset.passwordTarget;
  const input = targetId ? document.getElementById(targetId) : button.closest('.authPasswordField')?.querySelector('input');
  if (!input) return;

  const selectionStart = input.selectionStart;
  const selectionEnd = input.selectionEnd;
  const nextType = input.type === 'password' ? 'text' : 'password';

  input.type = nextType;
  updatePasswordToggle(button, nextType === 'text');
  restoreSelection(input, selectionStart, selectionEnd);
}

export function handlePlanCardClick(event) {
  const card = event.target.closest('.planCard[data-plan-select]');
  if (!card) return;

  setAuthMode('register');
  syncSelectedPlan(card.dataset.planSelect, { scrollToForm: true });
}

export function handlePlanCardKeydown(event) {
  const card = event.target.closest('.planCard[data-plan-select]');
  if (!card) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();
  setAuthMode('register');
  syncSelectedPlan(card.dataset.planSelect, { scrollToForm: true });
}

export function handleAuthModeClick(event) {
  const button = event.target.closest('[data-auth-mode]');
  if (!button) return;

  setAuthMode(button.dataset.authMode || getDefaultAuthMode());
}

export function handleAuthModeKeydown(event) {
  const button = event.target.closest('[data-auth-mode]');
  if (!button) return;

  const currentIndex = AUTH_MODES.indexOf(button.dataset.authMode || '');
  if (currentIndex === -1) return;

  let nextMode = null;

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    nextMode = AUTH_MODES[(currentIndex + 1) % AUTH_MODES.length];
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    nextMode = AUTH_MODES[(currentIndex - 1 + AUTH_MODES.length) % AUTH_MODES.length];
  } else if (event.key === 'Home') {
    nextMode = AUTH_MODES[0];
  } else if (event.key === 'End') {
    nextMode = AUTH_MODES[AUTH_MODES.length - 1];
  }

  if (!nextMode) return;

  event.preventDefault();
  setAuthMode(nextMode);
  focusAuthMode(nextMode);
}

export function bindGuestEvents(renderAuthenticatedState) {
  refs.registerForm?.addEventListener('submit', handleRegisterSubmit);
  refs.loginForm?.addEventListener('submit', handleLoginSubmit);
  refs.guestPanel?.addEventListener('click', handlePasswordToggleClick);
  refs.guestLanguageButtons.forEach(button => button.addEventListener('click', handleGuestLanguageClick));
  refs.authModeButtons.forEach(button => {
    button.addEventListener('click', handleAuthModeClick);
    button.addEventListener('keydown', handleAuthModeKeydown);
  });
  refs.planCards?.addEventListener('click', handlePlanCardClick);
  refs.planCards?.addEventListener('keydown', handlePlanCardKeydown);
  refs.planSelect?.addEventListener('change', event => {
    setAuthMode('register');
    syncSelectedPlan(event.target.value);
  });
  window.addEventListener('pdf-app:language-changed', () => {
    syncLanguageSelects();
    renderPlans();
    renderGuestContext();
    renderAuthenticatedState?.();
  });
}
