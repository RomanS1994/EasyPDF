export const ROLE_VALUES = ['user', 'manager', 'admin'];

export const SUBSCRIPTION_STATUS_VALUES = [
  'active',
  'pending',
  'trial',
  'paused',
  'canceled',
  'expired',
];

export function nowIso() {
  return new Date().toISOString();
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function normalizeText(value) {
  return String(value || '').trim();
}

export function normalizeInteger(value, fallback = null) {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(0, Math.round(next));
}

export function normalizePaginationParams(searchParams, { defaultLimit = 20, maxLimit = 50 } = {}) {
  const page = Math.max(1, normalizeInteger(searchParams.get('page'), 1));
  const limit = Math.min(
    maxLimit,
    Math.max(1, normalizeInteger(searchParams.get('limit'), defaultLimit))
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
}

export function toIsoDate(value) {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return `${value}T00:00:00.000Z`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

export function shiftMonths(isoDate, months) {
  const source = new Date(isoDate || nowIso());
  if (Number.isNaN(source.getTime())) {
    return nowIso();
  }

  source.setMonth(source.getMonth() + months);
  return source.toISOString();
}

export function formatDateShort(isoDate) {
  if (!isoDate) return '-';

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function isIsoWithinRange(targetIso, startIso, endIso) {
  if (!targetIso || !startIso || !endIso) return false;
  return targetIso >= startIso && targetIso <= endIso;
}
