import { t } from './i18n/app.js';

const DEFAULT_MESSAGE_KEY = 'loading_data';

const state = {
  booting: false,
  requestCount: 0,
  requestMessageKey: DEFAULT_MESSAGE_KEY,
  manualCount: 0,
  manualMessageKey: DEFAULT_MESSAGE_KEY,
};

function getOverlayRefs() {
  return {
    overlay: document.getElementById('loaderOverlay'),
    text: document.getElementById('loaderOverlayText'),
  };
}

function getActiveMessageKey() {
  if (state.manualCount > 0) {
    return state.manualMessageKey;
  }

  if (state.booting || state.requestCount > 0) {
    return state.requestMessageKey;
  }

  return DEFAULT_MESSAGE_KEY;
}

function applyLoaderState() {
  const { overlay, text } = getOverlayRefs();
  if (!overlay) return;

  const isActive = state.booting || state.requestCount > 0 || state.manualCount > 0;
  overlay.classList.toggle('is-active', isActive);
  overlay.setAttribute('aria-hidden', isActive ? 'false' : 'true');

  if (text) {
    text.textContent = t(getActiveMessageKey());
  }
}

export function initAppLoader() {
  applyLoaderState();
}

export function setBootLoaderActive(isActive, messageKey = DEFAULT_MESSAGE_KEY) {
  state.booting = Boolean(isActive);
  state.requestMessageKey = messageKey || DEFAULT_MESSAGE_KEY;
  applyLoaderState();
}

export function beginApiLoader(messageKey = DEFAULT_MESSAGE_KEY) {
  state.requestCount += 1;
  if (state.manualCount === 0) {
    state.requestMessageKey = messageKey || DEFAULT_MESSAGE_KEY;
  }
  applyLoaderState();
}

export function endApiLoader() {
  state.requestCount = Math.max(0, state.requestCount - 1);
  if (state.requestCount === 0) {
    state.requestMessageKey = DEFAULT_MESSAGE_KEY;
  }
  applyLoaderState();
}

export function showAppLoader(messageKey = DEFAULT_MESSAGE_KEY) {
  state.manualCount += 1;
  state.manualMessageKey = messageKey || DEFAULT_MESSAGE_KEY;
  applyLoaderState();
}

export function hideAppLoader() {
  state.manualCount = Math.max(0, state.manualCount - 1);
  if (state.manualCount === 0) {
    state.manualMessageKey = DEFAULT_MESSAGE_KEY;
  }
  applyLoaderState();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pdf-app:language-changed', applyLoaderState);
}
