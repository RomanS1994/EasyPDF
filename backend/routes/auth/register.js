import { randomUUID } from 'node:crypto';

import { hashPassword } from '../../auth/tokens.js';
import {
  getRateLimitState,
  recordRateLimitFailure,
  resetRateLimit,
} from '../../auth/rate-limit.js';
import { buildSanitizedUser, createAuditLog, USER_WITH_SUBSCRIPTION_INCLUDE } from '../../db/prisma-helpers.js';
import { findStoredPlan } from '../../db/plans-store.js';
import { runStoreTransaction } from '../../db/store.js';
import { readJsonBody, sendJson } from '../../lib/http.js';
import { buildSubscriptionWriteData } from '../../services/prisma-views.js';
import { normalizeUserProfile } from '../../services/profiles.js';
import { validateRegistrationInput } from '../../validation/auth.js';
import { normalizeEmail, nowIso } from '../../validation/common.js';
import {
  buildRateLimitIdentifier,
  buildRequestMeta,
  issueAuthSession,
  logAuthFailure,
  sendRateLimitExceeded,
  setRefreshTokenCookie,
} from './shared.js';
import { DEFAULT_PLAN_ID } from '../../config/plans.js';

export async function handleRegister(request, response) {
  const body = await readJsonBody(request);
  const attemptedEmail = normalizeEmail(body.email);
  const identifier = buildRateLimitIdentifier(request, attemptedEmail);
  const rateLimit = getRateLimitState('register', identifier);

  if (!rateLimit.allowed) {
    return sendRateLimitExceeded(response, 'register', rateLimit.retryAfterSeconds);
  }

  try {
    const { email, name, password, selectedPlanId } = validateRegistrationInput(body);

    const payload = await runStoreTransaction({
      prisma: async tx => {
        const [existingUser, freePlan, requestedPlan] = await Promise.all([
          tx.user.findUnique({
            where: {
              email,
            },
          }),
          findStoredPlan(tx, DEFAULT_PLAN_ID, { includeInactive: false }),
          selectedPlanId && selectedPlanId !== DEFAULT_PLAN_ID
            ? findStoredPlan(tx, selectedPlanId, { includeInactive: false })
            : Promise.resolve(null),
        ]);

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        if (!freePlan) {
          throw new Error('Default free plan is not configured');
        }

        if (selectedPlanId && selectedPlanId !== DEFAULT_PLAN_ID && !requestedPlan) {
          throw new Error('Invalid plan');
        }

        const timestamp = nowIso();
        const userId = randomUUID();
        const authSession = issueAuthSession(userId);
        const pendingPlanId = requestedPlan?.id || null;
        const subscriptionData = buildSubscriptionWriteData({
          plan: freePlan,
          payload: {
            source: 'self_signup_free',
            status: 'active',
            currentPeriodStart: timestamp,
            notes: pendingPlanId
              ? `Manual upgrade requested during signup: ${pendingPlanId}`
              : '',
            pendingPlanId,
            pendingRequestedAt: pendingPlanId ? timestamp : null,
            pendingSource: pendingPlanId ? 'manual_payment' : null,
          },
          before: null,
          actorUserId: null,
        });

        const createdUser = await tx.user.create({
          data: {
            id: userId,
            name,
            email,
            passwordHash: hashPassword(password),
            role: 'user',
            profile: normalizeUserProfile(body.profile, name),
            sessions: {
              create: {
                id: authSession.session.id,
                tokenHash: authSession.session.tokenHash,
                createdAt: new Date(authSession.session.createdAt),
                expiresAt: new Date(authSession.session.expiresAt),
              },
            },
            subscription: {
              create: {
                id: userId,
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
                pendingPlanId: subscriptionData.pendingPlanId,
                pendingRequestedAt: subscriptionData.pendingRequestedAt
                  ? new Date(subscriptionData.pendingRequestedAt)
                  : null,
                pendingSource: subscriptionData.pendingSource,
              },
            },
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        await createAuditLog(tx, {
          action: 'user.registered',
          actorUserId: createdUser.id,
          targetUserId: createdUser.id,
          entityType: 'user',
          entityId: createdUser.id,
          after: {
            role: createdUser.role,
            planId: createdUser.subscription?.planId || freePlan.id,
            pendingPlanId,
          },
          meta: buildRequestMeta(request, {
            email: createdUser.email,
            sessionId: authSession.session.id,
          }),
        });

        return {
          refreshToken: authSession.refreshToken,
          token: authSession.accessToken,
          accessTokenExpiresAt: authSession.accessTokenExpiresAt,
          user: await buildSanitizedUser(tx, createdUser),
        };
      },
    });

    resetRateLimit('register', identifier);
    setRefreshTokenCookie(response, payload.refreshToken);
    sendJson(response, 201, {
      token: payload.token,
      accessTokenExpiresAt: payload.accessTokenExpiresAt,
      user: payload.user,
    });
  } catch (error) {
    recordRateLimitFailure('register', identifier);
    await logAuthFailure(
      request,
      'auth.register.failed',
      attemptedEmail,
      null,
      error instanceof Error ? error.message : 'Registration failed'
    );
    throw error;
  }
}
