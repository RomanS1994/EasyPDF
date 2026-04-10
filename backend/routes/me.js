import { appendAuditLog } from '../audit/service.js';
import { getAuthContext } from '../auth/context.js';
import { mutateDatabase } from '../db/store.js';
import {
  readJsonBody,
  sendError,
  sendJson,
} from '../lib/http.js';
import { normalizeUserProfile } from '../services/profiles.js';
import { buildUsage } from '../services/subscriptions.js';
import { findUserOrThrow, sanitizeUser } from '../services/users.js';
import { nowIso } from '../validation/common.js';

async function handleDeleteMe(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  await mutateDatabase(database => {
    database.users = database.users.filter(user => user.id !== context.user.id);
    database.orders = database.orders.filter(order => order.userId !== context.user.id);
    database.sessions = database.sessions.filter(
      session => session.userId !== context.user.id
    );
    appendAuditLog(database, {
      action: 'user.deleted_self',
      actorUserId: context.user.id,
      targetUserId: context.user.id,
      entityType: 'user',
      entityId: context.user.id,
    });
  });

  sendJson(response, 200, { ok: true });
}

async function handleUpdateMyProfile(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const incomingProfile =
    body.profile && typeof body.profile === 'object' ? body.profile : body;

  const user = await mutateDatabase(database => {
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

    appendAuditLog(database, {
      action: 'user.profile.updated',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'profile',
      entityId: target.id,
      before,
      after: target.profile,
    });

    return sanitizeUser(database, target);
  });

  sendJson(response, 200, { user });
}

export async function handleMeRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/me') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

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

  if (request.method === 'GET' && pathName === '/api/me/usage') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    sendJson(response, 200, {
      usage: buildUsage(context.database, context.user),
    });
    return true;
  }

  return false;
}
