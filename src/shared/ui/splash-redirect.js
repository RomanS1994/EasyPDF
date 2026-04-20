const DEFAULT_NEXT = '/cz/pdf/';
const prefersReducedMotion =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
const SPLASH_DELAY_MS = prefersReducedMotion ? 120 : 1300;
const SPLASH_EXIT_MS = prefersReducedMotion ? 0 : 240;

function resolveNextPath() {
  try {
    const url = new URL(window.location.href);
    const nextPath = url.searchParams.get('next');
    if (nextPath && nextPath.startsWith('/')) {
      return nextPath;
    }
  } catch {
    // Ignore malformed URLs and fall back to the app entry point.
  }

  return DEFAULT_NEXT;
}

function startSplashRedirect() {
  window.setTimeout(() => {
    document.body.classList.add('is-leaving');

    window.setTimeout(() => {
      window.location.replace(resolveNextPath());
    }, SPLASH_EXIT_MS);
  }, SPLASH_DELAY_MS);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startSplashRedirect, {
    once: true,
  });
} else {
  startSplashRedirect();
}
