import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCachedOrRefreshFlightStatus,
  flightStatusCacheInternals,
} from './flight-status-cache.js';
import {
  refreshFlightStatusForOrder,
  refreshFlightStatusesForOrders,
} from './flight-status-refresh.js';
import { fetchAviationstackFlightStatus } from './aviationstack.js';

function getCacheKey(where) {
  const value = where?.flightNumber_flightDate || where;
  return `${value.flightNumber}:${value.flightDate}`;
}

class FakeFlightStatusCacheModel {
  constructor() {
    this.records = new Map();
  }

  async upsert({ where, create }) {
    const key = getCacheKey(where);

    if (!this.records.has(key)) {
      this.records.set(key, {
        ...create,
        payload: create.payload || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return { ...this.records.get(key) };
  }

  async findUnique({ where }) {
    const record = this.records.get(getCacheKey(where));
    return record ? { ...record } : null;
  }

  async updateMany({ where, data }) {
    const key = getCacheKey(where);
    const record = this.records.get(key);

    if (!record) {
      return { count: 0 };
    }

    const nextRefreshAt = record.nextRefreshAt && new Date(record.nextRefreshAt);
    const lockUntil = record.lockUntil && new Date(record.lockUntil);
    const canRefresh = nextRefreshAt && nextRefreshAt <= where.nextRefreshAt.lte;
    const lockExpired = !lockUntil || lockUntil <= where.OR[1].lockUntil.lte;

    if (!canRefresh || !lockExpired) {
      return { count: 0 };
    }

    this.records.set(key, {
      ...record,
      ...data,
      updatedAt: new Date(),
    });
    return { count: 1 };
  }

  async update({ where, data }) {
    const key = getCacheKey(where);
    const record = this.records.get(key);
    const updated = {
      ...record,
      ...data,
      updatedAt: new Date(),
    };
    this.records.set(key, updated);
    return { ...updated };
  }
}

class FakeOrderModel {
  constructor(orders = []) {
    this.records = new Map(orders.map(order => [order.id, order]));
  }

  async update({ where, data }) {
    const order = this.records.get(where.id);
    const updated = {
      ...order,
      ...data,
      updatedAt: new Date(),
    };
    this.records.set(where.id, updated);
    return updated;
  }
}

function createFakeClient(orders = []) {
  return {
    flightStatusCache: new FakeFlightStatusCacheModel(),
    order: new FakeOrderModel(orders),
  };
}

function createScheduledStatus(updatedAt, overrides = {}) {
  return {
    status: 'scheduled',
    flightNumber: 'UA 9258',
    route: {
      from: 'Munich',
      to: 'Prague',
      fromCode: 'MUC',
      toCode: 'PRG',
    },
    scheduledArrival: '2026-07-07T16:00:00.000Z',
    estimatedArrival: '',
    actualArrival: '',
    delayMinutes: 0,
    terminal: '2',
    baggageClaim: '24',
    updatedAt: updatedAt.toISOString(),
    ...overrides,
  };
}

test('parallel requests claim one paid flight-status refresh', async () => {
  const client = createFakeClient();
  const now = new Date('2026-07-07T10:00:00.000Z');
  let apiCalls = 0;
  const fetchFlightStatus = async () => {
    apiCalls += 1;
    await new Promise(resolve => setImmediate(resolve));
    return createScheduledStatus(now);
  };

  await Promise.all(Array.from({ length: 20 }, () =>
    getCachedOrRefreshFlightStatus(client, {
      flightNumber: 'UA 9258',
      flightDate: '2026-07-07',
      fetchFlightStatus,
      now: () => now,
    })));

  assert.equal(apiCalls, 1);
});

test('cache blocks refresh until the full 15-minute interval passes', async () => {
  const client = createFakeClient();
  const startedAt = new Date('2026-07-07T10:00:00.000Z');
  let apiCalls = 0;
  const fetchFlightStatus = async () => {
    apiCalls += 1;
    return createScheduledStatus(startedAt);
  };
  const requestAt = now => getCachedOrRefreshFlightStatus(client, {
    flightNumber: 'UA9258',
    flightDate: '2026-07-07',
    fetchFlightStatus,
    now: () => now,
  });

  await requestAt(startedAt);
  await requestAt(new Date('2026-07-07T10:14:59.999Z'));
  assert.equal(apiCalls, 1);

  await requestAt(new Date('2026-07-07T10:15:00.000Z'));
  assert.equal(apiCalls, 2);
});

test('failed provider call is negative-cached for 15 minutes', async () => {
  const client = createFakeClient();
  const startedAt = new Date('2026-07-07T10:00:00.000Z');
  let apiCalls = 0;
  const fetchFlightStatus = async () => {
    apiCalls += 1;
    throw new Error('provider unavailable');
  };
  const requestAt = now => getCachedOrRefreshFlightStatus(client, {
    flightNumber: 'UA9258',
    flightDate: '2026-07-07',
    fetchFlightStatus,
    now: () => now,
  });

  await assert.rejects(requestAt(startedAt), /provider unavailable/);
  await requestAt(new Date('2026-07-07T10:01:00.000Z'));
  assert.equal(apiCalls, 1);

  await assert.rejects(
    requestAt(new Date('2026-07-07T10:15:00.000Z')),
    /provider unavailable/
  );
  assert.equal(apiCalls, 2);
});

test('terminal flight status disables later refreshes', async () => {
  const client = createFakeClient();
  const startedAt = new Date('2026-07-07T10:00:00.000Z');
  let apiCalls = 0;
  const fetchFlightStatus = async () => {
    apiCalls += 1;
    return createScheduledStatus(startedAt, {
      status: 'landed',
      actualArrival: '2026-07-07T16:04:00.000Z',
    });
  };

  await getCachedOrRefreshFlightStatus(client, {
    flightNumber: 'UA9258',
    flightDate: '2026-07-07',
    fetchFlightStatus,
    now: () => startedAt,
  });
  await getCachedOrRefreshFlightStatus(client, {
    flightNumber: 'UA9258',
    flightDate: '2026-07-07',
    fetchFlightStatus,
    now: () => new Date('2026-07-08T10:00:00.000Z'),
  });

  assert.equal(apiCalls, 1);
});

test('orders sharing a flight use one refresh and receive the same status', async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const flightDate = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');
  const orders = ['order-1', 'order-2'].map(id => ({
    id,
    flightNumber: 'UA 9258',
    trip: {
      time: `${flightDate}T16:00:00`,
    },
    contractData: {},
    metadata: {},
  }));
  const client = createFakeClient(orders);
  let apiCalls = 0;
  const fetchFlightStatus = async () => {
    apiCalls += 1;
    return createScheduledStatus(now, {
      scheduledArrival: `${flightDate}T16:00:00.000Z`,
    });
  };

  const refreshedOrders = await refreshFlightStatusesForOrders(client, orders, {
    enabled: true,
    fetchFlightStatus,
    now: () => now,
  });

  assert.equal(apiCalls, 1);
  assert.equal(refreshedOrders[0].metadata.flightStatus.flightNumber, 'UA 9258');
  assert.deepEqual(
    refreshedOrders[0].metadata.flightStatus,
    refreshedOrders[1].metadata.flightStatus
  );
});

test('weak scheduled response does not overwrite informative delayed cache', async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const flightDate = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');
  const previousUpdate = new Date(now.getTime() - 61 * 60 * 1000);
  const delayedStatus = createScheduledStatus(previousUpdate, {
    status: 'delayed',
    scheduledArrival: `${flightDate}T16:00:00.000Z`,
    estimatedArrival: `${flightDate}T16:30:00.000Z`,
    delayMinutes: 30,
  });
  const order = {
    id: 'order-delayed',
    flightNumber: 'UA 9258',
    trip: {
      time: `${flightDate}T16:00:00`,
    },
    contractData: {},
    metadata: {
      flightStatus: delayedStatus,
    },
  };
  const client = createFakeClient([order]);

  const refreshedOrder = await refreshFlightStatusForOrder(client, order, {
    enabled: true,
    now: () => now,
    fetchFlightStatus: async () => createScheduledStatus(now, {
      scheduledArrival: `${flightDate}T16:00:00.000Z`,
      estimatedArrival: '',
      delayMinutes: 0,
    }),
  });

  assert.equal(refreshedOrder.metadata.flightStatus.status, 'delayed');
  assert.equal(
    refreshedOrder.metadata.flightStatus.estimatedArrival,
    `${flightDate}T16:30:00.000Z`
  );
});

test('low per-request limit prioritizes stale groups without starvation', async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const flightDate = [
    tomorrow.getFullYear(),
    String(tomorrow.getMonth() + 1).padStart(2, '0'),
    String(tomorrow.getDate()).padStart(2, '0'),
  ].join('-');
  const orders = ['UA 9258', 'QS 1009'].map((flightNumber, index) => ({
    id: `limited-order-${index}`,
    flightNumber,
    trip: {
      time: `${flightDate}T16:00:00`,
    },
    contractData: {},
    metadata: {},
  }));
  const client = createFakeClient(orders);
  let apiCalls = 0;
  const fetchFlightStatus = async flightNumber => {
    apiCalls += 1;
    return createScheduledStatus(now, {
      flightNumber: flightNumber.replace(/^(\D+)(\d+)$/, '$1 $2'),
      scheduledArrival: `${flightDate}T16:00:00.000Z`,
    });
  };

  const firstPage = await refreshFlightStatusesForOrders(client, orders, {
    enabled: true,
    limit: 1,
    fetchFlightStatus,
    now: () => now,
  });
  const secondPage = await refreshFlightStatusesForOrders(client, firstPage, {
    enabled: true,
    limit: 1,
    fetchFlightStatus,
    now: () => now,
  });

  assert.equal(apiCalls, 2);
  assert.ok(secondPage.every(order => order.metadata.flightStatus));
});

