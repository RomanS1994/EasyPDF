const CONTENT_NO_SCROLL_CLASS = 'content-no-scroll';

let observersInitialized = false;
let scheduledFrame = 0;
let currentLockedState = null;
let resizeObserver = null;

function getViewportHeight() {
  if (typeof window === 'undefined') return 0;

  return Math.ceil(
    window.visualViewport?.height ||
      window.innerHeight ||
      document.documentElement?.clientHeight ||
      0,
  );
}

function getContentHeight() {
  if (typeof document === 'undefined') return 0;

  const { body, documentElement } = document;

  return Math.max(
    body?.scrollHeight || 0,
    body?.offsetHeight || 0,
    documentElement?.scrollHeight || 0,
    documentElement?.offsetHeight || 0,
  );
}

function setContentScrollLock(isLocked) {
  if (typeof document === 'undefined') return;

  document.documentElement?.classList.toggle(CONTENT_NO_SCROLL_CLASS, isLocked);
  document.body?.classList.toggle(CONTENT_NO_SCROLL_CLASS, isLocked);
}

export function syncContentScrollLock() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (!document.body?.classList.contains('page-generateContract')) return;

  const viewportHeight = getViewportHeight();
  const contentHeight = getContentHeight();
  const shouldLock = contentHeight <= viewportHeight + 1;

  if (currentLockedState === shouldLock) return;
  currentLockedState = shouldLock;
  setContentScrollLock(shouldLock);
}

function scheduleContentScrollLockSync() {
  if (typeof window === 'undefined') return;
  if (scheduledFrame) return;

  scheduledFrame = window.requestAnimationFrame(() => {
    scheduledFrame = 0;
    syncContentScrollLock();
  });
}

export function initContentScrollLock() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (!document.body?.classList.contains('page-generateContract')) return;

  syncContentScrollLock();

  if (observersInitialized) return;
  observersInitialized = true;

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleContentScrollLockSync);
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);
  } else {
    window.addEventListener('resize', scheduleContentScrollLockSync, { passive: true });
  }

  window.addEventListener('orientationchange', scheduleContentScrollLockSync, {
    passive: true,
  });

  if (window.visualViewport?.addEventListener) {
    window.visualViewport.addEventListener('resize', scheduleContentScrollLockSync, {
      passive: true,
    });
  }

  window.addEventListener('load', scheduleContentScrollLockSync, { passive: true });
  scheduleContentScrollLockSync();
}
