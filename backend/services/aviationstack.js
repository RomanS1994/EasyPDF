import { nowIso } from '../validation/common.js';

const DEFAULT_BASE_URL = 'https://api.aviationstack.com/v1';
const DEFAULT_TIMEOUT_MS = 6000;

function normalizeFlightNumber(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

function formatFlightNumber(value) {
  const normalized = normalizeFlightNumber(value);

  if (!normalized) {
    return '';
  }

  return normalized.replace(/^([A-Z0-9]{2})(\d.*)$/, '$1 $2');
}

function toIsoString(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function toPositiveInteger(value) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function addMinutes(isoValue, minutes) {
  const date = new Date(isoValue);

  if (Number.isNaN(date.getTime()) || !minutes) {
    return '';
  }

  date.setUTCMinutes(date.getUTCMinutes() + minutes);
  return date.toISOString();
}

function getAviationstackApiKey() {
  return String(process.env.AVIATIONSTACK_API_KEY || '').trim();
}

function getAviationstackBaseUrl() {
  return String(process.env.AVIATIONSTACK_BASE_URL || DEFAULT_BASE_URL).trim() || DEFAULT_BASE_URL;
}

function getAviationstackTimeoutMs() {
  const configured = Number.parseInt(String(process.env.AVIATIONSTACK_TIMEOUT_MS || ''), 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_TIMEOUT_MS;
}

function normalizeFlightDate(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : '';
}

function buildFlightsUrl(flightNumber, { flightDate = '' } = {}) {
  const baseUrl = getAviationstackBaseUrl().replace(/\/+$/, '');
  const url = new URL(`${baseUrl}/flights`);

  url.searchParams.set('access_key', getAviationstackApiKey());
  url.searchParams.set('flight_iata', normalizeFlightNumber(flightNumber));
  url.searchParams.set('limit', '1');

  const normalizedFlightDate = normalizeFlightDate(flightDate);

  if (normalizedFlightDate) {
    url.searchParams.set('flight_date', normalizedFlightDate);
  }

  return url;
}

function createAviationstackError(payload) {
  const message = payload?.error?.info || payload?.error?.message || 'aviationstack API error';
  const error = new Error(message);
  error.code = payload?.error?.code || '';
  return error;
}

function normalizeFlightStatus(value, arrivalDelay) {
  const status = String(value || '').trim().toLowerCase();

  if (status === 'landed') return 'landed';
  if (status === 'cancelled') return 'cancelled';
  if (arrivalDelay > 0) return 'delayed';
  if (status === 'active') return 'in_air';
  if (status === 'scheduled') return 'scheduled';

  return 'unknown';
}

export function normalizeAviationstackFlight(record, fallbackFlightNumber) {
  if (!record || typeof record !== 'object') {
    return {
      status: 'unknown',
      flightNumber: formatFlightNumber(fallbackFlightNumber),
      route: {
        from: '',
        to: '',
        fromCode: '',
        toCode: '',
      },
      scheduledArrival: '',
      estimatedArrival: '',
      actualArrival: '',
      delayMinutes: 0,
      terminal: '',
      baggageClaim: '',
      updatedAt: nowIso(),
    };
  }

  const arrival = record.arrival && typeof record.arrival === 'object' ? record.arrival : {};
  const departure = record.departure && typeof record.departure === 'object' ? record.departure : {};
  const flight = record.flight && typeof record.flight === 'object' ? record.flight : {};
  const arrivalDelay = toPositiveInteger(arrival.delay);
  const scheduledArrival = toIsoString(arrival.scheduled);
  const estimatedArrival =
    toIsoString(arrival.estimated) ||
    toIsoString(arrival.estimated_runway) ||
    addMinutes(scheduledArrival, arrivalDelay);
  const actualArrival = toIsoString(arrival.actual) || toIsoString(arrival.actual_runway);

  return {
    status: normalizeFlightStatus(record.flight_status, arrivalDelay),
    flightNumber: formatFlightNumber(flight.iata || fallbackFlightNumber),
    route: {
      from: String(departure.airport || departure.iata || '').trim(),
      to: String(arrival.airport || arrival.iata || '').trim(),
      fromCode: String(departure.iata || '').trim().toUpperCase(),
      toCode: String(arrival.iata || '').trim().toUpperCase(),
    },
    scheduledArrival,
    estimatedArrival,
    actualArrival,
    delayMinutes: arrivalDelay,
    terminal: String(arrival.terminal || '').trim(),
    baggageClaim: String(arrival.baggage || '').trim(),
    updatedAt: nowIso(),
  };
}

async function requestFlightStatus(flightNumber, options, signal) {
  const response = await fetch(buildFlightsUrl(flightNumber, options), {
    method: 'GET',
    signal,
  });
  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (payload?.error) {
    throw createAviationstackError(payload);
  }

  if (!response.ok) {
    throw new Error(`aviationstack request failed with ${response.status}`);
  }

  const flight = Array.isArray(payload?.data) ? payload.data[0] : null;
  return normalizeAviationstackFlight(flight, flightNumber);
}

export async function fetchAviationstackFlightStatus(flightNumber, { flightDate = '' } = {}) {
  const normalizedFlightNumber = normalizeFlightNumber(flightNumber);

  if (!getAviationstackApiKey() || !normalizedFlightNumber) {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), getAviationstackTimeoutMs());
  const normalizedFlightDate = normalizeFlightDate(flightDate);

  try {
    try {
      return await requestFlightStatus(
        normalizedFlightNumber,
        { flightDate: normalizedFlightDate },
        controller.signal
      );
    } catch (error) {
      if (normalizedFlightDate && error?.code === 'function_access_restricted') {
        return await requestFlightStatus(normalizedFlightNumber, {}, controller.signal);
      }

      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}
