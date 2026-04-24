import { state as accountState } from '../account/state.js';
import { state as managerState } from '../../manager/state.js';
import { syncSelectedManagerOrderFromCollections } from '../../manager/manager-render.js';
import { setStoredManagerSelectedOrderId } from '../../manager/manager-storage.js';
import { isManagerRole } from '../shell/shell.js';
import { archiveOrder } from '../../orders/api.js';
import { t } from '../../../shared/i18n/app.js';
import { buildOrderStatusSummary, localizeRole } from '../../../shared/lib/formatters.js';
import { notifyText } from '../../../shared/ui/toast.js';
import { refs } from './refs.js';
import { state } from './state.js';
import { closeOrderTransferScreen, openOrderTransferScreen } from './order-transfer.js';
import { isOrderActionsOpen, syncOrderOverlayScrollLock } from './overlay.js';

function normalizeText(value) {
  return String(value || '').trim();
}

function getOrderRouteLabel(order) {
  const from = normalizeText(order?.trip?.from);
  const to = normalizeText(order?.trip?.to);

  if (!from || !to) {
    return t('route_not_added');
  }

  return `${from} → ${to}`;
}

function getOrderCustomerLabel(order) {
  return (
    normalizeText(order?.customer?.name) ||
    normalizeText(order?.customer?.email) ||
    normalizeText(order?.customer?.phone) ||
    t('client_not_specified')
  );
}

function setOrderActionsVisibility(isVisible) {
  if (!refs.orderActionsModal) return;

  refs.orderActionsModal.classList.toggle('is-open', isVisible);
  refs.orderActionsModal.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

  if (isVisible) {
    refs.orderActionsModal.removeAttribute('hidden');
  } else {
    refs.orderActionsModal.setAttribute('hidden', '');
  }

  syncOrderOverlayScrollLock();
}

function isBackendUnavailableError(error) {
  const status = Number(error?.status || 0);

  if (status === 503 || status === 504) {
    return true;
  }

  if (!status && typeof error?.message === 'string') {
    return /failed to fetch|networkerror|network request failed/i.test(error.message);
  }

  return false;
}

function clearTransferSelection() {
  state.orderTransferSelectedUserId = '';
  state.orderTransferSelectedUser = null;
  state.orderTransferSearch = '';
}

function removeOrderFromManagerCollections(orderId, ownerId = '') {
  managerState.managerOrders = managerState.managerOrders.filter(order => order.id !== orderId);
  managerState.managerSelectedOrders = managerState.managerSelectedOrders.filter(order => order.id !== orderId);
  managerState.managerOrdersSummary = buildOrderStatusSummary(managerState.managerOrders);

  if (managerState.managerSelectedOrderId === orderId || managerState.managerSelectedOrder?.id === orderId) {
    managerState.managerSelectedOrderId = '';
    managerState.managerSelectedOrder = null;
    setStoredManagerSelectedOrderId('');
  } else {
    syncSelectedManagerOrderFromCollections();
  }

  if (ownerId && managerState.managerSelectedUserId && managerState.managerSelectedUserId === ownerId) {
    managerState.managerSelectedUser = managerState.managerSelectedUser
      ? {
          ...managerState.managerSelectedUser,
          totalOrders: Math.max((managerState.managerSelectedUser.totalOrders || 0) - 1, 0),
        }
      : managerState.managerSelectedUser;
    managerState.managerSelectedOrders = managerState.managerSelectedOrders.filter(order => order.id !== orderId);
  }
}

function removeOrderFromLocalCollections(order) {
  const orderId = order?.id || '';
  if (!orderId) return;

  const ownerId = normalizeText(order.userId || order.user?.id);

  accountState.orders = accountState.orders.filter(item => item.id !== orderId);
  removeOrderFromManagerCollections(orderId, ownerId);
}

export function openOrderActions(order, { origin = 'detail' } = {}) {
  if (!order?.id) return;

  state.orderActionsOrder = order;
  state.orderActionsOrderId = order.id;
  state.orderActionsOrigin = origin;
  state.orderActionsLoading = false;
  state.orderActionsError = '';
  clearTransferSelection();
  closeOrderTransferScreen({ preserveSelection: false });
  state.orderActionsVisible = true;
  setOrderActionsVisibility(true);
  renderOrderActions();
}

export function closeOrderActions({ preserveTransferSelection = false } = {}) {
  if (state.orderActionsLoading || state.orderTransferSubmitting) {
    return;
  }

  state.orderActionsVisible = false;
  state.orderActionsOrigin = '';
  state.orderActionsOrderId = '';
  state.orderActionsOrder = null;
  state.orderActionsLoading = false;
  state.orderActionsError = '';

  if (!preserveTransferSelection) {
    clearTransferSelection();
  }

  closeOrderTransferScreen({ preserveSelection: preserveTransferSelection });
  setOrderActionsVisibility(false);
  renderOrderActions();
}

