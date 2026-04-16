import { sanitizeAuditLog } from '../../audit/service.js';
import { requireManager } from '../../auth/context.js';
import { sanitizeAuditLogs } from '../../db/prisma-helpers.js';
import { prisma } from '../../db/prisma.js';
import { sendJson } from '../../lib/http.js';
import { normalizeInteger, normalizeText } from '../../validation/common.js';

export async function handleManagerAudit(request, response, url) {
  const context = await requireManager(request, response);
  if (!context) return;

  const targetUserId = normalizeText(url.searchParams.get('targetUserId'));
  const limit = Math.min(100, Math.max(10, normalizeInteger(url.searchParams.get('limit'), 40)));

  if (context.store === 'prisma') {
    const auditRecords = await prisma.auditLog.findMany({
      where: targetUserId
        ? {
            OR: [
              {
                targetUserId,
              },
              {
                actorUserId: targetUserId,
              },
            ],
          }
        : undefined,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    sendJson(response, 200, {
      audit: await sanitizeAuditLogs(prisma, auditRecords),
    });
    return;
  }

  const audit = context.database.auditLogs
    .filter(record => {
      return !targetUserId || record.targetUserId === targetUserId || record.actorUserId === targetUserId;
    })
    .slice(0, limit)
    .map(record => sanitizeAuditLog(context.database, record));

  sendJson(response, 200, { audit });
}
