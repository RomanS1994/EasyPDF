import { readFileDatabase } from '../db/file-store.js';
import { runStoreRead } from '../db/store.js';
import { getBearerToken, sendError } from '../lib/http.js';
import { verifyAccessToken } from './tokens.js';

export function hasManagerAccess(role) {
  return role === 'manager' || role === 'admin';
}

export function getAccessTokenClaims(request) {
  const token = getBearerToken(request);
  if (!token) return null;
  return verifyAccessToken(token);
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
