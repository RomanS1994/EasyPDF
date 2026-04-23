import { getCurrentLocale, t } from '../../../shared/i18n/app.js';
import { refs } from './refs.js';
import { state as ordersState } from './state.js';
import { state as historyState } from '../history/state.js';
import { refs as historyRefs } from '../history/refs.js';
import { isAdminShell } from '../shell/shell.js';
import { escapeHtml } from '../../../shared/lib/formatters.js';

const ORDER_HISTORY_TABS = ['all', 'today', 'planned', 'completed'];
const ORDER_HISTORY_SORTS = ['newest', 'oldest', 'trip-date'];

function parseDateValue(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const normalized = String(value).trim();
  const parsedInput = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? `${normalized}T00:00:00`
    : /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(normalized)
      ? normalized.replace(' ', 'T')
      : normalized;
  const date = new Date(parsedInput);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatLocalDateKey(value) {
  const date = parseDateValue(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateFilterLabel(value) {
  if (!value) return t('all_dates');

  const date = parseDateValue(`${value}T00:00:00`);
  if (!date) return t('all_dates');

  return date.toLocaleDateString(getCurrentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatOrderDateTime(value) {
  const date = parseDateValue(value);
  if (!date) return '-';
  return date.toLocaleString(getCurrentLocale());
}

function normalizeTextValue(value) {
  return String(value || '').trim();
}

function getOrderRouteSeparator() {
  return isAdminShell() ? ' · ' : ' -> ';
}

function getOrderRouteLabel(order) {
  const from = normalizeTextValue(order.trip?.from);
  const to = normalizeTextValue(order.trip?.to);

  if (!from || !to) return t('route_not_added');
  return [from, to].join(getOrderRouteSeparator());
}

function getOrderCustomerLabel(order) {
  return normalizeTextValue(order.customer?.name) || t('client_not_specified');
}

function getOrderPriceLabel(order) {
  return normalizeTextValue(order.totalPrice) || t('no_price');
}

function getOrderHistoryBucket(order) {
  const todayKey = getTodayLocalDateKey();
  const tripKey = formatLocalDateKey(order.trip?.time);
  const createdKey = formatLocalDateKey(order.createdAt);
  const statusValue = normalizeTextValue(order.status).toLowerCase();

  if (statusValue.includes('fail')) {
    return {
      bucket: 'draft',
      label: t('orders_status_draft'),
    };
  }

  const referenceKey = tripKey || createdKey;
  if (referenceKey) {
    if (referenceKey === todayKey) {
      return {
        bucket: 'today',
        label: t('orders_status_today'),
      };
    }

    return {
      bucket: referenceKey > todayKey ? 'planned' : 'completed',
      label: referenceKey > todayKey ? t('orders_status_planned') : t('orders_status_completed'),
    };
  }

  if (statusValue === 'pdf_generated' || statusValue === 'completed') {
    return {
      bucket: 'completed',
      label: t('orders_status_completed'),
    };
  }

  return {
    bucket: 'draft',
    label: t('orders_status_draft'),
  };
}

function getOrderSortTimestamp(order, sortKey) {
  const primaryDate = sortKey === 'trip-date' ? order.trip?.time : order.createdAt;
  const fallbackDate = sortKey === 'trip-date' ? order.createdAt : order.trip?.time;
  return parseDateValue(primaryDate)?.getTime() ?? parseDateValue(fallbackDate)?.getTime() ?? 0;
}

function compareOrdersForSort(left, right, sortKey) {
  const leftTime = getOrderSortTimestamp(left, sortKey);
  const rightTime = getOrderSortTimestamp(right, sortKey);

  if (leftTime !== rightTime) {
    if (sortKey === 'newest') return rightTime - leftTime;
    return leftTime - rightTime;
  }

  return normalizeTextValue(left.orderNumber).localeCompare(normalizeTextValue(right.orderNumber));
}

export function normalizeHistoryTab(value) {
  return ORDER_HISTORY_TABS.includes(value) ? value : 'all';
}

export function normalizeHistorySort(value) {
  return ORDER_HISTORY_SORTS.includes(value) ? value : 'newest';
}

function syncHistoryControls(activeTab, activeSort, visibleCount, dateFilterValue) {
  if (historyRefs.statsHistorySummary) {
    historyRefs.statsHistorySummary.textContent = t('orders_count', { count: visibleCount });
  }

  if (historyRefs.statsHistorySortSelect && historyRefs.statsHistorySortSelect.value !== activeSort) {
    historyRefs.statsHistorySortSelect.value = activeSort;
  }

  if (historyRefs.statsHistoryDateFilter && historyRefs.statsHistoryDateFilter.value !== dateFilterValue) {
    historyRefs.statsHistoryDateFilter.value = dateFilterValue;
  }

  historyRefs.statsHistoryTabButtons.forEach(button => {
    const isActive = button.dataset.historyTabTarget === activeTab;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.tabIndex = isActive ? 0 : -1;
  });
}

export function getTodayLocalDateKey() {
  return formatLocalDateKey(new Date());
}

export function setOrdersDateFilter(dateValue = '') {
  ordersState.ordersDateFilter = dateValue || '';

  if (refs.ordersDateFilter) {
    refs.ordersDateFilter.value = ordersState.ordersDateFilter;
  }

  if (refs.ordersDateFilterLabel) {
    refs.ordersDateFilterLabel.textContent = ordersState.ordersDateFilter
      ? formatDateFilterLabel(ordersState.ordersDateFilter)
      : t('all_dates');
  }
}

export function getFilteredOrders(orders = [], dateFilter = ordersState.ordersDateFilter) {
  if (!dateFilter) return orders;

  return orders.filter(order => formatLocalDateKey(order.createdAt) === dateFilter);
}

function getHistoryDateKey(order) {
  return formatLocalDateKey(order.trip?.time || order.createdAt);
}

function buildCompactOrderMarkup(order, { showOwner = false } = {}) {
  const createdAt = formatOrderDateTime(order.createdAt);
  const route = getOrderRouteLabel(order);
  const customerName = getOrderCustomerLabel(order);
  const totalPrice = getOrderPriceLabel(order);
  const ownerLabel = order.user
    ? `${normalizeTextValue(order.user.name) || t('no_name')} · ${normalizeTextValue(order.user.email) || '-'}`
    : t('no_account');

  return `
    <li class="orderItem ${showOwner ? 'orderItem-admin' : ''}" data-order-id="${escapeHtml(order.id || '')}">
      <div class="orderItem-head">
        <div class="orderItemIdentity">
          ${showOwner ? `<p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>` : ''}
          <strong class="orderItemCustomer ${customerName === t('client_not_specified') ? 'is-placeholder' : ''}">${escapeHtml(customerName)}</strong>
        </div>
      </div>
      <div class="orderItemRouteBlock">
        <span class="orderItemRouteLabel">${escapeHtml(t('route'))}</span>
        <p class="orderItemRoute ${route === t('route_not_added') ? 'is-placeholder' : ''}">${escapeHtml(route)}</p>
      </div>
      <div class="orderItem-foot">
        <div class="orderItemMetaGroup">
          <span class="orderItemMetaValue ${totalPrice === t('no_price') ? 'is-placeholder' : ''}">${escapeHtml(totalPrice)}</span>
          <span class="orderItemMetaDate">${escapeHtml(createdAt)}</span>
        </div>
      </div>
    </li>
  `;
}

function buildHistoryOrderMarkup(order, { showOwner = false } = {}) {
  const status = getOrderHistoryBucket(order);
  const customerName = getOrderCustomerLabel(order);
  const route = getOrderRouteLabel(order);
  const totalPrice = getOrderPriceLabel(order);
  const dateTime = formatOrderDateTime(order.trip?.time || order.createdAt);
  const ownerLabel = order.user
    ? `${normalizeTextValue(order.user.name) || t('no_name')} · ${normalizeTextValue(order.user.email) || '-'}`
    : t('no_account');
  const ariaLabel = `${t('open_order')}: ${order.orderNumber || customerName}`;

  return `
    <li class="orderItem orderItem--history orderItem--${status.bucket}" data-order-id="${escapeHtml(order.id || '')}">
      <button type="button" class="orderItemButton orderItemButton-history" data-order-open="${escapeHtml(order.id || '')}" aria-label="${escapeHtml(ariaLabel)}">
        <div class="orderItemCard">
          <div class="orderItemHeader">
            <div class="orderItemIdentity">
              ${showOwner ? `<p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>` : ''}
              <strong class="orderItemCustomer ${customerName === t('client_not_specified') ? 'is-placeholder' : ''}">${escapeHtml(customerName)}</strong>
              <p class="orderItemRoute ${route === t('route_not_added') ? 'is-placeholder' : ''}">${escapeHtml(route)}</p>
            </div>
            <span class="orderStatusBadge orderStatusBadge--${status.bucket}">${escapeHtml(status.label)}</span>
          </div>
          <div class="orderItemMetaRow">
            <strong class="orderItemPrice ${totalPrice === t('no_price') ? 'is-placeholder' : ''}">${escapeHtml(totalPrice)}</strong>
            <span class="orderItemDate">${escapeHtml(dateTime)}</span>
            <span class="orderItemArrow" aria-hidden="true">
              <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
                <path d="M7.5 4.5 13 10l-5.5 5.5" />
              </svg>
            </span>
          </div>
        </div>
      </button>
    </li>
  `;
}

export function buildOrderMarkup(order, { compact = false, showOwner = false } = {}) {
  return compact
    ? buildCompactOrderMarkup(order, { showOwner })
    : buildHistoryOrderMarkup(order, { showOwner });
}

export function renderOrderList(listElement, emptyElement, orders, options = {}) {
  if (!listElement || !emptyElement) {
    return {
      totalCount: 0,
      filteredCount: 0,
      visibleCount: 0,
      visibleOrders: [],
    };
  }

  const isHistoryMode = Boolean(options.historyMode);
  const dateFilter = Object.prototype.hasOwnProperty.call(options, 'dateFilter')
    ? options.dateFilter || ''
    : isHistoryMode
      ? historyState.ordersHistoryDateFilter
      : ordersState.ordersDateFilter;
  const filteredByDate = options.ignoreDateFilter
    ? orders
    : isHistoryMode
      ? dateFilter
        ? orders.filter(order => getHistoryDateKey(order) === dateFilter)
        : orders
      : getFilteredOrders(orders, dateFilter);
  const historyTab = isHistoryMode ? normalizeHistoryTab(historyState.ordersHistoryTab) : 'all';
  const historySort = isHistoryMode ? normalizeHistorySort(historyState.ordersHistorySort) : 'newest';
  const filteredByTab = isHistoryMode && historyTab !== 'all'
    ? filteredByDate.filter(order => getOrderHistoryBucket(order).bucket === historyTab)
    : filteredByDate;
  const visibleOrders = isHistoryMode
    ? [...filteredByTab].sort((left, right) => compareOrdersForSort(left, right, historySort))
    : [...filteredByTab];
  const markupOptions = isHistoryMode
    ? options
    : {
        ...options,
        compact: Object.prototype.hasOwnProperty.call(options, 'compact')
          ? options.compact
          : true,
      };

  if (isHistoryMode) {
    syncHistoryControls(historyTab, historySort, visibleOrders.length, dateFilter);
  }

  if (!visibleOrders.length) {
    listElement.innerHTML = '';
    emptyElement.hidden = false;

    if (!orders.length) {
      emptyElement.textContent = options.emptyText || t('orders_empty_history');
    } else if (dateFilter && !filteredByDate.length) {
      emptyElement.textContent = t('no_orders_for_date', {
        date: formatDateFilterLabel(dateFilter),
      });
    } else if (isHistoryMode && historyTab !== 'all') {
      emptyElement.textContent = t('orders_empty_filtered');
    } else {
      emptyElement.textContent = options.emptyText || t('orders_empty_filtered');
    }

    return {
      totalCount: orders.length,
      filteredCount: filteredByDate.length,
      visibleCount: 0,
      visibleOrders: [],
    };
  }

  emptyElement.hidden = true;
  listElement.innerHTML = visibleOrders.map(order => buildOrderMarkup(order, markupOptions)).join('');

  return {
    totalCount: orders.length,
    filteredCount: filteredByDate.length,
    visibleCount: visibleOrders.length,
    visibleOrders,
  };
}
