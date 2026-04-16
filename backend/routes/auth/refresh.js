import { randomUUID } from 'node:crypto';

import {
  getCookie,
  sendError,
  sendJson,
} from '../../lib/http.js';
import {
  REFRESH_COOKIE_NAME,
  pruneExpiredSessions,
} from '../../auth/context.js';
import { hashToken } from '../../auth/tokens.js';
import {
  buildSanitizedUser,
  createAuditLog,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../../db/prisma-helpers.js';
import { mutateFileDatabase as mutateDatabase } from '../../db/file-store.js';
import { runStoreTransaction } from '../../db/store.js';
import { sanitizeUser } from '../../services/users.js';
import { nowIso } from '../../validation/common.js';
import {
  buildRequestMeta,
  clearRefreshTokenCookie,
  issueAuthSession,
  setRefreshTokenCookie,
} from './shared.js';

export async function handleRefresh(request, response) {
  const refreshToken = getCookie(request, REFRESH_COOKIE_NAME);

  if (!refreshToken) {
    clearRefreshTokenCookie(response);
    return sendError(response, 401, 'Refresh token is required');
  }

  const payload = await runStoreTransaction({
    prisma: async tx => {
      await tx.session.deleteMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      const currentSession = await tx.session.findUnique({
        where: {
          tokenHash: hashToken(refreshToken),
        },
        include: {
          user: {
            include: USER_WITH_SUBSCRIPTION_INCLUDE,
          },
        },
      });

      if (!currentSession?.user) {
        if (currentSession) {
          await tx.session.delete({
            where: {
              id: currentSession.id,
            },
          });
        }
        return null;
      }

      await tx.session.delete({
        where: {
          id: currentSession.id,
        },
      });

      const rotatedSession = issueAuthSession(currentSession.user.id);
      await tx.session.create({
        data: {
          id: rotatedSession.session.id,
          userId: currentSession.user.id,
          tokenHash: rotatedSession.session.tokenHash,
          createdAt: new Date(rotatedSession.session.createdAt),
          expiresAt: new Date(rotatedSession.session.expiresAt),
        },
      });
      await createAuditLog(tx, {
        action: 'auth.session.refreshed',
        actorUserId: currentSession.user.id,
        targetUserId: currentSession.user.id,
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
        user: await buildSanitizedUser(tx, currentSession.user),
      };
    },
    file: () =>
      mutateDatabase(database => {
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
        database.auditLogs.unshift({
          id: randomUUID(),
          action: 'auth.session.refreshed',
          actorUserId: user.id,
          targetUserId: user.id,
          entityType: 'session',
          entityId: rotatedSession.session.id,
          before: null,
          after: null,
          meta: buildRequestMeta(request, {
            replacedSessionId: currentSession.id,
          }),
          createdAt: nowIso(),
        });

        return {
          refreshToken: rotatedSession.refreshToken,
          token: rotatedSession.accessToken,
          accessTokenExpiresAt: rotatedSession.accessTokenExpiresAt,
          user: sanitizeUser(database, user),
        };
      }),
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
