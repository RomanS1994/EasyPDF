import { randomUUID } from 'node:crypto';

import { getAuthContext } from '../auth/context.js';
import { DEFAULT_PLAN_ID } from '../config/plans.js';
import { mutateFileDatabase as mutateDatabase } from '../db/file-store.js';
import { buildSanitizedUser, createAuditLog, USER_WITH_SUBSCRIPTION_INCLUDE } from '../db/prisma-helpers.js';
import { prisma } from '../db/prisma.js';
import { findStoredPlan } from '../db/plans-store.js';
import { runStoreTransaction } from '../db/store.js';
import {
  readJsonBody,
  sendError,
  sendJson,
} from '../lib/http.js';
import { normalizeUserProfile } from '../services/profiles.js';
import { buildSubscriptionWriteData, resolveSubscriptionView } from '../services/prisma-views.js';
import { applySubscriptionToUser, buildSubscriptionAssignment, getResolvedSubscription } from '../services/subscriptions.js';
import { getPlanRecord } from '../services/plans.js';
import { findUserOrThrow, sanitizeUser } from '../services/users.js';
import { normalizeText, nowIso } from '../validation/common.js';

async function handleDeleteMe(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  await runStoreTransaction({
    prisma: async tx => {
      await createAuditLog(tx, {
        action: 'user.deleted_self',
        actorUserId: context.user.id,
        targetUserId: context.user.id,
        entityType: 'user',
        entityId: context.user.id,
      });
      await tx.user.delete({
        where: {
          id: context.user.id,
        },
      });
    },
    file: () =>
      mutateDatabase(database => {
        database.users = database.users.filter(user => user.id !== context.user.id);
        database.orders = database.orders.filter(order => order.userId !== context.user.id);
        database.sessions = database.sessions.filter(
          session => session.userId !== context.user.id
        );
        database.auditLogs.unshift({
          id: randomUUID(),
          action: 'user.deleted_self',
          actorUserId: context.user.id,
          targetUserId: context.user.id,
          entityType: 'user',
          entityId: context.user.id,
          before: null,
          after: null,
          meta: {},
          createdAt: nowIso(),
        });
      }),
  });

  sendJson(response, 200, { ok: true });
}

