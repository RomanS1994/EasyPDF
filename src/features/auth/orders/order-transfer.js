import { getManagerUsers } from '../../manager/api.js';
import { assignOrderDriver } from '../../orders/api.js';
import { t } from '../../../shared/i18n/app.js';
import { escapeHtml, localizeRole } from '../../../shared/lib/formatters.js';
import { notifyText } from '../../../shared/ui/toast.js';
import { refs } from './refs.js';
import { state } from './state.js';
import { syncOrderOverlayScrollLock } from './overlay.js';
import { isManagerRole } from '../shell/shell.js';
import { state as accountState } from '../account/state.js';

function normalizeText(value) {
  return String(value || '').trim();
}

function setOrderTransferVisibility(isVisible) {
  if (!refs.orderTransferModal) return;

  refs.orderTransferModal.classList.toggle('is-open', isVisible);
  refs.orderTransferModal.setAttribute('aria-hidden', isVisible ? 'false' : 'true');

  if (isVisible) {
    refs.orderTransferModal.removeAttribute('hidden');
  } else {
    refs.orderTransferModal.setAttribute('hidden', '');
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

function getOrderSummary(order) {
  if (!order) return '-';

  const number = order.orderNumber || t('order_detail');
  const route = [normalizeText(order.trip?.from), normalizeText(order.trip?.to)]
    .filter(Boolean)
    .join(' → ');

  return route ? `${number} · ${route}` : number;
}

function getFilteredUsers() {
  const query = normalizeText(state.orderTransferSearch).toLowerCase();
  const users = [...state.orderTransferUsers]
    .filter(user => user?.role !== 'admin')
    .filter(user => {
      const name = normalizeText(user?.name).toLowerCase();
      const email = normalizeText(user?.email).toLowerCase();
      if (!query) return true;
      return name.includes(query) || email.includes(query);
    })
    .sort((left, right) => {
      const leftName = normalizeText(left?.name || left?.email);
      const rightName = normalizeText(right?.name || right?.email);
      return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
    });

  return users;
}

function setTransferSummary(order) {
  if (refs.orderTransferTitle) {
    refs.orderTransferTitle.textContent = order?.orderNumber || t('transfer_to_another_driver');
  }

  if (refs.orderTransferDescription) {
    refs.orderTransferDescription.textContent = t('order_transfer_subline');
  }

  if (refs.orderTransferSummary) {
    refs.orderTransferSummary.classList.toggle('is-hidden', !order);
  }

  if (refs.orderTransferSummaryNumber) {
    refs.orderTransferSummaryNumber.textContent = order?.orderNumber || '-';
  }

  if (refs.orderTransferSummaryRoute) {
    refs.orderTransferSummaryRoute.textContent = getOrderSummary(order);
  }
}

function renderTransferStateNodes({ loading = false, error = '', listVisible = false, emptyVisible = false } = {}) {
  if (refs.orderTransferLoading) {
    refs.orderTransferLoading.hidden = !loading;
    refs.orderTransferLoading.classList.toggle('is-hidden', !loading);
  }

  if (refs.orderTransferError) {
    refs.orderTransferError.hidden = !error;
    refs.orderTransferError.classList.toggle('is-hidden', !error);
  }

  if (refs.orderTransferEmpty) {
    refs.orderTransferEmpty.hidden = !emptyVisible;
    refs.orderTransferEmpty.classList.toggle('is-hidden', !emptyVisible);
  }

  if (refs.orderTransferList) {
    refs.orderTransferList.hidden = !listVisible;
    refs.orderTransferList.classList.toggle('is-hidden', !listVisible);
  }
}

export function renderOrderTransferScreen() {
  const order = state.orderActionsOrder;
  const filteredUsers = getFilteredUsers();
  const canTransfer = isManagerRole(accountState.user?.role);
  const isBusy = state.orderTransferLoading || state.orderTransferSubmitting;
  const loadingLabel = state.orderTransferSubmitting
    ? t('order_transfer_applying')
    : t('order_transfer_loading');

  if (!refs.orderTransferModal) return;

  if (!order || !canTransfer) {
    renderTransferStateNodes({ loading: false, error: '', listVisible: false, emptyVisible: false });
    if (refs.orderTransferErrorMessage) {
      refs.orderTransferErrorMessage.textContent = canTransfer
        ? t('order_transfer_requires_order')
        : t('order_transfer_requires_manager');
    }
    if (refs.orderTransferError) {
      refs.orderTransferError.hidden = false;
      refs.orderTransferError.classList.remove('is-hidden');
    }
    if (refs.orderTransferConfirmBtn) {
      refs.orderTransferConfirmBtn.disabled = true;
      refs.orderTransferConfirmBtn.textContent = t('confirm_transfer');
    }
    if (refs.orderTransferBackBtn) {
      refs.orderTransferBackBtn.disabled = false;
    }
    if (refs.orderTransferSelected) {
      refs.orderTransferSelected.classList.add('is-hidden');
    }
    setOrderTransferVisibility(Boolean(state.orderTransferVisible));
    return;
  }

  setTransferSummary(order);

  if (refs.orderTransferSearchInput) {
    if (document.activeElement !== refs.orderTransferSearchInput) {
      refs.orderTransferSearchInput.value = state.orderTransferSearch;
    }
    refs.orderTransferSearchInput.disabled = isBusy;
  }

  if (refs.orderTransferClearBtn) {
    refs.orderTransferClearBtn.disabled = !state.orderTransferSearch || isBusy;
  }

  if (refs.orderTransferLoading) {
    refs.orderTransferLoading.innerHTML = `
      <div class="orderTransferLoadingInner">
        <span class="orderTransferSpinner" aria-hidden="true"></span>
        <span>${escapeHtml(loadingLabel)}</span>
      </div>
    `;
  }

  if (refs.orderTransferErrorMessage) {
    refs.orderTransferErrorMessage.textContent = state.orderTransferError || t('order_transfer_error');
  }

  const selectedUser = state.orderTransferSelectedUser;
  const selectedUserId = state.orderTransferSelectedUserId;
  const orderOwnerId = normalizeText(order.userId || order.user?.id);

  if (isBusy) {
    renderTransferStateNodes({ loading: true, error: '', listVisible: false, emptyVisible: false });
    if (refs.orderTransferEmpty) refs.orderTransferEmpty.hidden = true;
    if (refs.orderTransferList) refs.orderTransferList.innerHTML = '';
    if (refs.orderTransferSelected) refs.orderTransferSelected.classList.add('is-hidden');
    if (refs.orderTransferConfirmBtn) {
      refs.orderTransferConfirmBtn.disabled = true;
      refs.orderTransferConfirmBtn.textContent = loadingLabel;
    }
    if (refs.orderTransferBackBtn) {
      refs.orderTransferBackBtn.disabled = true;
    }
    setOrderTransferVisibility(Boolean(state.orderTransferVisible));
    return;
  }

  if (state.orderTransferError) {
    renderTransferStateNodes({ loading: false, error: state.orderTransferError, listVisible: false, emptyVisible: false });
    if (refs.orderTransferList) refs.orderTransferList.innerHTML = '';
    if (refs.orderTransferSelected) {
      refs.orderTransferSelected.classList.toggle('is-hidden', !selectedUser);
    }
    if (refs.orderTransferConfirmBtn) {
      refs.orderTransferConfirmBtn.disabled = !selectedUser;
      refs.orderTransferConfirmBtn.textContent = t('confirm_transfer');
    }
    if (refs.orderTransferBackBtn) {
      refs.orderTransferBackBtn.disabled = false;
    }
    setOrderTransferVisibility(Boolean(state.orderTransferVisible));
    return;
  }

  if (refs.orderTransferSelected) {
    refs.orderTransferSelected.classList.toggle('is-hidden', !selectedUser);
  }

  if (refs.orderTransferSelectedName) {
    refs.orderTransferSelectedName.textContent = selectedUser?.name || t('no_name');
  }

  if (refs.orderTransferSelectedMeta) {
    refs.orderTransferSelectedMeta.textContent = selectedUser
      ? `${selectedUser.email || '-'} · ${localizeRole(selectedUser.role || 'user')}`
      : t('order_transfer_no_selection');
  }

  if (refs.orderTransferConfirmBtn) {
    refs.orderTransferConfirmBtn.disabled = !selectedUser;
    refs.orderTransferConfirmBtn.textContent = t('confirm_transfer');
  }

  if (refs.orderTransferBackBtn) {
    refs.orderTransferBackBtn.disabled = false;
  }

  const visibleUsers = filteredUsers.filter(user => normalizeText(user?.id));

  if (!visibleUsers.length) {
    renderTransferStateNodes({ loading: false, error: '', listVisible: false, emptyVisible: true });
    if (refs.orderTransferEmpty) {
      refs.orderTransferEmpty.textContent = state.orderTransferSearch
        ? t('order_transfer_empty')
        : t('order_transfer_empty_default');
    }
    if (refs.orderTransferList) refs.orderTransferList.innerHTML = '';
    setOrderTransferVisibility(Boolean(state.orderTransferVisible));
    return;
  }

  renderTransferStateNodes({ loading: false, error: '', listVisible: true, emptyVisible: false });
  if (refs.orderTransferEmpty) refs.orderTransferEmpty.textContent = t('order_transfer_empty');

  if (refs.orderTransferList) {
    refs.orderTransferList.innerHTML = visibleUsers
      .map(user => {
        const isActive = selectedUserId === user.id;
        const isCurrentOwner = Boolean(orderOwnerId && user.id === orderOwnerId);
        const roleLabel = localizeRole(user.role || 'user');
        const usageLabel = user.usage
          ? `${user.usage.used || 0} / ${user.usage.limit || 0}`
          : '-';
        const rowLabel = isCurrentOwner ? t('current_driver') : roleLabel;

        return `
          <li class="managerUserItem ${isActive ? 'is-active' : ''}">
            <button
              type="button"
              class="managerUserButton"
              data-order-transfer-user-id="${escapeHtml(user.id)}"
              ${isCurrentOwner ? 'aria-disabled="true" disabled' : ''}
            >
              <div class="managerUserCopy">
                <strong>${escapeHtml(user.name || t('no_name'))}</strong>
                <p>${escapeHtml(user.email || '-')}</p>
              </div>
              <div class="managerUserMeta">
                <span>${escapeHtml(rowLabel)}</span>
                <span>${escapeHtml(usageLabel)}</span>
              </div>
            </button>
          </li>
        `;
      })
      .join('');
  }

  setOrderTransferVisibility(Boolean(state.orderTransferVisible));
}

async function loadOrderTransferUsers() {
  const requestId = state.orderTransferRequestId + 1;
  state.orderTransferRequestId = requestId;
  state.orderTransferLoading = true;
  state.orderTransferSubmitting = false;
  state.orderTransferError = '';
  renderOrderTransferScreen();

  try {
    const response = await getManagerUsers({
      role: 'all',
      status: 'all',
      planId: 'all',
    });

    if (state.orderTransferRequestId !== requestId) return;

    state.orderTransferUsers = Array.isArray(response.users) ? response.users : [];
    state.orderTransferLoaded = true;
    state.orderTransferLoading = false;
    state.orderTransferSubmitting = false;
    renderOrderTransferScreen();
  } catch (error) {
    if (state.orderTransferRequestId !== requestId) return;

    state.orderTransferLoading = false;
    state.orderTransferSubmitting = false;
    state.orderTransferError = error.message || t('order_transfer_error');
    renderOrderTransferScreen();
    notifyText(error.message || t('order_transfer_error'), 'error');
  }
}

export async function openOrderTransferScreen() {
  if (!isManagerRole(accountState.user?.role)) {
    notifyText(t('order_transfer_requires_manager'), 'error');
    return;
  }

  if (!state.orderActionsOrder?.id) {
    notifyText(t('order_transfer_requires_order'), 'error');
    return;
  }

  state.orderTransferVisible = true;
  state.orderTransferError = '';
  state.orderTransferLoading = true;
  state.orderTransferSubmitting = false;
  setOrderTransferVisibility(true);
  renderOrderTransferScreen();
  await loadOrderTransferUsers();
}

function clearTransferQuery() {
  state.orderTransferSearch = '';
  if (refs.orderTransferSearchInput) {
    refs.orderTransferSearchInput.value = '';
  }
  if (refs.orderTransferClearBtn) {
    refs.orderTransferClearBtn.disabled = true;
  }
}

export function closeOrderTransferScreen({ preserveSelection = false } = {}) {
  if (state.orderTransferSubmitting) {
    return;
  }

  state.orderTransferVisible = false;
  state.orderTransferLoading = false;
  state.orderTransferSubmitting = false;
  state.orderTransferError = '';

  if (!preserveSelection) {
    state.orderTransferSelectedUserId = '';
    state.orderTransferSelectedUser = null;
  }

  clearTransferQuery();
  state.orderTransferRequestId += 1;
  setOrderTransferVisibility(false);

  window.dispatchEvent(new CustomEvent('pdf-app:order-transfer-reset'));
  renderOrderTransferScreen();
}

function handleTransferSearchInput(event) {
  if (state.orderTransferLoading || state.orderTransferSubmitting) {
    return;
  }

  state.orderTransferSearch = event.target.value || '';
  if (refs.orderTransferClearBtn) {
    refs.orderTransferClearBtn.disabled = !state.orderTransferSearch;
  }
  renderOrderTransferScreen();
}

function handleTransferSelection(event) {
  if (state.orderTransferLoading || state.orderTransferSubmitting) {
    return;
  }

  const button = event.target.closest('[data-order-transfer-user-id]');
  if (!button || button.disabled) return;

  const nextUserId = button.dataset.orderTransferUserId || '';
  if (!nextUserId) return;

  const nextUser = state.orderTransferUsers.find(user => user.id === nextUserId) || null;
  if (!nextUser) return;

  state.orderTransferSelectedUserId = nextUser.id;
  state.orderTransferSelectedUser = nextUser;
  state.orderTransferError = '';
  clearTransferQuery();
  window.dispatchEvent(
    new CustomEvent('pdf-app:order-transfer-selected', {
      detail: {
        user: nextUser,
        orderId: state.orderActionsOrder?.id || '',
      },
    }),
  );
  renderOrderTransferScreen();
}

async function handleTransferConfirm() {
  if (!state.orderActionsOrder?.id || !state.orderTransferSelectedUser?.id || state.orderTransferSubmitting) {
    return;
  }

  state.orderTransferSubmitting = true;
  state.orderTransferError = '';
  renderOrderTransferScreen();

  try {
    const response = await assignOrderDriver(state.orderActionsOrder.id, {
      userId: state.orderTransferSelectedUser.id,
    });

    state.orderTransferSubmitting = false;
    state.orderActionsOrder = response.order || state.orderActionsOrder;
    closeOrderActions({ preserveTransferSelection: false });
    window.dispatchEvent(new CustomEvent('pdf-app:orders-data-changed'));
    notifyText(t('order_transfer_success'), 'success');
  } catch (error) {
    state.orderTransferSubmitting = false;
    if (isBackendUnavailableError(error)) {
      state.orderTransferError = t('order_transfer_backend_unavailable');
      renderOrderTransferScreen();
      notifyText(t('order_transfer_backend_unavailable'), 'info');
      return;
    }

    state.orderTransferError = error.message || t('order_transfer_failed');
    renderOrderTransferScreen();
    notifyText(state.orderTransferError, 'error');
  }
}

function handleTransferOverlayKeydown(event) {
  if (event.key !== 'Escape' || !state.orderTransferVisible) {
    return;
  }

  closeOrderTransferScreen({ preserveSelection: false });
}

export function bindOrderTransferEvents() {
  refs.orderTransferBackdrop?.addEventListener('click', () => closeOrderTransferScreen({ preserveSelection: false }));
  refs.orderTransferCloseBtn?.addEventListener('click', () => closeOrderTransferScreen({ preserveSelection: false }));
  refs.orderTransferBackBtn?.addEventListener('click', () => closeOrderTransferScreen({ preserveSelection: false }));
  refs.orderTransferClearBtn?.addEventListener('click', () => {
    if (state.orderTransferLoading || state.orderTransferSubmitting) {
      return;
    }

    state.orderTransferSearch = '';
    if (refs.orderTransferSearchInput) {
      refs.orderTransferSearchInput.value = '';
    }
    renderOrderTransferScreen();
  });
  refs.orderTransferSearchInput?.addEventListener('input', handleTransferSearchInput);
  refs.orderTransferList?.addEventListener('click', handleTransferSelection);
  refs.orderTransferConfirmBtn?.addEventListener('click', handleTransferConfirm);
  refs.orderTransferRetryBtn?.addEventListener('click', () => {
    state.orderTransferError = '';
    void loadOrderTransferUsers();
  });

  window.addEventListener('keydown', handleTransferOverlayKeydown);
}

export function getOrderTransferUsers() {
  return state.orderTransferUsers;
}
