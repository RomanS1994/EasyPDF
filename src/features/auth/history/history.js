import { refs } from './refs.js';
import { state } from './state.js';
import {
  normalizeHistorySort,
  normalizeHistoryTab,
  syncHistorySortControl,
} from '../orders/orders.js';

function setHistorySortMenuOpen(isOpen, { focusTrigger = false } = {}) {
  if (refs.statsHistorySortMenu) {
    refs.statsHistorySortMenu.hidden = !isOpen;
  }

  if (refs.statsHistorySortField) {
    refs.statsHistorySortField.classList.toggle('is-open', isOpen);
  }

  if (refs.statsHistorySortTrigger) {
    refs.statsHistorySortTrigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  if (focusTrigger && refs.statsHistorySortTrigger) {
    refs.statsHistorySortTrigger.focus();
  }
}

function toggleHistorySortMenu() {
  const isOpen = Boolean(refs.statsHistorySortMenu?.hidden);
  setHistorySortMenuOpen(isOpen, { focusTrigger: false });

  if (isOpen) {
    const selectedOption = Array.from(refs.statsHistorySortOptions || []).find(
      option => option.dataset.historySortOption === state.ordersHistorySort,
    );
    (selectedOption || refs.statsHistorySortOptions?.[0])?.focus();
  }
}

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

  syncHistorySortControl(state.ordersHistorySort);
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

  refs.statsHistorySortTrigger?.addEventListener('click', event => {
    event.preventDefault();
    toggleHistorySortMenu();
  });

  refs.statsHistorySortMenu?.addEventListener('click', event => {
    const option = event.target.closest('[data-history-sort-option]');
    if (!option) return;

    const nextSort = option.dataset.historySortOption;
    if (!nextSort) return;

    setOrdersHistorySort(nextSort);
    setHistorySortMenuOpen(false, { focusTrigger: true });
    renderAuthenticatedState?.();
  });

  document.addEventListener(
    'pointerdown',
    event => {
      if (!refs.statsHistorySortField?.contains(event.target)) {
        setHistorySortMenuOpen(false);
      }
    },
    true,
  );

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !refs.statsHistorySortMenu?.hidden) {
      setHistorySortMenuOpen(false, { focusTrigger: true });
    }
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

  syncHistorySortControl(state.ordersHistorySort);
}
