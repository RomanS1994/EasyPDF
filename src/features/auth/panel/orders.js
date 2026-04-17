import { getCurrentLocale, t } from '../../../shared/i18n/app.js';
import { refs } from './refs.js';
import { state } from './state.js';
import { escapeHtml, formatOrderStatusLabel } from './formatters.js';

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
    <li class="orderItem ${compact ? 'orderItem-compact' : ''} ${showOwner ? 'orderItem-admin' : ''}">
      <div class="orderItem-main">
        <strong>${escapeHtml(order.orderNumber || '-')}</strong>
        ${showOwner ? `<p class="orderItem-owner">${escapeHtml(ownerLabel)}</p>` : ''}
        <p>${escapeHtml(customerName)}</p>
        <p>${escapeHtml(route || t('route_not_set'))}</p>
      </div>
      <div class="orderItem-meta">
        <span>${escapeHtml(totalPrice)}</span>
        <span>${escapeHtml(createdAt)}</span>
        <span class="orderStatus">${escapeHtml(statusLabel)}</span>
      </div>
    </li>
  `;
}

export function renderOrderList(listElement, emptyElement, orders, options = {}) {
  if (!listElement || !emptyElement) return;

  const items = options.limit ? orders.slice(0, options.limit) : orders;

  if (!items.length) {
    listElement.innerHTML = '';
    emptyElement.hidden = false;
    if (options.emptyText) {
      emptyElement.textContent = options.emptyText;
    }
    return;
  }

  emptyElement.hidden = true;
  listElement.innerHTML = items.map(order => buildOrderMarkup(order, options)).join('');
}

export function getSelectedManagerContextUser() {
  return (
    state.managerSelectedUser ||
    state.managerUsers.find(user => user.id === state.managerSelectedUserId) ||
    null
  );
}
