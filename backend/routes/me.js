import { getAuthContext } from '../auth/context.js';
import { DEFAULT_PLAN_ID } from '../config/plans.js';
import {
  buildSanitizedUser,
  createAuditLog,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import { prisma } from '../db/prisma.js';
import { findStoredPlan } from '../db/plans-store.js';
import { runStoreTransaction } from '../db/store.js';
import {
  readJsonBody,
  sendError,
  sendJson,
} from '../lib/http.js';
import { normalizeUserProfile } from '../services/profiles.js';
import {
  buildSubscriptionWriteData,
  resolveSubscriptionView,
} from '../services/prisma-views.js';
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

      const currentProfile = normalizeUserProfile(target.profile, target.name);
      const requestedName = normalizeText(body.name ?? incomingProfile.name ?? target.name) || target.name;
      const nextAvatarUrl = normalizeText(
        body.avatarUrl ??
          incomingProfile.avatarUrl ??
          incomingProfile.avatar ??
          currentProfile.avatarUrl
      );
      const nextProfile = normalizeUserProfile(
        {
          ...currentProfile,
          driver: {
            ...currentProfile.driver,
            ...(incomingProfile.driver || {}),
          },
          provider: {
            ...currentProfile.provider,
            ...(incomingProfile.provider || {}),
          },
          avatarUrl: nextAvatarUrl,
        },
        requestedName
      );
      const before = {
        name: target.name,
        profile: currentProfile,
      };
      const after = {
        name: requestedName,
        profile: nextProfile,
      };

      const updatedUser = await tx.user.update({
        where: {
          id: context.user.id,
        },
        data: {
          name: requestedName,
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
        after,
      });

      return buildSanitizedUser(tx, updatedUser);
    },
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
        target.subscription?.plan ||
          findStoredPlan(tx, target.subscription?.planId || target.planId || DEFAULT_PLAN_ID, {
            includeInactive: true,
          }),
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
  });

  sendJson(response, 200, { user });
}

export async function handleMeRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/me') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const user = await buildSanitizedUser(prisma, context.user);
    sendJson(response, 200, { user });
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

    const user = await buildSanitizedUser(prisma, context.user);
    sendJson(response, 200, {
      usage: user.usage,
    });
    return true;
  }

  return false;
}
