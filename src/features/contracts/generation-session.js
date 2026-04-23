import { t } from '../../shared/i18n/app.js';
import { contractRefs } from './selectors.js';
import { getShellRouteConfig, navigateToTab } from '../auth/shell/routes.js';

const SESSION_STORAGE_KEY = 'pdf-app-generation-session';
const SESSION_WINDOW_MS = 10 * 60 * 1000;

const state = {
  gateVisible: false,
  gateBusy: false,
  gateConfirmedAction: null,
  gateIntent: 'order-reserve',
  sessionDismissed: false,
  focusTarget: null,
  pointerId: null,
  swipeProgress: 0,
  swipeCompleted: false,
  timerId: 0,
};

function isOrdersRoute() {
  return document.body?.dataset?.appTab === 'orders';
}

function getNow() {
  return Date.now();
}

function safeParseSession(rawSession) {
  const normalized = normalizeStoredSession(rawSession);
  return normalized?.session || null;
}

function normalizeStoredSession(rawSession, { includeExpired = false } = {}) {
  if (!rawSession || typeof rawSession !== 'object') return null;
  const hasOrderId = Boolean(String(rawSession.orderId || '').trim());
  const hasAccessGrant = rawSession.accessGranted === true;
  if (!hasOrderId && !hasAccessGrant) return null;

  const expiresAt = Number(new Date(rawSession.expiresAt || '').getTime());
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return null;

  const expired = expiresAt <= getNow();
  if (expired && !includeExpired) return null;

  return {
    expired,
    session: {
      accessGranted: hasAccessGrant || hasOrderId,
      orderId: String(rawSession.orderId || ''),
      orderNumber: String(rawSession.orderNumber || ''),
      documentType: String(rawSession.documentType || 'confirmation'),
      contractData:
        rawSession.contractData && typeof rawSession.contractData === 'object'
          ? rawSession.contractData
          : {},
      createdAt: String(rawSession.createdAt || ''),
      expiresAt: new Date(expiresAt).toISOString(),
    },
  };
}

function readStoredSession() {
  const snapshot = readStoredSessionSnapshot();
  return snapshot.expired ? null : snapshot.session;
}

function readStoredSessionSnapshot() {
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || 'null');
    const snapshot = normalizeStoredSession(raw, { includeExpired: true });

    if (!snapshot && raw) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    return snapshot || { expired: false, session: null };
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return { expired: false, session: null };
  }
}

function writeStoredSession(session) {
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

function getActiveSession() {
  return readStoredSession();
}

function setHidden(element, isHidden) {
  if (!element) return;

  element.hidden = isHidden;
  element.setAttribute('aria-hidden', isHidden ? 'true' : 'false');
  element.classList.toggle('is-open', !isHidden);
}

function updateBodyScrollLock() {
  const gateVisible = Boolean(getGateVisible());
  document.body?.classList.toggle('no-scroll', gateVisible);
}

function getGateVisible() {
  return state.gateVisible;
}

function getSessionVisible() {
  const session = getActiveSession();
  return Boolean(session && isOrdersRoute() && !state.sessionDismissed);
}

function startSessionTimer() {
  if (state.timerId) return;

  state.timerId = window.setInterval(() => {
    const snapshot = readStoredSessionSnapshot();
    const session = snapshot.session;

    if (snapshot.expired) {
      markGenerationSessionExpired();
      return;
    }

    if (!session) {
      stopSessionTimer();
      syncLayerVisibility();
      return;
    }

    const remainingMs = Math.max(0, new Date(session.expiresAt).getTime() - getNow());
    if (remainingMs <= 0) {
      markGenerationSessionExpired();
      return;
    }

    renderSessionCountdown();
  }, 1000);
}

function stopSessionTimer() {
  if (!state.timerId) return;

  window.clearInterval(state.timerId);
  state.timerId = 0;
}

function formatCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');

  return `${minutes}:${seconds}`;
}

function getCountdownProgress(remainingMs) {
  return Math.max(0, Math.min(1, remainingMs / SESSION_WINDOW_MS));
}

function focusElement(element) {
  if (!element || typeof element.focus !== 'function') return;
  window.requestAnimationFrame(() => {
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }
  });
}

function rememberFocus() {
  const activeElement = document.activeElement;
  state.focusTarget =
    activeElement && typeof activeElement.focus === 'function'
      ? activeElement
      : null;
}

function restoreFocus() {
  const target = state.focusTarget;
  state.focusTarget = null;

  if (target && target.isConnected) {
    focusElement(target);
  }
}

