const LOADING_TEXT = 'Loading...';
const MIN_VISIBLE_MS = 250;

const state = {
  requestCount: 0,
  visibleSince: 0,
  hideTimer: 0,
};

function getOverlayRefs() {
  return {
    overlay: document.getElementById('loaderOverlay'),
    text: document.getElementById('loaderOverlayText'),
  };
}

function isActive() {
  return state.requestCount > 0;
}

function clearHideTimer() {
  if (state.hideTimer) {
    clearTimeout(state.hideTimer);
    state.hideTimer = 0;
  }
}

function renderLoader(isVisible) {
  const { overlay, text } = getOverlayRefs();
  if (!overlay) return;

  overlay.classList.toggle('is-active', isVisible);
  overlay.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

  if (text) {
    text.textContent = LOADING_TEXT;
  }
}

function getNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function updateLoaderState() {
  const active = isActive();

  if (active) {
    clearHideTimer();
    if (!state.visibleSince) {
      state.visibleSince = getNow();
    }
    renderLoader(true);
    return;
  }

  const elapsed = state.visibleSince ? getNow() - state.visibleSince : MIN_VISIBLE_MS;
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  if (remaining > 0) {
    renderLoader(true);
    clearHideTimer();
    state.hideTimer = setTimeout(() => {
      state.hideTimer = 0;
      state.visibleSince = 0;
      renderLoader(false);
    }, remaining);
    return;
  }

  clearHideTimer();
  state.visibleSince = 0;
  renderLoader(false);
}

export function initAppLoader() {
  updateLoaderState();
}

export function beginApiLoader() {
  state.requestCount += 1;
  updateLoaderState();
}

export function endApiLoader() {
  state.requestCount = Math.max(0, state.requestCount - 1);
  updateLoaderState();
}

async function waitForNextPaint() {
  if (
    typeof window === 'undefined' ||
    typeof window.requestAnimationFrame !== 'function'
  ) {
    return;
  }

  await new Promise(resolve => {
    window.requestAnimationFrame(() => resolve());
  });
}

export async function withAppLoader(task) {
  beginApiLoader();

  try {
    await waitForNextPaint();
    return await task();
  } finally {
    endApiLoader();
  }
}
