const DEFAULT_NEXT = '/cz/pdf/';
const prefersReducedMotion =
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || false;
const SPLASH_DELAY_MS = prefersReducedMotion ? 120 : 1300;
const SPLASH_EXIT_MS = prefersReducedMotion ? 0 : 240;

function resolveNextUrl() {
  try {
    const url = new URL(window.location.href);
    const nextPath = url.searchParams.get('next');
    if (nextPath && nextPath.startsWith('/')) {
      const nextUrl = new URL(nextPath, window.location.origin);
      nextUrl.searchParams.set('startupSplash', 'skip');
      return nextUrl;
    }
  } catch {
    // Ignore malformed URLs and fall back to the app entry point.
  }

  const fallbackUrl = new URL(DEFAULT_NEXT, window.location.origin);
  fallbackUrl.searchParams.set('startupSplash', 'skip');
  return fallbackUrl;
}

function startSplashRedirect() {
  window.setTimeout(() => {
    document.body.classList.add('is-leaving');

    window.setTimeout(() => {
      window.location.replace(resolveNextUrl().toString());
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