export function renderOrderActions() {
  const order = state.orderActionsOrder;
  const canTransfer = isManagerRole(accountState.user?.role);
  const isBusy = state.orderActionsLoading;

  if (!refs.orderActionsModal) return;

  if (!order) {
    if (state.orderActionsVisible) {
      closeOrderActions({ preserveTransferSelection: false });
    }
    return;
  }

  if (refs.orderActionsTitle) {
    refs.orderActionsTitle.textContent = order.orderNumber || t('order_actions_title');
  }

  if (refs.orderActionsDescription) {
    refs.orderActionsDescription.textContent = state.orderActionsError || (isBusy ? t('deleting_order') : t('order_delete_prompt'));
  }

  if (refs.orderActionsOrderNumber) {
    refs.orderActionsOrderNumber.textContent = order.orderNumber || '-';
  }

  if (refs.orderActionsOrderCustomer) {
    refs.orderActionsOrderCustomer.textContent = getOrderCustomerLabel(order);
  }

  if (refs.orderActionsOrderRoute) {
    refs.orderActionsOrderRoute.textContent = getOrderRouteLabel(order);
  }

  if (refs.orderActionsDeleteBtn) {
    refs.orderActionsDeleteBtn.disabled = isBusy;
    refs.orderActionsDeleteBtn.textContent = isBusy ? t('deleting_order') : t('delete_from_list');
  }

  if (refs.orderActionsCancelBtn) {
    refs.orderActionsCancelBtn.disabled = isBusy;
  }

  if (refs.orderActionsTransferBtn) {
    refs.orderActionsTransferBtn.disabled = !canTransfer || isBusy;
  }

  if (refs.orderActionsTransferHint) {
    refs.orderActionsTransferHint.textContent = canTransfer
      ? t('order_transfer_backend_note')
      : t('order_transfer_requires_manager');
  }

  if (refs.orderActionsTransferPreview) {
    const hasTarget = Boolean(state.orderTransferSelectedUser);
    refs.orderActionsTransferPreview.classList.toggle('is-hidden', !hasTarget);

    if (hasTarget && refs.orderActionsTransferPreviewName) {
      refs.orderActionsTransferPreviewName.textContent =
        state.orderTransferSelectedUser?.name || t('no_name');
    }

    if (hasTarget && refs.orderActionsTransferPreviewMeta) {
      refs.orderActionsTransferPreviewMeta.textContent = `${state.orderTransferSelectedUser?.email || '-'} · ${localizeRole(state.orderTransferSelectedUser?.role || 'user')}`;
    }
  }

  setOrderActionsVisibility(Boolean(state.orderActionsVisible));
}

function handleActionOverlayKeydown(event) {
  if (
    event.key !== 'Escape' ||
    !isOrderActionsOpen() ||
    state.orderTransferVisible ||
    state.orderActionsLoading ||
    state.orderTransferSubmitting
  ) {
    return;
  }

  closeOrderActions({ preserveTransferSelection: false });
}

function handleActionStateChange() {
  if (state.orderActionsVisible) {
    renderOrderActions();
  }
}

export async function handleDeleteOrderFromList() {
  const order = state.orderActionsOrder;
  if (!order?.id || state.orderActionsLoading) return;

  state.orderActionsLoading = true;
  state.orderActionsError = '';
  renderOrderActions();

  try {
    const response = await archiveOrder(order.id);
    removeOrderFromLocalCollections(response.order || order);
    state.orderActionsLoading = false;
    closeOrderActions({ preserveTransferSelection: false });
    window.dispatchEvent(new CustomEvent('pdf-app:orders-data-changed'));
    notifyText(t('order_removed_from_list'), 'success');
  } catch (error) {
    if (isBackendUnavailableError(error)) {
      removeOrderFromLocalCollections(order);
      state.orderActionsLoading = false;
      closeOrderActions({ preserveTransferSelection: false });
      window.dispatchEvent(new CustomEvent('pdf-app:orders-local-changed'));
      notifyText(t('order_removed_locally_backend_unavailable'), 'info');
      return;
    }

    state.orderActionsLoading = false;
    state.orderActionsError = error.message || t('delete_order_failed');
    renderOrderActions();
    notifyText(state.orderActionsError, 'error');
  }
}

function handleTransferButtonClick() {
  if (!isManagerRole(accountState.user?.role)) {
    notifyText(t('order_transfer_requires_manager'), 'error');
    return;
  }

  state.orderActionsError = '';
  renderOrderActions();
  void openOrderTransferScreen();
}

export function bindOrderActionEvents() {
  refs.orderActionsBackdrop?.addEventListener('click', () => closeOrderActions({ preserveTransferSelection: false }));
  refs.orderActionsCloseBtn?.addEventListener('click', () => closeOrderActions({ preserveTransferSelection: false }));
  refs.orderActionsCancelBtn?.addEventListener('click', () => closeOrderActions({ preserveTransferSelection: false }));
  refs.orderActionsDeleteBtn?.addEventListener('click', handleDeleteOrderFromList);
  refs.orderActionsTransferBtn?.addEventListener('click', handleTransferButtonClick);

  window.addEventListener('keydown', handleActionOverlayKeydown);
  window.addEventListener('pdf-app:order-transfer-selected', handleActionStateChange);
  window.addEventListener('pdf-app:order-transfer-reset', handleActionStateChange);
}

export function isOrderActionOverlayOpen() {
  return state.orderActionsVisible || state.orderTransferVisible;
}