async function handleUpdateMyProfile(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const incomingProfile =
    body.profile && typeof body.profile === 'object' ? body.profile : body;

  const user = await runStoreTransaction({
    prisma: async tx => {
      const target = await tx.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      if (!target) {
        throw new Error('User not found');
      }

      const before = normalizeUserProfile(target.profile, target.name);
      const currentProfile = normalizeUserProfile(target.profile, target.name);
      const nextProfile = normalizeUserProfile(
        {
          driver: {
            ...currentProfile.driver,
            ...(incomingProfile.driver || {}),
          },
          provider: {
            ...currentProfile.provider,
            ...(incomingProfile.provider || {}),
          },
        },
        target.name
      );

      const updatedUser = await tx.user.update({
        where: {
          id: context.user.id,
        },
        data: {
          profile: nextProfile,
          updatedAt: new Date(nowIso()),
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'user.profile.updated',
        actorUserId: context.user.id,
        targetUserId: updatedUser.id,
        entityType: 'profile',
        entityId: updatedUser.id,
        before,
        after: nextProfile,
      });

      return buildSanitizedUser(tx, updatedUser);
    },
    file: () =>
      mutateDatabase(database => {
        const target = findUserOrThrow(database, context.user.id);
        const before = normalizeUserProfile(target.profile, target.name);
        const currentProfile = normalizeUserProfile(target.profile, target.name);

        target.profile = normalizeUserProfile(
          {
            driver: {
              ...currentProfile.driver,
              ...(incomingProfile.driver || {}),
            },
            provider: {
              ...currentProfile.provider,
              ...(incomingProfile.provider || {}),
            },
          },
          target.name
        );
        target.updatedAt = nowIso();

        database.auditLogs.unshift({
          id: randomUUID(),
          action: 'user.profile.updated',
          actorUserId: context.user.id,
          targetUserId: target.id,
          entityType: 'profile',
          entityId: target.id,
          before,
          after: target.profile,
          meta: {},
          createdAt: nowIso(),
        });

        return sanitizeUser(database, target);
      }),
  });

  sendJson(response, 200, { user });
}

async function handleUpgradeRequest(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const requestedPlanId = normalizeText(body.planId);

  if (!requestedPlanId || requestedPlanId === DEFAULT_PLAN_ID) {
    throw new Error('Choose a paid plan for manual activation');
  }

  const user = await runStoreTransaction({
    prisma: async tx => {
      const target = await tx.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      if (!target) {
        throw new Error('User not found');
      }

      const [currentPlan, requestedPlan] = await Promise.all([
        target.subscription?.plan || findStoredPlan(tx, target.subscription?.planId || target.planId || DEFAULT_PLAN_ID),
        findStoredPlan(tx, requestedPlanId, { includeInactive: false }),
      ]);

      if (!currentPlan) {
        throw new Error('Current plan is not configured');
      }

      if (!requestedPlan || requestedPlan.id === DEFAULT_PLAN_ID) {
        throw new Error('Invalid paid plan');
      }

      const before = resolveSubscriptionView({
        user: target,
        subscription: target.subscription,
        plan: target.subscription?.plan || currentPlan,
        fallbackStartMode: target.subscription ? 'now' : 'month',
      });
      const requestedAt = nowIso();
      const subscriptionData = buildSubscriptionWriteData({
        plan: currentPlan,
        before,
        payload: {
          ...before,
          pendingPlanId: requestedPlan.id,
          pendingRequestedAt: requestedAt,
          pendingSource: 'manual_payment',
          notes: normalizeText(body.notes ?? before.notes),
        },
        actorUserId: null,
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
          pendingPlanId: subscriptionData.pendingPlanId,
          pendingRequestedAt: subscriptionData.pendingRequestedAt
            ? new Date(subscriptionData.pendingRequestedAt)
            : null,
          pendingSource: subscriptionData.pendingSource,
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
          pendingPlanId: subscriptionData.pendingPlanId,
          pendingRequestedAt: subscriptionData.pendingRequestedAt
            ? new Date(subscriptionData.pendingRequestedAt)
            : null,
          pendingSource: subscriptionData.pendingSource,
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
        action: 'subscription.upgrade_requested',
        actorUserId: updatedUser.id,
        targetUserId: updatedUser.id,
        entityType: 'subscription',
        entityId: updatedUser.id,
        before,
        after: userView.subscription,
        meta: {
          requestedPlanId: requestedPlan.id,
        },
      });

      return userView;
    },
    file: () =>
      mutateDatabase(database => {
        const target = findUserOrThrow(database, context.user.id);
        const currentPlan = getPlanRecord(database, target.subscription?.planId || target.planId || DEFAULT_PLAN_ID, {
          includeInactive: true,
        });
        const requestedPlan = getPlanRecord(database, requestedPlanId, {
          includeInactive: false,
        });

        if (!currentPlan) {
          throw new Error('Current plan is not configured');
        }

        if (!requestedPlan || requestedPlan.id === DEFAULT_PLAN_ID) {
          throw new Error('Invalid paid plan');
        }

        const before = getResolvedSubscription(database, target);
        const updatedUser = sanitizeUser(
          database,
          applySubscriptionToUser(
            database,
            target,
            buildSubscriptionAssignment(
              database,
              before.planId,
              {
                ...before,
                pendingPlanId: requestedPlan.id,
                pendingRequestedAt: nowIso(),
                pendingSource: 'manual_payment',
                notes: normalizeText(body.notes ?? before.notes),
              },
              null
            )
          )
        );

        database.auditLogs.unshift({
          id: randomUUID(),
          action: 'subscription.upgrade_requested',
          actorUserId: target.id,
          targetUserId: target.id,
          entityType: 'subscription',
          entityId: target.id,
          before,
          after: updatedUser.subscription,
          meta: {
            requestedPlanId: requestedPlan.id,
          },
          createdAt: nowIso(),
        });

        return updatedUser;
      }),
  });

  sendJson(response, 200, { user });
}

export async function handleMeRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/me') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    if (context.store === 'prisma') {
      const user = await buildSanitizedUser(prisma, context.user);
      sendJson(response, 200, { user });
      return true;
    }

    sendJson(response, 200, {
      user: sanitizeUser(context.database, context.user),
    });
    return true;
  }

  if (request.method === 'DELETE' && pathName === '/api/me') {
    await handleDeleteMe(request, response);
    return true;
  }

  if (request.method === 'PATCH' && pathName === '/api/me/plan') {
    sendError(
      response,
      403,
      'Self-service plan changes are disabled. Contact a manager.'
    );
    return true;
  }

  if (request.method === 'PATCH' && pathName === '/api/me/profile') {
    await handleUpdateMyProfile(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/me/subscription/upgrade-request') {
    await handleUpgradeRequest(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/me/usage') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    if (context.store === 'prisma') {
      const user = await buildSanitizedUser(prisma, context.user);
      sendJson(response, 200, {
        usage: user.usage,
      });
      return true;
    }

    sendJson(response, 200, {
      usage: sanitizeUser(context.database, context.user).usage,
    });
    return true;
  }

  return false;
}
