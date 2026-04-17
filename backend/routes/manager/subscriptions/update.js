import { appendAuditLog } from '../../../audit/service.js';
import { requireManager } from '../../../auth/context.js';
import { mutateFileDatabase as mutateDatabase } from '../../../db/file-store.js';
import {
  buildSanitizedUser,
  createAuditLog,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../../../db/prisma-helpers.js';
import { findStoredPlan } from '../../../db/plans-store.js';
import { runStoreTransaction } from '../../../db/store.js';
import { readJsonBody, sendJson } from '../../../lib/http.js';
import {
  buildSubscriptionWriteData,
  resolveSubscriptionView,
} from '../../../services/prisma-views.js';
import {
  applySubscriptionToUser,
  buildSubscriptionAssignment,
  getResolvedSubscription,
} from '../../../services/subscriptions.js';
import {
  findUserOrThrow,
  sanitizeUser,
} from '../../../services/users.js';
import { nowIso } from '../../../validation/common.js';
import { resolveNextMonthlyGenerationLimit } from './shared.js';

export async function handleManagerUserSubscription(request, response, userId) {
  const context = await requireManager(request, response);
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
            ...body,
            source: 'manager',
            monthlyGenerationLimit: resolveNextMonthlyGenerationLimit(
              body,
              before,
              nextPlanId
            ),
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
            updatedAt: new Date(nowIso()),
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
          meta: {
            planId: userView.planId,
          },
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
              ...body,
              source: 'manager',
              monthlyGenerationLimit: resolveNextMonthlyGenerationLimit(
                body,
                before,
                nextPlanId
              ),
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
            meta: {
              planId: updatedUser.planId,
            },
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
        ...body,
        source: 'manager',
        monthlyGenerationLimit: resolveNextMonthlyGenerationLimit(body, before, nextPlanId),
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
      meta: {
        planId: updatedUser.planId,
      },
    });

    return updatedUser;
  });

  sendJson(response, 200, { user });
}