test('configured refresh interval cannot be lower than 15 minutes', () => {
  const previousValue = process.env.AVIATIONSTACK_CACHE_TTL_MINUTES;
  process.env.AVIATIONSTACK_CACHE_TTL_MINUTES = '1';

  try {
    assert.equal(flightStatusCacheInternals.getRefreshIntervalMinutes(), 15);
  } finally {
    if (previousValue === undefined) {
      delete process.env.AVIATIONSTACK_CACHE_TTL_MINUTES;
    } else {
      process.env.AVIATIONSTACK_CACHE_TTL_MINUTES = previousValue;
    }
  }
});

test('aviationstack refresh performs one HTTP request without automatic fallback', async () => {
  const previousApiKey = process.env.AVIATIONSTACK_API_KEY;
  const previousDateFilter = process.env.AVIATIONSTACK_USE_FLIGHT_DATE_FILTER;
  const previousFetch = globalThis.fetch;
  let httpCalls = 0;
  let requestUrl = '';
  process.env.AVIATIONSTACK_API_KEY = 'test-key';
  process.env.AVIATIONSTACK_USE_FLIGHT_DATE_FILTER = 'false';
  globalThis.fetch = async url => {
    httpCalls += 1;
    requestUrl = String(url);
    return {
      ok: true,
      async json() {
        return {
          data: [{
            flight_status: 'scheduled',
            flight: { iata: 'UA9258' },
            departure: {
              airport: 'Munich',
              iata: 'MUC',
              scheduled: '2026-07-07T14:00:00.000Z',
            },
            arrival: {
              airport: 'Prague',
              iata: 'PRG',
              scheduled: '2026-07-07T16:00:00.000Z',
              terminal: '2',
              baggage: '24',
            },
          }],
        };
      },
    };
  };

  try {
    const status = await fetchAviationstackFlightStatus('UA 9258', {
      flightDate: '2026-07-07',
    });

    assert.equal(httpCalls, 1);
    assert.equal(new URL(requestUrl).searchParams.has('flight_date'), false);
    assert.equal(status.flightNumber, 'UA 9258');
  } finally {
    globalThis.fetch = previousFetch;

    if (previousApiKey === undefined) {
      delete process.env.AVIATIONSTACK_API_KEY;
    } else {
      process.env.AVIATIONSTACK_API_KEY = previousApiKey;
    }

    if (previousDateFilter === undefined) {
      delete process.env.AVIATIONSTACK_USE_FLIGHT_DATE_FILTER;
    } else {
      process.env.AVIATIONSTACK_USE_FLIGHT_DATE_FILTER = previousDateFilter;
    }
  }
});
