import { getCurrentLocale, t } from '../i18n/app.js';

export function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function titleCase(value) {
  return String(value || '')
    .split(/[_\s.-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function localizeRole(value) {
  const key = `role_${value || 'user'}`;
  const translated = t(key);
  return translated !== key ? translated : titleCase(value || 'user');
}

export function localizeSubscriptionStatus(value) {
  const key = `subscription_${value || 'inactive'}`;
  const translated = t(key);
  return translated !== key ? translated : titleCase(value || '-');
}

export function localizeAuditAction(value) {
  const key = `audit_${String(value || 'system.event').replaceAll('.', '_')}`;
  const translated = t(key);
  return translated !== key ? translated : titleCase(value || 'system.event');
}

export function formatDateLabel(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString(getCurrentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeLabel(value) {
  if (!value) return '-';

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString(getCurrentLocale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCycleLabel(usage) {
  if (usage?.cycleLabel) return usage.cycleLabel;
  if (!usage?.periodStart || !usage?.periodEnd) return '-';
  return `${formatDateLabel(usage.periodStart)} - ${formatDateLabel(usage.periodEnd)}`;
}

export function isoToDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function categorizeOrderStatus(status) {
  const value = String(status || '').toLowerCase();

  if (value.includes('fail')) return 'failed';
  if (value === 'pdf_generated') return 'generated';
  return 'pending';
}

export function buildOrderStatusSummary(orders = []) {
  return orders.reduce(
    (summary, order) => {
      summary.all += 1;
      summary[categorizeOrderStatus(order.status)] += 1;
      return summary;
    },
    {
      all: 0,
      pending: 0,
      failed: 0,
      generated: 0,
    },
  );
}

export function formatOrderStatusLabel(status) {
  const value = String(status || '').trim();
  if (!value) return t('order_created');

  const translated = t(`order_${value}`);
  if (translated !== `order_${value}`) return translated;

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