function renderGateSwipe() {
  const progress = state.swipeCompleted ? 1 : state.swipeProgress;
  const track = contractRefs.generationGateSwipe;
  const handle = contractRefs.generationGateSwipeHandle;
  const handleWidth = handle?.offsetWidth || 38;
  const maxOffset = Math.max(0, (track?.clientWidth || 0) - handleWidth - 10);

  if (contractRefs.generationGateSwipeFill) {
    contractRefs.generationGateSwipeFill.style.width = `${progress * 100}%`;
  }

  if (track) {
    track.style.setProperty('--swipe-offset', `${Math.round(maxOffset * progress)}px`);
  }

  if (handle) {
    const offset = Math.round(maxOffset * progress);
    handle.style.transform = `translate3d(${offset}px, -50%, 0)`;
    handle.setAttribute(
      'aria-pressed',
      state.swipeCompleted ? 'true' : 'false',
    );
    handle.disabled = state.gateBusy || state.swipeCompleted;
  }

  if (track) {
    track.classList.toggle('is-complete', state.swipeCompleted);
    track.classList.toggle('is-busy', state.gateBusy);
  }
}

function renderSessionCountdown() {
  const session = getActiveSession();

  if (!session) {
    if (contractRefs.generationSessionCountdownValue) {
      contractRefs.generationSessionCountdownValue.textContent = '00:00';
    }
    if (contractRefs.generationSessionCountdownRing) {
      contractRefs.generationSessionCountdownRing.style.setProperty('--countdown-progress', '0%');
    }
    return;
  }

  const remainingMs = Math.max(0, new Date(session.expiresAt).getTime() - getNow());
  const countdown = formatCountdown(remainingMs);

  if (contractRefs.generationSessionCountdownValue) {
    contractRefs.generationSessionCountdownValue.textContent = countdown;
  }

  if (contractRefs.generationSessionCountdownRing) {
    contractRefs.generationSessionCountdownRing.style.setProperty(
      '--countdown-progress',
      `${getCountdownProgress(remainingMs) * 100}%`,
    );
  }
}

function syncLayerVisibility() {
  const snapshot = readStoredSessionSnapshot();
  const session = snapshot.session;

  if (snapshot.expired) {
    markGenerationSessionExpired();
    return;
  }

  const shouldShowGate = getGateVisible();
  const shouldShowSession = Boolean(session && getSessionVisible());

  setHidden(contractRefs.generationGateModal, !shouldShowGate);
  setHidden(contractRefs.generationSessionModal, !shouldShowSession);
  updateBodyScrollLock();
  renderGateSwipe();
  renderSessionCountdown();

  if (session) {
    startSessionTimer();
  } else if (!session) {
    stopSessionTimer();
  }
}

