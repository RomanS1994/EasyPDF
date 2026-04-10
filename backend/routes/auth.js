import { randomUUID } from 'node:crypto';

import { appendAuditLog } from '../audit/service.js';
import {
  buildSession,
  loadDatabaseWithFreshSessions,
  pruneExpiredSessions,
} from '../auth/context.js';
import {
  createSessionToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from '../auth/tokens.js';
import { mutateDatabase } from '../db/store.js';
import {
  getBearerToken,
  readJsonBody,
  sendError,
  sendJson,
} from '../lib/http.js';
import { getPlanRecord } from '../services/plans.js';
import { normalizeUserProfile } from '../services/profiles.js';
import { buildSubscriptionAssignment } from '../services/subscriptions.js';
import { sanitizeUser } from '../services/users.js';
import {
  validateLoginInput,
  validateRegistrationInput,
} from '../validation/auth.js';
import { nowIso } from '../validation/common.js';

async function handleRegister(request, response) {
  const body = await readJsonBody(request);
  const { email, name, password, selectedPlanId } = validateRegistrationInput(body);
  const rawToken = createSessionToken();

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

    database.users.push(user);
    database.sessions.push(buildSession(user.id, rawToken, timestamp));
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
    });

    return {
      token: rawToken,
      user: sanitizeUser(database, user),
    };
  });

  sendJson(response, 201, payload);
}

async function handleLogin(request, response) {
  const body = await readJsonBody(request);
  const { email, password } = validateLoginInput(body);

  const database = await loadDatabaseWithFreshSessions();
  const user = database.users.find(item => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return sendError(response, 401, 'Invalid email or password');
  }

  const rawToken = createSessionToken();

  await mutateDatabase(nextDatabase => {
    pruneExpiredSessions(nextDatabase);
    nextDatabase.sessions.push(buildSession(user.id, rawToken));
  });

  const freshDatabase = await loadDatabaseWithFreshSessions();
  const freshUser = freshDatabase.users.find(item => item.id === user.id);

  sendJson(response, 200, {
    token: rawToken,
    user: sanitizeUser(freshDatabase, freshUser),
  });
}

async function handleLogout(request, response) {
  const token = getBearerToken(request);

  if (!token) {
    return sendError(response, 401, 'Authorization token is required');
  }

  await mutateDatabase(database => {
    database.sessions = database.sessions.filter(
      session => session.tokenHash !== hashToken(token)
    );
  });

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

  if (request.method === 'POST' && pathName === '/api/auth/logout') {
    await handleLogout(request, response);
    return true;
  }

  return false;
}
