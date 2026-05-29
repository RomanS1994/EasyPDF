import { fetchAviationstackFlightStatus } from './aviationstack.js';

const DEFAULT_CACHE_TTL_MINUTES = 10;
const DEFAULT_MAX_REFRESH_PER_REQUEST = 8;

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getCacheTtlMs() {
  const minutes = Number.parseInt(String(process.env.AVIATIONSTACK_CACHE_TTL_MINUTES || ''), 10);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_CACHE_TTL_MINUTES) * 60 * 1000;
}

function getMaxRefreshPerRequest() {
  const value = Number.parseInt(String(process.env.AVIATIONSTACK_MAX_REFRESH_PER_REQUEST || ''), 10);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MAX_REFRESH_PER_REQUEST;
}

function getFlightNumber(order) {
  return String(order?.flightNumber || order?.contractData?.flightNumber || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function getDatePart(value) {
  const text = String(value || '').trim();
  const directDate = text.match(/^(\d{4}-\d{2}-\d{2})/);

  if (directDate) {
    return directDate[1];
  }

  const date = new Date(text);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

function getFlightDate(order) {
  return (
    getDatePart(order?.trip?.time) ||
    getDatePart(order?.contractData?.trip?.time) ||
    getDatePart(order?.metadata?.flightStatus?.scheduledArrival) ||
    getDatePart(order?.metadata?.flightStatus?.estimatedArrival)
  );
}

function getStatusValue(flightStatus) {
  return String(flightStatus?.status || '').trim().toLowerCase();
}

function getDelayMinutes(flightStatus) {
  const parsed = Number.parseInt(String(flightStatus?.delayMinutes ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function hasUsefulTiming(flightStatus) {
  return Boolean(flightStatus?.actualArrival || flightStatus?.estimatedArrival || getDelayMinutes(flightStatus) > 0);
}

function normalizeFlightStatusValue(flightStatus) {
  if (!isPlainObject(flightStatus)) {
    return null;
  }

  if (getDelayMinutes(flightStatus) > 0 && getStatusValue(flightStatus) !== 'delayed') {
    return {
      ...flightStatus,
      status: 'delayed',
    };
  }

  return flightStatus;
}

function isWeakScheduledStatus(flightStatus) {
  const status = getStatusValue(flightStatus);
  return (status === 'scheduled' || status === 'unknown') && !hasUsefulTiming(flightStatus);
}

function isInformativeStatus(flightStatus) {
  const status = getStatusValue(flightStatus);
  return (
    status === 'landed' ||
    status === 'delayed' ||
    status === 'in_air' ||
    status === 'cancelled' ||
    hasUsefulTiming(flightStatus)
  );
}

function mergeFlightStatus(existingFlightStatus, nextFlightStatus) {
  const normalizedNextFlightStatus = normalizeFlightStatusValue(nextFlightStatus);

  if (!normalizedNextFlightStatus) {
    return null;
  }

  const normalizedExistingFlightStatus = normalizeFlightStatusValue(existingFlightStatus);

  if (
    isWeakScheduledStatus(normalizedNextFlightStatus) &&
    isInformativeStatus(normalizedExistingFlightStatus)
  ) {
    return {
      ...normalizedExistingFlightStatus,
      updatedAt: normalizedNextFlightStatus.updatedAt || normalizedExistingFlightStatus.updatedAt,
    };
  }

  return normalizedNextFlightStatus;
}

function normalizeCachedFlightStatus(metadata) {
  if (!isPlainObject(metadata?.flightStatus)) {
    return null;
  }

  const normalizedFlightStatus = normalizeFlightStatusValue(metadata.flightStatus);

  if (normalizedFlightStatus !== metadata.flightStatus) {
    return {
      ...(isPlainObject(metadata) ? metadata : {}),
      flightStatus: normalizedFlightStatus,
    };
  }

  return null;
}

function isFlightStatusFresh(metadata) {
  if (!isPlainObject(metadata?.flightStatus)) {
    return false;
  }

  const updatedAt = new Date(metadata.flightStatus.updatedAt || '');

  if (Number.isNaN(updatedAt.getTime())) {
    return false;
  }

  return Date.now() - updatedAt.getTime() < getCacheTtlMs();
}

async function refreshOrderFlightStatus(client, order) {
  const flightNumber = getFlightNumber(order);

  if (!flightNumber) {
    return order;
  }

  const normalizedMetadata = normalizeCachedFlightStatus(order.metadata);

  if (normalizedMetadata) {
    return client.order.update({
      where: {
        id: order.id,
      },
      data: {
        metadata: normalizedMetadata,
      },
      select: Object.fromEntries(Object.keys(order).map(key => [key, true])),
    });
  }

  if (isFlightStatusFresh(order.metadata)) {
    return order;
  }

  try {
    const flightStatus = await fetchAviationstackFlightStatus(flightNumber, {
      flightDate: getFlightDate(order),
    });

    if (!flightStatus) {
      return order;
    }

    const mergedFlightStatus = mergeFlightStatus(order.metadata?.flightStatus, flightStatus);

    const metadata = {
      ...(isPlainObject(order.metadata) ? order.metadata : {}),
      flightStatus: mergedFlightStatus,
    };

    return client.order.update({
      where: {
        id: order.id,
      },
      data: {
        metadata,
      },
      select: Object.fromEntries(Object.keys(order).map(key => [key, true])),
    });
  } catch (error) {
    console.warn(
      `Failed to refresh flight status for order ${order?.id || ''}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return order;
  }
}

export async function refreshFlightStatusesForOrders(client, orders, { enabled = false, limit } = {}) {
  if (!enabled || !Array.isArray(orders) || !orders.length) {
    return orders;
  }

  const maxRefresh = Number.isFinite(limit) && limit > 0 ? limit : getMaxRefreshPerRequest();
  const refreshTasksById = new Map();

  for (const order of orders) {
    if (refreshTasksById.size >= maxRefresh) {
      break;
    }

    if (!getFlightNumber(order) || isFlightStatusFresh(order.metadata)) {
      continue;
    }

    refreshTasksById.set(order.id, refreshOrderFlightStatus(client, order));
  }

  if (!refreshTasksById.size) {
    return orders;
  }

  const refreshedEntries = await Promise.all(
    Array.from(refreshTasksById.entries()).map(async ([orderId, task]) => [orderId, await task])
  );
  const refreshedById = new Map(refreshedEntries);

  return orders.map(order => refreshedById.get(order.id) || order);
}

export async function refreshFlightStatusForOrder(client, order, { enabled = false } = {}) {
  if (!enabled || !order) {
    return order;
  }

  return refreshOrderFlightStatus(client, order);
}
