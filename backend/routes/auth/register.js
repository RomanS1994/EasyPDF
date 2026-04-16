import { randomUUID } from 'node:crypto';

import { hashPassword } from '../../auth/tokens.js';
import {
  getRateLimitState,
  recordRateLimitFailure,
  resetRateLimit,
} from '../../auth/rate-limit.js';
import {
  USER_WITH_SUBSCRIPTION_INCLUDE,
  createAuditLog,
} from '../../db/prisma-helpers.js';
import { mutateFileDatabase as mutateDatabase } from '../../db/file-store.js';
import { findStoredPlan } from '../../db/plans-store.js';
import { runStoreTransaction } from '../../db/store.js';
import { readJsonBody, sendJson } from '../../lib/http.js';
import { getPlanRecord } from '../../services/plans.js';
import { normalizeUserProfile } from '../../services/profiles.js';
import { buildCycleWindow, buildSubscriptionAssignment } from '../../services/subscriptions.js';
import { sanitizeUserFromRecords } from '../../services/prisma-views.js';
import { sanitizeUser } from '../../services/users.js';
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
        const [existingUser, selectedPlan] = await Promise.all([
          tx.user.findUnique({
            where: {
              email,
            },
          }),
          findStoredPlan(tx, selectedPlanId, { includeInactive: false }),
        ]);

        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const timestamp = nowIso();
        const cycle = buildCycleWindow(timestamp);
        const userId = randomUUID();
        const authSession = issueAuthSession(userId);
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
                planId: selectedPlan.id,
                status: 'active',
                source: 'self_signup',
                currentPeriodStart: new Date(timestamp),
                currentPeriodEnd: new Date(cycle.currentPeriodEnd),
                monthlyGenerationLimit: selectedPlan.monthlyGenerationLimit,
                quotaOverride: null,
                assignedByUserId: null,
                assignedAt: new Date(timestamp),
                notes: '',
                canceledAt: null,
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
            planId: createdUser.subscription?.planId || selectedPlan.id,
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
          user: sanitizeUserFromRecords({
            user: createdUser,
            subscription: createdUser.subscription,
            plan: createdUser.subscription?.plan || selectedPlan,
            usedOrders: 0,
          }),
        };
      },
      file: () =>
        mutateDatabase(database => {
          const existingUser = database.users.find(user => user.email === email);

          if (existingUser) {
            throw new Error('User with this email already exists');
          }

          const selectedPlan = getPlanRecord(database, selectedPlanId, {
            includeInactive: false,
          });
          if (!selectedPlan) {
            throw new Error('Invalid plan');
          }

          const timestamp = nowIso();
          const user = {
            id: randomUUID(),
            name,
            email,
            passwordHash: hashPassword(password),
            role: 'user',
            planId: selectedPlan.id,
            profile: normalizeUserProfile(body.profile, name),
            subscription: buildSubscriptionAssignment(
              database,
              selectedPlan.id,
              {
                source: 'self_signup',
                status: 'active',
                currentPeriodStart: timestamp,
              },
              null
            ),
            createdAt: timestamp,
            updatedAt: timestamp,
          };

          const authSession = issueAuthSession(user.id);

          database.users.push(user);
          database.sessions.push(authSession.session);
          database.auditLogs.unshift({
            id: randomUUID(),
            action: 'user.registered',
            actorUserId: user.id,
            targetUserId: user.id,
            entityType: 'user',
            entityId: user.id,
            before: null,
            after: {
              role: user.role,
              planId: user.planId,
            },
            meta: buildRequestMeta(request, {
              email: user.email,
              sessionId: authSession.session.id,
            }),
            createdAt: nowIso(),
          });

          return {
            refreshToken: authSession.refreshToken,
            token: authSession.accessToken,
            accessTokenExpiresAt: authSession.accessTokenExpiresAt,
            user: sanitizeUser(database, user),
          };
        }),
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
