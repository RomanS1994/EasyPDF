import { randomUUID } from 'node:crypto';

import { readDatabase } from '../db/store.js';
import { sendError } from '../lib/http.js';
import { nowIso } from '../validation/common.js';
import { hashToken } from './tokens.js';

export const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24 * 7);

const API_KEY = process.env.API_KEY || '';

export function hasManagerAccess(role) {
  return role === 'manager' || role === 'admin';
}

export function buildSession(userId, rawToken, createdAt = nowIso()) {
  return {
    id: randomUUID(),
    userId,
    tokenHash: hashToken(rawToken),
    createdAt,
    expiresAt: new Date(
      Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
    ).toISOString(),
  };
}

export function pruneExpiredSessions(database) {
  const now = Date.now();

  database.sessions = database.sessions.filter(session => {
    return new Date(session.expiresAt).getTime() > now;
  });
}

export async function loadDatabaseWithFreshSessions() {
  return readDatabase();
}

export function requireApiKey(request, response) {
  if (!API_KEY) return true;

  if (request.headers['x-api-key'] !== API_KEY) {
    sendError(response, 401, 'Invalid API key');
    return false;
  }

  return true;
}

export async function getAuthContext(request, response) {
  const authHeader = request.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    sendError(response, 401, 'Authorization token is required');
    return null;
  }

  const database = await loadDatabaseWithFreshSessions();
  const tokenHash = hashToken(token);
  const session = database.sessions.find(item => item.tokenHash === tokenHash);

  if (!session) {
    sendError(response, 401, 'Invalid or expired session');
    return null;
  }

  const user = database.users.find(item => item.id === session.userId);

  if (!user) {
    sendError(response, 401, 'User not found for session');
    return null;
  }

  return { database, user, session };
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
