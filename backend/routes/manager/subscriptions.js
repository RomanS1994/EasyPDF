import { appendAuditLog } from '../../audit/service.js';
import { requireManager } from '../../auth/context.js';
import { mutateFileDatabase as mutateDatabase } from '../../db/file-store.js';
import {
  buildSanitizedUser,
  createAuditLog,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../../db/prisma-helpers.js';
import { findStoredPlan } from '../../db/plans-store.js';
import { runStoreTransaction } from '../../db/store.js';
import { readJsonBody, sendJson } from '../../lib/http.js';
import {
  buildSubscriptionWriteData,
  resolveSubscriptionView,
} from '../../services/prisma-views.js';
import {
  applySubscriptionToUser,
  buildSubscriptionAssignment,
  getResolvedSubscription,
} from '../../services/subscriptions.js';
import {
  findUserOrThrow,
  sanitizeUser,
} from '../../services/users.js';
import { nowIso, shiftMonths } from '../../validation/common.js';
import { resolveExtensionMonths } from '../../validation/manager.js';

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
            monthlyGenerationLimit:
              body.monthlyGenerationLimit !== undefined &&
              body.monthlyGenerationLimit !== null &&
              body.monthlyGenerationLimit !== ''
                ? body.monthlyGenerationLimit
                : nextPlanId === before.planId
                  ? before.monthlyGenerationLimit
                  : undefined,
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
              monthlyGenerationLimit:
                body.monthlyGenerationLimit !== undefined &&
                body.monthlyGenerationLimit !== null &&
                body.monthlyGenerationLimit !== ''
                  ? body.monthlyGenerationLimit
                  : nextPlanId === before.planId
                    ? before.monthlyGenerationLimit
                    : undefined,
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
        monthlyGenerationLimit:
          body.monthlyGenerationLimit !== undefined &&
          body.monthlyGenerationLimit !== null &&
          body.monthlyGenerationLimit !== ''
            ? body.monthlyGenerationLimit
            : nextPlanId === before.planId
              ? before.monthlyGenerationLimit
              : undefined,
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

export async function handleManagerUserExtend(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const months = resolveExtensionMonths(body.months);

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
        const nextEnd = shiftMonths(before.currentPeriodEnd, months);
        const selectedPlan = target.subscription?.plan || (await findStoredPlan(tx, before.planId));

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const subscriptionData = buildSubscriptionWriteData({
          plan: selectedPlan,
          before,
          payload: {
            ...before,
            status: 'active',
            source: 'manager',
            currentPeriodEnd: nextEnd,
            notes: before.notes,
            canceledAt: null,
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
            canceledAt: null,
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
            canceledAt: null,
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
          action: 'subscription.extended',
          actorUserId: context.user.id,
          targetUserId: updatedUser.id,
          entityType: 'subscription',
          entityId: updatedUser.id,
          before,
          after: userView.subscription,
          meta: { months },
        });

        return userView;
      },
      file: () =>
        mutateDatabase(database => {
          const target = findUserOrThrow(database, userId);
          const before = getResolvedSubscription(database, target);
          const nextEnd = shiftMonths(before.currentPeriodEnd, months);

          const updatedUser = sanitizeUser(
            database,
            applySubscriptionToUser(database, target, {
              ...before,
              status: 'active',
              source: 'manager',
              currentPeriodEnd: nextEnd,
              assignedByUserId: context.user.id,
              assignedAt: nowIso(),
              notes: before.notes,
              canceledAt: null,
            })
          );

          appendAuditLog(database, {
            action: 'subscription.extended',
            actorUserId: context.user.id,
            targetUserId: target.id,
            entityType: 'subscription',
            entityId: target.id,
            before,
            after: updatedUser.subscription,
            meta: { months },
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
    const nextEnd = shiftMonths(before.currentPeriodEnd, months);

    const updatedUser = sanitizeUser(
      database,
      applySubscriptionToUser(database, target, {
        ...before,
        status: 'active',
        source: 'manager',
        currentPeriodEnd: nextEnd,
        assignedByUserId: context.user.id,
        assignedAt: nowIso(),
        notes: before.notes,
        canceledAt: null,
      })
    );

    appendAuditLog(database, {
      action: 'subscription.extended',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'subscription',
      entityId: target.id,
      before,
      after: updatedUser.subscription,
      meta: { months },
    });

    return updatedUser;
  });

  sendJson(response, 200, { user });
}

export async function handleManagerUserCancel(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

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
        const canceledAt = nowIso();
        const selectedPlan = target.subscription?.plan || (await findStoredPlan(tx, before.planId));

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const subscriptionData = buildSubscriptionWriteData({
          plan: selectedPlan,
          before,
          payload: {
            ...before,
            status: 'canceled',
            source: 'manager',
            currentPeriodEnd: canceledAt,
            canceledAt,
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
            canceledAt: new Date(subscriptionData.canceledAt),
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
            canceledAt: new Date(subscriptionData.canceledAt),
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
          action: 'subscription.canceled',
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

          const updatedUser = sanitizeUser(
            database,
            applySubscriptionToUser(database, target, {
              ...before,
              status: 'canceled',
              source: 'manager',
              currentPeriodEnd: nowIso(),
              canceledAt: nowIso(),
              assignedByUserId: context.user.id,
              assignedAt: nowIso(),
            })
          );

          appendAuditLog(database, {
            action: 'subscription.canceled',
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

    const updatedUser = sanitizeUser(
      database,
      applySubscriptionToUser(database, target, {
        ...before,
        status: 'canceled',
        source: 'manager',
        currentPeriodEnd: nowIso(),
        canceledAt: nowIso(),
        assignedByUserId: context.user.id,
        assignedAt: nowIso(),
      })
    );

    appendAuditLog(database, {
      action: 'subscription.canceled',
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
