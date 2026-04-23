import { refs } from './refs.js';
import { state } from './state.js';
import { normalizeHistorySort, normalizeHistoryTab } from '../orders/orders.js';

export function setHistoryDateFilter(dateValue = '') {
  state.ordersHistoryDateFilter = dateValue || '';

  if (refs.statsHistoryDateFilter) {
    refs.statsHistoryDateFilter.value = state.ordersHistoryDateFilter;
  }
}

export function setOrdersHistoryTab(tabName = 'all') {
  state.ordersHistoryTab = normalizeHistoryTab(tabName);
}

export function setOrdersHistorySort(sortName = 'newest') {
  state.ordersHistorySort = normalizeHistorySort(sortName);

  if (refs.statsHistorySortSelect) {
    refs.statsHistorySortSelect.value = state.ordersHistorySort;
  }
}

export function bindHistoryEvents(renderAuthenticatedState) {
  refs.statsHistoryDateFilter?.addEventListener('change', event => {
    setHistoryDateFilter(event.target.value);
    renderAuthenticatedState?.();
  });
  refs.statsHistorySortSelect?.addEventListener('change', event => {
    setOrdersHistorySort(event.target.value);
    renderAuthenticatedState?.();
  });
  refs.statsHistoryTabButtons.forEach(button => {
    button.addEventListener('click', () => {
      setOrdersHistoryTab(button.dataset.historyTabTarget);
      renderAuthenticatedState?.();
    });
  });
  refs.statsHistoryDateResetBtn?.addEventListener('click', () => {
    setHistoryDateFilter('');
    renderAuthenticatedState?.();
  });
}
