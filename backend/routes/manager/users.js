import { sanitizeAuditLog } from '../../audit/service.js';
import { requireManager } from '../../auth/context.js';
import {
  buildManagerUserSummaries,
  buildSanitizedUser,
  ORDER_WITH_OWNER_INCLUDE,
  sanitizeAuditLogs,
  sanitizeOrderRecord,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../../db/prisma-helpers.js';
import { prisma } from '../../db/prisma.js';
import { sendJson } from '../../lib/http.js';
import { sanitizeOrder } from '../../services/orders.js';
import {
  buildManagerUserSummary,
  sanitizeUser,
} from '../../services/users.js';
import { normalizeText } from '../../validation/common.js';

export async function handleManagerUserList(request, response, url) {
  const context = await requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const role = normalizeText(url.searchParams.get('role')).toLowerCase();
  const planId = normalizeText(url.searchParams.get('planId'));

  if (context.store === 'prisma') {
    const where = {
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(!role || role === 'all' ? {} : { role }),
      ...(!planId || planId === 'all'
        ? {}
        : {
            subscription: {
              is: {
                planId,
              },
            },
          }),
    };

    const rawUsers = await prisma.user.findMany({
      where,
      include: USER_WITH_SUBSCRIPTION_INCLUDE,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    let users = await buildManagerUserSummaries(prisma, rawUsers);

    if (status && status !== 'all') {
      users = users.filter(user =>
        status === 'pending'
          ? Boolean(user.subscription.pendingPlanId) || user.subscription.status === 'pending'
          : user.subscription.status === status
      );
    }

    sendJson(response, 200, { users });
    return;
  }

  const users = context.database.users
    .filter(user => {
      const summary = sanitizeUser(context.database, user);
      const haystack = `${summary.name} ${summary.email}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesStatus =
        !status ||
        status === 'all' ||
        (status === 'pending'
          ? Boolean(summary.subscription.pendingPlanId) || summary.subscription.status === 'pending'
          : summary.subscription.status === status);
      const matchesRole = !role || role === 'all' || summary.role === role;
      const matchesPlan = !planId || planId === 'all' || summary.planId === planId;

      return matchesSearch && matchesStatus && matchesRole && matchesPlan;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(user => buildManagerUserSummary(context.database, user));

  sendJson(response, 200, { users });
}

export async function handleManagerUserDetail(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  if (context.store === 'prisma') {
    const target = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: USER_WITH_SUBSCRIPTION_INCLUDE,
    });

    if (!target) {
      throw new Error('User not found');
    }

    const [summary, recentOrders, auditRecords] = await Promise.all([
      buildManagerUserSummaries(prisma, [target]),
      prisma.order.findMany({
        where: {
          userId: target.id,
        },
        include: ORDER_WITH_OWNER_INCLUDE,
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            {
              targetUserId: target.id,
            },
            {
              actorUserId: target.id,
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),
    ]);

    sendJson(response, 200, {
      user: summary[0] || (await buildSanitizedUser(prisma, target)),
      recentOrders: recentOrders.map(sanitizeOrderRecord),
      audit: await sanitizeAuditLogs(prisma, auditRecords),
    });
    return;
  }

  const target = context.database.users.find(user => user.id === userId);
  if (!target) {
    throw new Error('User not found');
  }

  const orders = context.database.orders
    .filter(order => order.userId === target.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8)
    .map(order => sanitizeOrder(order, context.database));

  const audit = context.database.auditLogs
    .filter(record => record.targetUserId === target.id || record.actorUserId === target.id)
    .slice(0, 20)
    .map(record => sanitizeAuditLog(context.database, record));

  sendJson(response, 200, {
    user: buildManagerUserSummary(context.database, target),
    recentOrders: orders,
    audit,
  });
}
