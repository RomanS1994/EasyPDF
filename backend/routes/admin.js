import { appendAuditLog } from '../audit/service.js';
import { requireAdmin } from '../auth/context.js';
import { mutateFileDatabase as mutateDatabase } from '../db/file-store.js';
import {
  buildManagerUserSummaries,
  buildSanitizedUser,
  createAuditLog,
  ORDER_WITH_OWNER_INCLUDE,
  sanitizeOrderRecord,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import { findStoredPlan } from '../db/plans-store.js';
import { prisma } from '../db/prisma.js';
import { runStoreTransaction } from '../db/store.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { sanitizeOrder } from '../services/orders.js';
import { buildSubscriptionWriteData, resolveSubscriptionView } from '../services/prisma-views.js';
import {
  applySubscriptionToUser,
  buildSubscriptionAssignment,
  getResolvedSubscription,
} from '../services/subscriptions.js';
import {
  buildManagerUserSummary,
  findUserOrThrow,
  sanitizeUser,
} from '../services/users.js';

async function handleLegacyAdminUsers(request, response) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  if (context.store === 'prisma') {
    const users = await prisma.user.findMany({
      include: USER_WITH_SUBSCRIPTION_INCLUDE,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    sendJson(response, 200, {
      users: await buildManagerUserSummaries(prisma, users),
    });
    return;
  }

  const users = context.database.users.map(user => buildManagerUserSummary(context.database, user));
  sendJson(response, 200, { users });
}

async function handleLegacyAdminOrders(request, response, url) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  const userId = url.searchParams.get('userId');

  if (context.store === 'prisma') {
    const orders = await prisma.order.findMany({
      where: userId ? { userId } : undefined,
      include: ORDER_WITH_OWNER_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
    });

    sendJson(response, 200, {
      orders: orders.map(sanitizeOrderRecord),
    });
    return;
  }

  const orders = context.database.orders
    .filter(order => (userId ? order.userId === userId : true))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(order => sanitizeOrder(order, context.database));

  sendJson(response, 200, { orders });
}

async function handleLegacyAdminPlanUpdate(request, response, userId) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  if (context.store === 'prisma') {
    const user = await runStoreTransaction({
      prisma: async tx => {
        const target = await tx.user.findUnique({
          where: {
            id: userId,
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        if (!target) {
          throw new Error('User not found');
        }

        const before = resolveSubscriptionView({
          user: target,
          subscription: target.subscription,
          plan: target.subscription?.plan,
          fallbackStartMode: target.subscription ? 'now' : 'month',
        });
        const nextPlanId = body.planId || before.planId;
        const selectedPlan = await findStoredPlan(tx, nextPlanId);

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const subscriptionData = buildSubscriptionWriteData({
          plan: selectedPlan,
          before,
          payload: {
            ...before,
            status: before.status === 'expired' ? 'active' : before.status,
            source: 'manager',
            monthlyGenerationLimit:
              nextPlanId === before.planId ? before.monthlyGenerationLimit : undefined,
          },
          actorUserId: context.user.id,
        });

        await tx.subscription.upsert({
          where: {
            userId: target.id,
          },
          update: {
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: subscriptionData.canceledAt
              ? new Date(subscriptionData.canceledAt)
              : null,
          },
          create: {
            id: target.id,
            userId: target.id,
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: subscriptionData.canceledAt
              ? new Date(subscriptionData.canceledAt)
              : null,
          },
        });

        const updatedUser = await tx.user.update({
          where: {
            id: target.id,
          },
          data: {
            updatedAt: new Date(),
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        const userView = await buildSanitizedUser(tx, updatedUser);
        await createAuditLog(tx, {
          action: 'subscription.updated',
          actorUserId: context.user.id,
          targetUserId: updatedUser.id,
          entityType: 'subscription',
          entityId: updatedUser.id,
          before,
          after: userView.subscription,
        });

        return userView;
      },
      file: () =>
        mutateDatabase(database => {
          const target = findUserOrThrow(database, userId);
          const before = getResolvedSubscription(database, target);
          const nextPlanId = body.planId || before.planId;
          const nextSubscription = buildSubscriptionAssignment(
            database,
            nextPlanId,
            {
              ...before,
              status: before.status === 'expired' ? 'active' : before.status,
              source: 'manager',
              monthlyGenerationLimit:
                nextPlanId === before.planId ? before.monthlyGenerationLimit : undefined,
            },
            context.user.id
          );

          const updatedUser = sanitizeUser(
            database,
            applySubscriptionToUser(database, target, nextSubscription)
          );
          appendAuditLog(database, {
            action: 'subscription.updated',
            actorUserId: context.user.id,
            targetUserId: target.id,
            entityType: 'subscription',
            entityId: target.id,
            before,
            after: updatedUser.subscription,
          });

          return updatedUser;
        }),
    });

    sendJson(response, 200, { user });
    return;
  }

  const user = await mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);
    const nextPlanId = body.planId || before.planId;
    const nextSubscription = buildSubscriptionAssignment(
      database,
      nextPlanId,
      {
        ...before,
        status: before.status === 'expired' ? 'active' : before.status,
        source: 'manager',
        monthlyGenerationLimit:
          nextPlanId === before.planId ? before.monthlyGenerationLimit : undefined,
      },
      context.user.id
    );

    const updatedUser = sanitizeUser(
      database,
      applySubscriptionToUser(database, target, nextSubscription)
    );
    appendAuditLog(database, {
      action: 'subscription.updated',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'subscription',
      entityId: target.id,
      before,
      after: updatedUser.subscription,
    });

    return updatedUser;
  });

  sendJson(response, 200, { user });
}

export async function handleAdminRoutes(request, response, { pathName, url }) {
  if (request.method === 'GET' && pathName === '/api/admin/users') {
    await handleLegacyAdminUsers(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/admin/orders') {
    await handleLegacyAdminOrders(request, response, url);
    return true;
  }

  const legacyAdminPlanMatch = pathName.match(/^\/api\/admin\/users\/([^/]+)\/plan$/);
  if (request.method === 'PATCH' && legacyAdminPlanMatch) {
    await handleLegacyAdminPlanUpdate(request, response, legacyAdminPlanMatch[1]);
    return true;
  }

  return false;
}
