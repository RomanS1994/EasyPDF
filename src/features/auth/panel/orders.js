import { getCurrentLocale, t } from '../../../shared/i18n/app.js';
import { refs } from './refs.js';
import { state } from './state.js';
import { escapeHtml, formatOrderStatusLabel } from './formatters.js';

function formatLocalDateKey(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayLocalDateKey() {
  return formatLocalDateKey(new Date());
}

export function setOrdersDateFilter(dateValue = '') {
  state.ordersDateFilter = dateValue || '';

  if (refs.ordersDateFilter) {
    refs.ordersDateFilter.value = state.ordersDateFilter;
  }

  if (refs.ordersDateFilterLabel) {
    refs.ordersDateFilterLabel.textContent = state.ordersDateFilter
      ? new Date(`${state.ordersDateFilter}T00:00:00`).toLocaleDateString(getCurrentLocale(), {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : t('all_dates');
  }
}

export function getFilteredOrders(orders = []) {
  if (!state.ordersDateFilter) return orders;

  return orders.filter(order => formatLocalDateKey(order.createdAt) === state.ordersDateFilter);
}

export function buildOrderMarkup(order, { compact = false, showOwner = false } = {}) {
  const createdAt = order.createdAt
    ? new Date(order.createdAt).toLocaleString(getCurrentLocale())
    : '-';
  const route = [order.trip?.from, order.trip?.to].filter(Boolean).join(' -> ');
  const customerName = order.customer?.name || t('no_customer_name');
  const totalPrice = order.totalPrice || t('no_total');
  const ownerLabel = order.user
    ? `${order.user.name || t('no_name')} · ${order.user.email || '-'}`
    : t('no_account');
  const statusLabel = formatOrderStatusLabel(order.status || 'created');

  return `
    <li class="orderItem ${compact ? 'orderItem-compact' : ''} ${showOwner ? 'orderItem-admin' : ''}" data-order-id="${escapeHtml(order.id || '')}">
      <div class="orderItem-head">
        <div class="orderItemIdentity">
          ${showOwner ? `<p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>` : ''}
          <strong class="orderItemCustomer">${escapeHtml(customerName)}</strong>
        </div>
      </div>
      <div class="orderItemRouteBlock">
        <span class="orderItemRouteLabel">${escapeHtml(t('route'))}</span>
        <p class="orderItemRoute">${escapeHtml(route || t('route_not_set'))}</p>
      </div>
      <div class="orderItem-foot">
        <div class="orderItemMetaGroup">
          <span class="orderItemMetaValue">${escapeHtml(totalPrice)}</span>
          <span class="orderItemMetaDate">${escapeHtml(createdAt)}</span>
        </div>
        ${compact ? '' : `<button type="button" class="orderItemOpenBtn" data-order-open="${escapeHtml(order.id || '')}">${escapeHtml(t('open_order'))}</button>`}
      </div>
    </li>
  `;
}

export function renderOrderList(listElement, emptyElement, orders, options = {}) {
  if (!listElement || !emptyElement) return;

  const filteredOrders = options.ignoreDateFilter ? orders : getFilteredOrders(orders);
  const items = options.limit ? filteredOrders.slice(0, options.limit) : filteredOrders;
  const selectedDateOrders = state.ordersDateFilter ? filteredOrders.length : orders.length;

  if (!items.length) {
    listElement.innerHTML = '';
    emptyElement.hidden = false;
    emptyElement.textContent = state.ordersDateFilter
      ? t('no_orders_for_date', { date: refs.ordersDateFilterLabel?.textContent || t('selected_date') })
      : options.emptyText || t('orders_empty_home');
    return;
  }

  emptyElement.hidden = true;
  listElement.innerHTML = items.map(order => buildOrderMarkup(order, options)).join('');

  if (!options.ignoreDateFilter && refs.ordersDateFilterLabel) {
    refs.ordersDateFilterLabel.title = state.ordersDateFilter
      ? `${selectedDateOrders} ${t('orders_count', { count: selectedDateOrders })}`
      : t('all_dates');
  }
}

export function getSelectedManagerContextUser() {
  return (
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null
  );
}
