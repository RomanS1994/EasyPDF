import { requireManager } from '../../auth/context.js';
import {
  buildManagerUserSummaries,
  buildSanitizedUser,
  ORDER_LIST_SELECT,
  sanitizeAuditLogs,
  sanitizeOrderListRecord,
} from '../../db/prisma-helpers.js';
import { prisma } from '../../db/prisma.js';
import { sendJson } from '../../lib/http.js';
import { normalizeText } from '../../validation/common.js';

const MANAGER_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  subscription: {
    select: {
      planId: true,
      status: true,
      source: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      monthlyGenerationLimit: true,
      quotaOverride: true,
      assignedByUserId: true,
      assignedAt: true,
      notes: true,
      canceledAt: true,
      pendingPlanId: true,
      pendingRequestedAt: true,
      pendingSource: true,
      plan: true,
    },
  },
};

export async function handleManagerUserList(request, response, url) {
  const context = await requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const role = normalizeText(url.searchParams.get('role')).toLowerCase();
  const planId = normalizeText(url.searchParams.get('planId'));

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
    select: MANAGER_USER_SELECT,
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
}

export async function handleManagerUserDetail(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const target = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: MANAGER_USER_SELECT,
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
      select: ORDER_LIST_SELECT,
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
    recentOrders: recentOrders.map(sanitizeOrderListRecord),
    audit: await sanitizeAuditLogs(prisma, auditRecords),
  });
}
