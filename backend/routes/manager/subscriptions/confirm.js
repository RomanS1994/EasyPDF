import { requireManager } from '../../../auth/context.js';
import { DEFAULT_PLAN_ID } from '../../../config/plans.js';
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
import { buildCycleWindow } from '../../../services/subscriptions/cycle.js';
import { normalizeText, nowIso } from '../../../validation/common.js';

function resolvePendingPlanId(body, before) {
  return (
    normalizeText(before.pendingPlanId) ||
    normalizeText(body.planId) ||
    (before.status === 'pending' ? before.planId : '') ||
    ''
  );
}

export async function handleManagerUserConfirmSubscription(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

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
      const pendingPlanId = resolvePendingPlanId(body, before);

      if (!pendingPlanId || pendingPlanId === DEFAULT_PLAN_ID) {
        throw new Error('No paid upgrade request is waiting for confirmation');
      }

      const selectedPlan = await findStoredPlan(tx, pendingPlanId, {
        includeInactive: false,
      });

      if (!selectedPlan) {
        throw new Error('Invalid paid plan');
      }

      const timestamp = nowIso();
      const cycle = buildCycleWindow(timestamp);
      const subscriptionData = buildSubscriptionWriteData({
        plan: selectedPlan,
        before,
        payload: {
          ...before,
          planId: selectedPlan.id,
          status: 'active',
          source: 'manual_payment',
          currentPeriodStart: timestamp,
          currentPeriodEnd: cycle.currentPeriodEnd,
          monthlyGenerationLimit: selectedPlan.monthlyGenerationLimit,
          quotaOverride: null,
          canceledAt: null,
          notes: normalizeText(body.notes ?? before.notes),
          pendingPlanId: null,
          pendingRequestedAt: null,
          pendingSource: null,
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
          canceledAt: subscriptionData.canceledAt ? new Date(subscriptionData.canceledAt) : null,
          pendingPlanId: null,
          pendingRequestedAt: null,
          pendingSource: null,
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
          canceledAt: subscriptionData.canceledAt ? new Date(subscriptionData.canceledAt) : null,
          pendingPlanId: null,
          pendingRequestedAt: null,
          pendingSource: null,
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
        action: 'subscription.payment_confirmed',
        actorUserId: context.user.id,
        targetUserId: updatedUser.id,
        entityType: 'subscription',
        entityId: updatedUser.id,
        before,
        after: userView.subscription,
        meta: {
          planId: selectedPlan.id,
        },
      });

      return userView;
    },
  });

  sendJson(response, 200, { user });
}
