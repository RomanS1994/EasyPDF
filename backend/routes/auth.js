import { randomUUID } from 'node:crypto';

import { appendAuditLog } from '../audit/service.js';
import {
  buildSession,
  getAccessTokenClaims,
  getRefreshCookieOptions,
  loadDatabaseWithFreshSessions,
  pruneExpiredSessions,
  REFRESH_COOKIE_NAME,
} from '../auth/context.js';
import {
  createAccessToken,
  createRefreshToken,
  getAccessTokenExpiresAt,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../auth/tokens.js';
import {
  getRateLimitState,
  recordRateLimitFailure,
  resetRateLimit,
} from '../auth/rate-limit.js';
import { mutateDatabase } from '../db/store.js';
import {
  clearCookie,
  getClientIp,
  getCookie,
  readJsonBody,
  sendError,
  sendJson,
  setCookie,
} from '../lib/http.js';
import { getPlanRecord } from '../services/plans.js';
import { normalizeUserProfile } from '../services/profiles.js';
import { buildSubscriptionAssignment } from '../services/subscriptions.js';
import { sanitizeUser } from '../services/users.js';
import {
  validateLoginInput,
  validateRegistrationInput,
} from '../validation/auth.js';
import { normalizeEmail, nowIso } from '../validation/common.js';

function buildRequestMeta(request, extra = {}) {
  return {
    ipAddress: getClientIp(request),
    userAgent: String(request.headers['user-agent'] || ''),
    ...extra,
  };
}

function buildRateLimitIdentifier(request, email = '') {
  return {
    ipAddress: getClientIp(request),
    email,
  };
}

function issueAuthSession(userId, issuedAt = Date.now()) {
  const refreshToken = createRefreshToken();
  const createdAt = new Date(issuedAt).toISOString();
  const session = buildSession(userId, refreshToken, createdAt);

  return {
    refreshToken,
    session,
    accessToken: createAccessToken(
      {
        userId,
        sessionId: session.id,
      },
      issuedAt
    ),
    accessTokenExpiresAt: getAccessTokenExpiresAt(issuedAt),
  };
}

function setRefreshTokenCookie(response, refreshToken) {
  setCookie(response, REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());
}

function clearRefreshTokenCookie(response) {
  clearCookie(response, REFRESH_COOKIE_NAME, getRefreshCookieOptions());
}

function sendRateLimitExceeded(response, action, retryAfterSeconds) {
  response.setHeader('Retry-After', String(retryAfterSeconds));
  sendJson(response, 429, {
    error:
      action === 'register'
        ? 'Too many failed registration attempts. Try again later.'
        : 'Too many failed login attempts. Try again later.',
    retryAfterSeconds,
  });
}

async function logAuthFailure(request, action, email, userId, reason) {
  await mutateDatabase(database => {
    appendAuditLog(database, {
      action,
      actorUserId: userId || null,
      targetUserId: userId || null,
      entityType: 'auth',
      entityId: email || null,
      meta: buildRequestMeta(request, {
        email: email || null,
        reason,
      }),
    });
  });
}

async function handleRegister(request, response) {
  const body = await readJsonBody(request);
  const attemptedEmail = normalizeEmail(body.email);
  const identifier = buildRateLimitIdentifier(request, attemptedEmail);
  const rateLimit = getRateLimitState('register', identifier);

  if (!rateLimit.allowed) {
    return sendRateLimitExceeded(response, 'register', rateLimit.retryAfterSeconds);
  }

  try {
    const { email, name, password, selectedPlanId } = validateRegistrationInput(body);

    const payload = await mutateDatabase(database => {
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
      const role = database.users.length === 0 ? 'admin' : 'user';
      const user = {
        id: randomUUID(),
        name,
        email,
        passwordHash: hashPassword(password),
        role,
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
      appendAuditLog(database, {
        action: 'user.registered',
        actorUserId: user.id,
        targetUserId: user.id,
        entityType: 'user',
        entityId: user.id,
        after: {
          role: user.role,
          planId: user.planId,
        },
        meta: buildRequestMeta(request, {
          email: user.email,
          sessionId: authSession.session.id,
        }),
      });

      return {
        refreshToken: authSession.refreshToken,
        token: authSession.accessToken,
        accessTokenExpiresAt: authSession.accessTokenExpiresAt,
        user: sanitizeUser(database, user),
      };
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

async function handleLogin(request, response) {
  const body = await readJsonBody(request);
  const attemptedEmail = normalizeEmail(body.email);
  const identifier = buildRateLimitIdentifier(request, attemptedEmail);
  const rateLimit = getRateLimitState('login', identifier);

  if (!rateLimit.allowed) {
    return sendRateLimitExceeded(response, 'login', rateLimit.retryAfterSeconds);
  }

  const { email, password } = validateLoginInput(body);
  const database = await loadDatabaseWithFreshSessions();
  const user = database.users.find(item => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    recordRateLimitFailure('login', identifier);
    await logAuthFailure(
      request,
      'auth.login.failed',
      email,
      user?.id || null,
      'Invalid email or password'
    );
    return sendError(response, 401, 'Invalid email or password');
  }

  const payload = await mutateDatabase(nextDatabase => {
    pruneExpiredSessions(nextDatabase);
    const freshUser = nextDatabase.users.find(item => item.id === user.id);

    if (!freshUser) {
      throw new Error('User not found');
    }

    const authSession = issueAuthSession(freshUser.id);
    nextDatabase.sessions.push(authSession.session);
    appendAuditLog(nextDatabase, {
      action: 'auth.login.succeeded',
      actorUserId: freshUser.id,
      targetUserId: freshUser.id,
      entityType: 'session',
      entityId: authSession.session.id,
      meta: buildRequestMeta(request, {
        email: freshUser.email,
      }),
    });

    return {
      refreshToken: authSession.refreshToken,
      token: authSession.accessToken,
      accessTokenExpiresAt: authSession.accessTokenExpiresAt,
      user: sanitizeUser(nextDatabase, freshUser),
    };
  });

  resetRateLimit('login', identifier);
  setRefreshTokenCookie(response, payload.refreshToken);
  sendJson(response, 200, {
    token: payload.token,
    accessTokenExpiresAt: payload.accessTokenExpiresAt,
    user: payload.user,
  });
}

async function handleRefresh(request, response) {
  const refreshToken = getCookie(request, REFRESH_COOKIE_NAME);

  if (!refreshToken) {
    clearRefreshTokenCookie(response);
    return sendError(response, 401, 'Refresh token is required');
  }

  const payload = await mutateDatabase(database => {
    pruneExpiredSessions(database);

    const currentSession = database.sessions.find(
      session => session.tokenHash === hashToken(refreshToken)
    );

    if (!currentSession) {
      return null;
    }

    const user = database.users.find(item => item.id === currentSession.userId);
    if (!user) {
      database.sessions = database.sessions.filter(
        session => session.id !== currentSession.id
      );
      return null;
    }

    database.sessions = database.sessions.filter(
      session => session.id !== currentSession.id
    );

    const rotatedSession = issueAuthSession(user.id);
    database.sessions.push(rotatedSession.session);
    appendAuditLog(database, {
      action: 'auth.session.refreshed',
      actorUserId: user.id,
      targetUserId: user.id,
      entityType: 'session',
      entityId: rotatedSession.session.id,
      meta: buildRequestMeta(request, {
        replacedSessionId: currentSession.id,
      }),
    });

    return {
      refreshToken: rotatedSession.refreshToken,
      token: rotatedSession.accessToken,
      accessTokenExpiresAt: rotatedSession.accessTokenExpiresAt,
      user: sanitizeUser(database, user),
    };
  });

  if (!payload) {
    clearRefreshTokenCookie(response);
    return sendError(response, 401, 'Invalid or expired refresh token');
  }

  setRefreshTokenCookie(response, payload.refreshToken);
  sendJson(response, 200, {
    token: payload.token,
    accessTokenExpiresAt: payload.accessTokenExpiresAt,
    user: payload.user,
  });
}

async function handleLogout(request, response) {
  const refreshToken = getCookie(request, REFRESH_COOKIE_NAME);
  const accessTokenClaims = getAccessTokenClaims(request);

  await mutateDatabase(database => {
    pruneExpiredSessions(database);

    const revokedSessionIds = new Set();

    if (accessTokenClaims?.sessionId) {
      revokedSessionIds.add(accessTokenClaims.sessionId);
    }

    if (refreshToken) {
      const refreshSession = database.sessions.find(
        session => session.tokenHash === hashToken(refreshToken)
      );

      if (refreshSession) {
        revokedSessionIds.add(refreshSession.id);
      }
    }

    if (revokedSessionIds.size === 0) {
      return;
    }

    const targetSession = database.sessions.find(session =>
      revokedSessionIds.has(session.id)
    );

    database.sessions = database.sessions.filter(
      session => !revokedSessionIds.has(session.id)
    );

    appendAuditLog(database, {
      action: 'auth.logout',
      actorUserId: targetSession?.userId || accessTokenClaims?.userId || null,
      targetUserId: targetSession?.userId || accessTokenClaims?.userId || null,
      entityType: 'session',
      entityId: targetSession?.id || accessTokenClaims?.sessionId || null,
      meta: buildRequestMeta(request, {
        revokedSessions: Array.from(revokedSessionIds),
      }),
    });
  });

  clearRefreshTokenCookie(response);
  sendJson(response, 200, { ok: true });
}

export async function handleAuthRoutes(request, response, { pathName }) {
  if (request.method === 'POST' && pathName === '/api/auth/register') {
    await handleRegister(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/auth/login') {
    await handleLogin(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/auth/refresh') {
    await handleRefresh(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/auth/logout') {
    await handleLogout(request, response);
    return true;
  }

  return false;
}
