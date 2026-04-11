import { randomUUID } from 'node:crypto';

import { getApiKey } from '../config/runtime-env.js';
import { readFileDatabase } from '../db/file-store.js';
import { runStoreRead } from '../db/store.js';
import { getBearerToken, sendError } from '../lib/http.js';
import { nowIso } from '../validation/common.js';
import { hashToken, verifyAccessToken } from './tokens.js';

const LEGACY_SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24 * 7);
export const REFRESH_TOKEN_TTL_HOURS = Number(
  process.env.REFRESH_TOKEN_TTL_HOURS || LEGACY_SESSION_TTL_HOURS
);
export const REFRESH_TOKEN_TTL_SECONDS = REFRESH_TOKEN_TTL_HOURS * 60 * 60;
export const REFRESH_COOKIE_NAME =
  process.env.REFRESH_COOKIE_NAME || 'pdfapp_refresh_token';

function normalizeSameSite(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'strict') return 'Strict';
  if (normalized === 'none') return 'None';
  return 'Lax';
}

export function hasManagerAccess(role) {
  return role === 'manager' || role === 'admin';
}

export function getRefreshCookieOptions() {
  const configuredSameSite = process.env.REFRESH_COOKIE_SAME_SITE;
  const sameSite = normalizeSameSite(
    configuredSameSite || (process.env.NODE_ENV === 'production' ? 'none' : 'lax')
  );
  const secure =
    process.env.REFRESH_COOKIE_SECURE !== undefined
      ? process.env.REFRESH_COOKIE_SECURE === 'true'
      : process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    path: '/',
    sameSite,
    secure,
    maxAge: REFRESH_TOKEN_TTL_SECONDS,
  };
}

export function buildSession(userId, rawToken, createdAt = nowIso()) {
  return {
    id: randomUUID(),
    userId,
    tokenHash: hashToken(rawToken),
    createdAt,
    expiresAt: new Date(
      Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000
    ).toISOString(),
  };
}

export function pruneExpiredSessions(database) {
  const now = Date.now();

  database.sessions = database.sessions.filter(session => {
    return new Date(session.expiresAt).getTime() > now;
  });
}

export function getAccessTokenClaims(request) {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifyAccessToken(token);
}

export function requireApiKey(request, response) {
  const apiKey = getApiKey();

  if (!apiKey) return true;

  if (request.headers['x-api-key'] !== apiKey) {
    sendError(response, 401, 'Invalid API key');
    return false;
  }

  return true;
}

export async function getAuthContext(request, response) {
  const rawAccessToken = getBearerToken(request);

  if (!rawAccessToken) {
    sendError(response, 401, 'Authorization token is required');
    return null;
  }

  const tokenClaims = verifyAccessToken(rawAccessToken);

  if (!tokenClaims) {
    sendError(response, 401, 'Invalid or expired access token');
    return null;
  }

  return runStoreRead({
    prisma: async client => {
      await client.session.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      const session = await client.session.findUnique({
        where: {
          id: tokenClaims.sessionId,
        },
        include: {
          user: {
            include: {
              subscription: {
                include: {
                  plan: true,
                },
              },
            },
          },
        },
      });

      if (!session || session.userId !== tokenClaims.userId) {
        sendError(response, 401, 'Invalid or expired session');
        return null;
      }

      if (!session.user) {
        sendError(response, 401, 'User not found for session');
        return null;
      }

      return {
        database: null,
        user: session.user,
        session,
        tokenClaims,
        store: 'prisma',
      };
    },
    file: async () => {
      const database = await readFileDatabase();
      const session = database.sessions.find(item => item.id === tokenClaims.sessionId);

      if (!session || session.userId !== tokenClaims.userId) {
        sendError(response, 401, 'Invalid or expired session');
        return null;
      }

      const user = database.users.find(item => item.id === tokenClaims.userId);

      if (!user) {
        sendError(response, 401, 'User not found for session');
        return null;
      }

      return { database, user, session, tokenClaims, store: 'file' };
    },
  });
}

export async function requireManager(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return null;

  if (!hasManagerAccess(context.user.role)) {
    sendError(response, 403, 'Manager access is required');
    return null;
  }

  return context;
}

export async function requireAdmin(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return null;

  if (context.user.role !== 'admin') {
    sendError(response, 403, 'Admin access is required');
    return null;
  }

  return context;
}
