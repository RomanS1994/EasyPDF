import { refs } from './refs.js';
import { state } from './state.js';

export function isOrderOverlayOpen() {
  return Boolean(
    refs.orderDetailModal?.classList.contains('is-open') ||
      refs.orderActionsModal?.classList.contains('is-open') ||
      refs.orderTransferModal?.classList.contains('is-open'),
  );
}

export function syncOrderOverlayScrollLock() {
  document.body.classList.toggle('no-scroll', isOrderOverlayOpen());
}

export function isOrderActionsOpen() {
  return Boolean(state.orderActionsVisible);
}
