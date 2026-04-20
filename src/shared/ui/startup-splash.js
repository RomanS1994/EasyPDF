const prefersReducedMotion =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
const MIN_VISIBLE_MS = prefersReducedMotion ? 120 : 2000;

function getNow() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }

  return Date.now();
}

function getStartTime() {
  if (typeof window === 'undefined') return 0;

  return typeof window.__PDF_APP_STARTUP_SPLASH_AT__ === 'number'
    ? window.__PDF_APP_STARTUP_SPLASH_AT__
    : 0;
}

function delay(ms) {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms);
  });
}

export async function waitForStartupSplashMinVisible() {
  if (document.documentElement.dataset.startupSplash === 'skip') {
    return;
  }

  const startedAt = getStartTime();
  if (!startedAt) {
    return;
  }

  const elapsed = getNow() - startedAt;
  const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

  if (remaining > 0) {
    await delay(remaining);
  }
}

export function hideStartupSplash() {
  document.documentElement.dataset.startupSplash = 'skip';
}
