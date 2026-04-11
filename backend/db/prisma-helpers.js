import { randomUUID } from 'node:crypto';

import {
  buildManagerUserSummaryFromRecords,
  resolveSubscriptionView,
  sanitizeAuditLogFromRecords,
  sanitizeOrderFromRecords,
  sanitizeUserFromRecords,
} from '../services/prisma-views.js';
import { normalizeText, nowIso } from '../validation/common.js';

export const USER_WITH_SUBSCRIPTION_INCLUDE = {
  subscription: {
    include: {
      plan: true,
    },
  },
};

export const ORDER_WITH_OWNER_INCLUDE = {
  user: {
    include: {
      subscription: true,
    },
  },
};

export async function createAuditLog(client, payload) {
  return client.auditLog.create({
    data: {
      id: randomUUID(),
      action: normalizeText(payload.action) || 'system.event',
      actorUserId: payload.actorUserId || null,
      targetUserId: payload.targetUserId || null,
      entityType: normalizeText(payload.entityType) || 'system',
      entityId: payload.entityId || null,
      before: payload.before ?? null,
      after: payload.after ?? null,
      meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
      createdAt: new Date(nowIso()),
    },
  });
}

export async function countOrdersForWindow(client, userId, subscriptionView) {
  return client.order.count({
    where: {
      userId,
      createdAt: {
        gte: new Date(subscriptionView.currentPeriodStart),
        lte: new Date(subscriptionView.currentPeriodEnd),
      },
    },
  });
}

export async function buildSanitizedUser(client, user) {
  const subscriptionView = resolveSubscriptionView({
    user,
    subscription: user.subscription,
    plan: user.subscription?.plan,
    fallbackStartMode: user.subscription ? 'now' : 'month',
  });
  const usedOrders = await countOrdersForWindow(client, user.id, subscriptionView);

  return sanitizeUserFromRecords({
    user,
    subscription: user.subscription,
    plan: user.subscription?.plan,
    usedOrders,
  });
}

export async function buildSanitizedUsers(client, users) {
  const userIds = users.map(user => user.id).filter(Boolean);
  if (!userIds.length) {
    return [];
  }

  const subscriptionViews = new Map(
    users.map(user => [
      user.id,
      resolveSubscriptionView({
        user,
        subscription: user.subscription,
        plan: user.subscription?.plan,
        fallbackStartMode: user.subscription ? 'now' : 'month',
      }),
    ])
  );

  const boundaries = Array.from(subscriptionViews.values()).filter(Boolean);
  const minStart = boundaries.reduce((current, item) => {
    return !current || item.currentPeriodStart < current ? item.currentPeriodStart : current;
  }, '');
  const maxEnd = boundaries.reduce((current, item) => {
    return !current || item.currentPeriodEnd > current ? item.currentPeriodEnd : current;
  }, '');

  const [totalOrdersGrouped, windowOrders] = await Promise.all([
    client.order.groupBy({
      by: ['userId'],
      where: {
        userId: {
          in: userIds,
        },
      },
      _count: {
        _all: true,
      },
    }),
    minStart && maxEnd
      ? client.order.findMany({
          where: {
            userId: {
              in: userIds,
            },
            createdAt: {
              gte: new Date(minStart),
              lte: new Date(maxEnd),
            },
          },
          select: {
            userId: true,
            createdAt: true,
          },
        })
      : [],
  ]);

  const totalOrdersByUserId = new Map(
    totalOrdersGrouped.map(item => [item.userId, item._count._all])
  );
  const usedOrdersByUserId = new Map(userIds.map(userId => [userId, 0]));

  for (const order of windowOrders) {
    const subscriptionView = subscriptionViews.get(order.userId);
    if (!subscriptionView) continue;

    const createdAt = order.createdAt instanceof Date
      ? order.createdAt.toISOString()
      : new Date(order.createdAt).toISOString();

    if (
      createdAt >= subscriptionView.currentPeriodStart &&
      createdAt <= subscriptionView.currentPeriodEnd
    ) {
      usedOrdersByUserId.set(order.userId, (usedOrdersByUserId.get(order.userId) || 0) + 1);
    }
  }

  return users.map(user => ({
    sanitized: sanitizeUserFromRecords({
      user,
      subscription: user.subscription,
      plan: user.subscription?.plan,
      usedOrders: usedOrdersByUserId.get(user.id) || 0,
    }),
    totalOrders: totalOrdersByUserId.get(user.id) || 0,
  }));
}

export async function buildManagerUserSummaries(client, users) {
  const enrichedUsers = await buildSanitizedUsers(client, users);

  return users.map((user, index) =>
    buildManagerUserSummaryFromRecords({
      user,
      subscription: user.subscription,
      plan: user.subscription?.plan,
      usedOrders: enrichedUsers[index]?.sanitized?.usage?.used || 0,
      totalOrders: enrichedUsers[index]?.totalOrders || 0,
    })
  );
}

export function sanitizeOrderRecord(order) {
  return sanitizeOrderFromRecords(order, order.user || null);
}

export async function sanitizeAuditLogs(client, records) {
  const userIds = Array.from(
    new Set(
      records
        .flatMap(record => [record.actorUserId, record.targetUserId])
        .filter(Boolean)
    )
  );

  const users = userIds.length
    ? await client.user.findMany({
        where: {
          id: {
            in: userIds,
          },
        },
      })
    : [];

  const usersById = new Map(users.map(user => [user.id, user]));

  return records.map(record =>
    sanitizeAuditLogFromRecords(record, {
      actor: record.actorUserId ? usersById.get(record.actorUserId) || null : null,
      target: record.targetUserId ? usersById.get(record.targetUserId) || null : null,
    })
  );
}
