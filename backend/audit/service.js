import { randomUUID } from 'node:crypto';

import { normalizeText, nowIso } from '../validation/common.js';

export function appendAuditLog(database, payload) {
  const entry = {
    id: randomUUID(),
    action: normalizeText(payload.action) || 'system.event',
    actorUserId: payload.actorUserId || null,
    targetUserId: payload.targetUserId || null,
    entityType: normalizeText(payload.entityType) || 'system',
    entityId: payload.entityId || null,
    before: payload.before ?? null,
    after: payload.after ?? null,
    meta: payload.meta && typeof payload.meta === 'object' ? payload.meta : {},
    createdAt: nowIso(),
  };

  database.auditLogs.unshift(entry);
  return entry;
}

export function sanitizeAuditLog(database, record) {
  const actor = record.actorUserId
    ? database.users.find(user => user.id === record.actorUserId)
    : null;
  const target = record.targetUserId
    ? database.users.find(user => user.id === record.targetUserId)
    : null;

  return {
    ...record,
    actor: actor
      ? {
          id: actor.id,
          name: actor.name,
          email: actor.email,
          role: actor.role,
        }
      : null,
    target: target
      ? {
          id: target.id,
          name: target.name,
          email: target.email,
          role: target.role,
        }
      : null,
  };
}