function emitEvent(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

function emitSessionChanged() {
  emitEvent('pdf-app:generation-session-changed', {
    session: getActiveSession(),
  });
}

function resetSwipeState({ preserveVisibility = true } = {}) {
  state.swipeProgress = 0;
  state.swipeCompleted = false;
  state.gateBusy = false;

  if (contractRefs.generationGateSwipeHandle) {
    contractRefs.generationGateSwipeHandle.style.transform = 'translate3d(0, -50%, 0)';
  }

  if (contractRefs.generationGateSwipeFill) {
    contractRefs.generationGateSwipeFill.style.width = '0%';
  }

  if (contractRefs.generationGateSwipe) {
    contractRefs.generationGateSwipe.style.setProperty('--swipe-offset', '0px');
  }

  if (preserveVisibility) {
    renderGateSwipe();
  } else {
    syncLayerVisibility();
  }
}

function confirmSwipe() {
  if (state.gateBusy || state.swipeCompleted) return;

  state.swipeCompleted = true;
  state.swipeProgress = 1;
  state.gateBusy = true;
  renderGateSwipe();
  emitEvent('pdf-app:token-gate-confirmed', {
    intent: state.gateIntent,
  });

  const action = state.gateConfirmedAction;
  state.gateConfirmedAction = null;
  if (typeof action === 'function') {
    action();
  }
}

function closeGate({ restore = true } = {}) {
  state.gateVisible = false;
  state.gateBusy = false;
  state.gateConfirmedAction = null;
  state.gateIntent = 'order-reserve';
  resetSwipeState({ preserveVisibility: true });
  syncLayerVisibility();

  if (restore) {
    restoreFocus();
  }
}

function handleRouteChange() {
  syncLayerVisibility();
}

function handleEscape(event) {
  if (event.key !== 'Escape') return;

  if (getGateVisible()) {
    closeGate();
  }
}

function handleSwipePointerDown(event) {
  if (!getGateVisible() || state.gateBusy) return;

  const handle = contractRefs.generationGateSwipeHandle;
  const track = contractRefs.generationGateSwipe;
  if (!handle || !track) return;

  state.pointerId = event.pointerId;
  state.swipeProgress = 0;
  state.swipeCompleted = false;
  handle.setPointerCapture?.(event.pointerId);
  renderGateSwipe();
}

function updateSwipeFromPointer(event) {
  if (state.pointerId !== event.pointerId || !contractRefs.generationGateSwipe) return;

  const track = contractRefs.generationGateSwipe;
  const handleWidth = contractRefs.generationGateSwipeHandle?.offsetWidth || 38;
  const rect = track.getBoundingClientRect();
  const available = Math.max(1, rect.width - handleWidth);
  const raw = event.clientX - rect.left - handleWidth / 2;
  const progress = Math.max(0, Math.min(1, raw / available));

  state.swipeProgress = progress;
  renderGateSwipe();
}

function finishSwipe(event) {
  if (state.pointerId !== event.pointerId) return;

  try {
    contractRefs.generationGateSwipeHandle?.releasePointerCapture?.(event.pointerId);
  } catch {
    // Ignore pointer capture cleanup errors.
  }

  state.pointerId = null;

  if (state.swipeProgress >= 0.9) {
    confirmSwipe();
    return;
  }

  resetSwipeState({ preserveVisibility: true });
}

function handleSwipeKeydown(event) {
  if (!getGateVisible() || state.gateBusy) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;

  event.preventDefault();
  confirmSwipe();
}

function bindGateEvents() {
  contractRefs.generationGateBackdrop?.addEventListener('click', () => closeGate());
  contractRefs.generationGateCloseBtn?.addEventListener('click', () => closeGate());
  contractRefs.generationGateLaterBtn?.addEventListener('click', () => closeGate());
  contractRefs.generationGateSwipeHandle?.addEventListener('pointerdown', handleSwipePointerDown);
  contractRefs.generationGateSwipeHandle?.addEventListener('pointermove', updateSwipeFromPointer);
  contractRefs.generationGateSwipeHandle?.addEventListener('pointerup', finishSwipe);
  contractRefs.generationGateSwipeHandle?.addEventListener('pointercancel', finishSwipe);
  contractRefs.generationGateSwipeHandle?.addEventListener('keydown', handleSwipeKeydown);

  window.addEventListener('pointermove', updateSwipeFromPointer);
  window.addEventListener('pointerup', finishSwipe);
}

function bindGlobalEvents() {
  window.addEventListener('pdf-app:tab-activated', handleRouteChange);
  window.addEventListener('pdf-app:language-changed', syncLayerVisibility);
  window.addEventListener('keydown', handleEscape);
  window.addEventListener('resize', () => {
    if (!getGateVisible()) return;
    renderGateSwipe();
  });
}

export function initOrderGenerationSession() {
  if (!contractRefs.generationGateModal && !contractRefs.generationSessionModal) return;

  bindGateEvents();
  bindGlobalEvents();
  syncLayerVisibility();
}

export function openGenerationGate({ onConfirmed = null, intent = 'order-reserve' } = {}) {
  rememberFocus();
  state.gateVisible = true;
  state.gateBusy = false;
  state.gateConfirmedAction = typeof onConfirmed === 'function' ? onConfirmed : null;
  state.gateIntent = intent;
  resetSwipeState({ preserveVisibility: true });
  syncLayerVisibility();
  focusElement(contractRefs.generationGateSwipeHandle || contractRefs.generationGateCloseBtn);
}

export function setGenerationGateBusy(isBusy) {
  state.gateBusy = Boolean(isBusy);
  renderGateSwipe();
}

export function resetGenerationGateSwipe() {
  resetSwipeState({ preserveVisibility: true });
}

export function closeGenerationGate(options = {}) {
  closeGate(options);
}

export function createGenerationAccessSession() {
  const createdAt = new Date().toISOString();

  return {
    accessGranted: true,
    orderId: '',
    orderNumber: '',
    documentType: 'confirmation',
    contractData: {},
    createdAt,
    expiresAt: new Date(Date.now() + SESSION_WINDOW_MS).toISOString(),
  };
}

export function openGenerationSession(session) {
  const normalizedSession = safeParseSession(session);
  if (!normalizedSession) return;

  rememberFocus();
  writeStoredSession(normalizedSession);
  state.sessionDismissed = false;
  syncLayerVisibility();
  emitSessionChanged();
}

export function clearGenerationSession() {
  clearStoredSession();
  state.sessionDismissed = false;
  stopSessionTimer();
  syncLayerVisibility();
  emitSessionChanged();
  restoreFocus();
}

export function getGenerationSession() {
  return getActiveSession();
}

export function hasGenerationSession() {
  return Boolean(getActiveSession());
}

export function isGenerationSessionExpired() {
  return Boolean(readStoredSessionSnapshot().expired);
}

export function getGenerationWindowMs() {
  return SESSION_WINDOW_MS;
}

export function markGenerationSessionExpired() {
  clearStoredSession();
  state.sessionDismissed = false;
  stopSessionTimer();
  syncLayerVisibility();
  emitSessionChanged();
  navigateToTab('home', getShellRouteConfig().home);
  emitEvent('pdf-app:generation-session-expired');
}
