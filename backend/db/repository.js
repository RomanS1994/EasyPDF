import { PLANS as DEFAULT_PLANS } from '../config/plans.js';
import { nowIso } from '../validation/common.js';
import {
  extractSubscriptionRecords,
  mapAuditLogRecord,
  mapOrderRecord,
  mapPlanRecord,
  mapSessionRecord,
  mapUserRecord,
  serializeAuditLogRecord,
  serializeOrderRecord,
  serializePlanRecord,
  serializeSessionRecord,
  serializeUserRecord,
} from './mappers.js';

function mapBy(items, getId) {
  return new Map(items.map(item => [getId(item), item]));
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function stripId(data) {
  const { id, ...rest } = data;
  return rest;
}

async function ensureDefaultPlans(client) {
  const timestamp = nowIso();

  await client.plan.createMany({
    data: DEFAULT_PLANS.map(plan =>
      serializePlanRecord({
        ...plan,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    ),
    skipDuplicates: true,
  });
}

export async function loadDatabaseSnapshot(
  client,
  { pruneExpiredSessions = true } = {}
) {
  if (pruneExpiredSessions) {
    await client.session.deleteMany({
      where: {
        expiresAt: {
          lte: new Date(),
        },
      },
    });
  }

  await ensureDefaultPlans(client);

  const [users, sessions, plans, subscriptions, orders, auditLogs] = await Promise.all([
    client.user.findMany(),
    client.session.findMany(),
    client.plan.findMany(),
    client.subscription.findMany(),
    client.order.findMany(),
    client.auditLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    }),
  ]);

  const subscriptionsByUserId = mapBy(subscriptions, item => item.userId);

  return {
    users: users.map(user => mapUserRecord(user, subscriptionsByUserId.get(user.id))),
    sessions: sessions.map(mapSessionRecord),
    plans: plans.map(mapPlanRecord),
    orders: orders.map(mapOrderRecord),
    auditLogs: auditLogs.map(mapAuditLogRecord),
  };
}

async function upsertCollection({
  beforeItems,
  afterItems,
  getId,
  serialize,
  create,
  update,
}) {
  const beforeById = mapBy(beforeItems, getId);

  for (const afterItem of afterItems) {
    const itemId = getId(afterItem);
    const serializedAfter = serialize(afterItem);
    const beforeItem = beforeById.get(itemId);

    if (!beforeItem) {
      await create(serializedAfter);
      continue;
    }

    const serializedBefore = serialize(beforeItem);
    if (!deepEqual(serializedBefore, serializedAfter)) {
      await update(itemId, stripId(serializedAfter));
    }
  }
}

async function deleteMissingCollection({
  beforeItems,
  afterItems,
  getId,
  remove,
}) {
  const afterIds = new Set(afterItems.map(item => getId(item)));

  for (const beforeItem of beforeItems) {
    const itemId = getId(beforeItem);
    if (!afterIds.has(itemId)) {
      await remove(itemId);
    }
  }
}

export async function persistDatabaseSnapshot(client, beforeDatabase, nextDatabase) {
  const beforeSubscriptions = extractSubscriptionRecords(beforeDatabase.users);
  const nextSubscriptions = extractSubscriptionRecords(nextDatabase.users);

  await upsertCollection({
    beforeItems: beforeDatabase.plans,
    afterItems: nextDatabase.plans,
    getId: item => item.id,
    serialize: serializePlanRecord,
    create: data => client.plan.create({ data }),
    update: (id, data) => client.plan.update({ where: { id }, data }),
  });

  await upsertCollection({
    beforeItems: beforeDatabase.users,
    afterItems: nextDatabase.users,
    getId: item => item.id,
    serialize: serializeUserRecord,
    create: data => client.user.create({ data }),
    update: (id, data) => client.user.update({ where: { id }, data }),
  });

  await upsertCollection({
    beforeItems: beforeSubscriptions,
    afterItems: nextSubscriptions,
    getId: item => item.userId,
    serialize: item => item,
    create: data => client.subscription.create({ data }),
    update: (userId, data) =>
      client.subscription.update({ where: { userId }, data }),
  });

  await upsertCollection({
    beforeItems: beforeDatabase.sessions,
    afterItems: nextDatabase.sessions,
    getId: item => item.id,
    serialize: serializeSessionRecord,
    create: data => client.session.create({ data }),
    update: (id, data) => client.session.update({ where: { id }, data }),
  });

  await upsertCollection({
    beforeItems: beforeDatabase.orders,
    afterItems: nextDatabase.orders,
    getId: item => item.id,
    serialize: serializeOrderRecord,
    create: data => client.order.create({ data }),
    update: (id, data) => client.order.update({ where: { id }, data }),
  });

  await upsertCollection({
    beforeItems: beforeDatabase.auditLogs,
    afterItems: nextDatabase.auditLogs,
    getId: item => item.id,
    serialize: serializeAuditLogRecord,
    create: data => client.auditLog.create({ data }),
    update: (id, data) => client.auditLog.update({ where: { id }, data }),
  });

  await deleteMissingCollection({
    beforeItems: beforeDatabase.sessions,
    afterItems: nextDatabase.sessions,
    getId: item => item.id,
    remove: id => client.session.delete({ where: { id } }),
  });

  await deleteMissingCollection({
    beforeItems: beforeDatabase.orders,
    afterItems: nextDatabase.orders,
    getId: item => item.id,
    remove: id => client.order.delete({ where: { id } }),
  });

  await deleteMissingCollection({
    beforeItems: beforeSubscriptions,
    afterItems: nextSubscriptions,
    getId: item => item.userId,
    remove: userId => client.subscription.delete({ where: { userId } }),
  });

  await deleteMissingCollection({
    beforeItems: beforeDatabase.users,
    afterItems: nextDatabase.users,
    getId: item => item.id,
    remove: id => client.user.delete({ where: { id } }),
  });

  await deleteMissingCollection({
    beforeItems: beforeDatabase.plans,
    afterItems: nextDatabase.plans,
    getId: item => item.id,
    remove: id => client.plan.delete({ where: { id } }),
  });

  await deleteMissingCollection({
    beforeItems: beforeDatabase.auditLogs,
    afterItems: nextDatabase.auditLogs,
    getId: item => item.id,
    remove: id => client.auditLog.delete({ where: { id } }),
  });
}

export async function replaceDatabaseSnapshot(client, database) {
  await client.session.deleteMany();
  await client.order.deleteMany();
  await client.subscription.deleteMany();
  await client.auditLog.deleteMany();
  await client.user.deleteMany();
  await client.plan.deleteMany();
  await persistDatabaseSnapshot(
    client,
    {
      plans: [],
      users: [],
      sessions: [],
      orders: [],
      auditLogs: [],
    },
    database
  );

  return database;
}

export function getDatabaseInfo() {
  return {
    provider: 'postgresql',
    configured: Boolean(process.env.DATABASE_URL),
  };
}
