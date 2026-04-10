import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { DEFAULT_PLAN_ID, PLANS as DEFAULT_PLANS } from '../config/plans.js';
import { normalizePlanRecord } from '../services/plans.js';
import { normalizeUserProfile } from '../services/profiles.js';
import {
  buildDefaultSubscription,
  normalizeSubscription,
} from '../services/subscriptions.js';
import { normalizeEmail, nowIso } from '../validation/common.js';

const DEFAULT_FILE_PATH = fileURLToPath(new URL('../data/db.json', import.meta.url));
let fileStoreQueue = Promise.resolve();

function withFileStoreLock(work) {
  const task = fileStoreQueue.then(work, work);
  fileStoreQueue = task.then(
    () => undefined,
    () => undefined
  );
  return task;
}

function isUserRole(value) {
  return value === 'user' || value === 'manager' || value === 'admin';
}

function isAbsolutePath(value) {
  return typeof value === 'string' && path.isAbsolute(value);
}

export function getFileDatabasePath() {
  const configuredPath = process.env.DATA_FILE || process.env.LEGACY_DATA_FILE || '';
  if (!configuredPath) return DEFAULT_FILE_PATH;
  return isAbsolutePath(configuredPath)
    ? configuredPath
    : path.resolve(process.cwd(), configuredPath);
}

function normalizePlans(sourcePlans) {
  const plans = Array.isArray(sourcePlans) && sourcePlans.length ? sourcePlans : DEFAULT_PLANS;
  return plans.map(normalizePlanRecord);
}

function normalizeSessions(sourceSessions) {
  const now = Date.now();
  const sessions = Array.isArray(sourceSessions) ? sourceSessions : [];

  return sessions
    .map(session => {
      const createdAt = session?.createdAt || nowIso();
      const expiresAt = session?.expiresAt || createdAt;

      return {
        id: session?.id || randomUUID(),
        userId: session?.userId || '',
        tokenHash: session?.tokenHash || '',
        createdAt,
        expiresAt,
      };
    })
    .filter(session => {
      return session.userId && session.tokenHash && new Date(session.expiresAt).getTime() > now;
    });
}

function normalizeOrders(sourceOrders) {
  const orders = Array.isArray(sourceOrders) ? sourceOrders : [];

  return orders.map(order => {
    const createdAt = order?.createdAt || nowIso();
    return {
      id: order?.id || randomUUID(),
      userId: order?.userId || '',
      orderNumber: order?.orderNumber || '',
      status: order?.status || 'created',
      source: order?.source || 'pdf-app',
      customer: order?.customer && typeof order.customer === 'object' ? order.customer : {},
      trip: order?.trip && typeof order.trip === 'object' ? order.trip : {},
      totalPrice: order?.totalPrice || '',
      pdf: order?.pdf && typeof order.pdf === 'object' ? order.pdf : {},
      contractData:
        order?.contractData && typeof order.contractData === 'object'
          ? order.contractData
          : {},
      metadata: order?.metadata && typeof order.metadata === 'object' ? order.metadata : {},
      createdAt,
      updatedAt: order?.updatedAt || createdAt,
    };
  });
}

function normalizeAuditLogs(sourceAuditLogs) {
  const auditLogs = Array.isArray(sourceAuditLogs) ? sourceAuditLogs : [];

  return auditLogs.map(log => ({
    id: log?.id || randomUUID(),
    action: log?.action || 'unknown',
    actorUserId: log?.actorUserId || null,
    targetUserId: log?.targetUserId || null,
    entityType: log?.entityType || 'unknown',
    entityId: log?.entityId || null,
    before: log?.before ?? null,
    after: log?.after ?? null,
    meta: log?.meta && typeof log.meta === 'object' ? log.meta : {},
    createdAt: log?.createdAt || nowIso(),
  }));
}

function normalizeUsers(sourceUsers, database) {
  const users = Array.isArray(sourceUsers) ? sourceUsers : [];
  const knownPlanIds = new Set(database.plans.map(plan => plan.id));

  return users.map(user => {
    const createdAt = user?.createdAt || nowIso();
    const name = typeof user?.name === 'string' ? user.name.trim() : '';
    const planId =
      user?.planId && knownPlanIds.has(user.planId) ? user.planId : DEFAULT_PLAN_ID;

    const nextUser = {
      id: user?.id || randomUUID(),
      name,
      email: normalizeEmail(user?.email || ''),
      passwordHash: user?.passwordHash || '',
      role: isUserRole(user?.role) ? user.role : 'user',
      planId,
      profile: normalizeUserProfile(user?.profile, name),
      createdAt,
      updatedAt: user?.updatedAt || createdAt,
    };

    nextUser.subscription = normalizeSubscription(
      database,
      nextUser,
      user?.subscription ||
        buildDefaultSubscription(database, nextUser, {
          source: 'file_store',
          startMode: 'month',
        }),
      { fallbackStartMode: 'month' }
    );

    return nextUser;
  });
}

export function normalizeFileDatabase(database) {
  const source = database && typeof database === 'object' ? database : {};
  const nextDatabase = {
    plans: normalizePlans(source.plans),
    sessions: [],
    orders: normalizeOrders(source.orders),
    auditLogs: normalizeAuditLogs(source.auditLogs),
    users: [],
  };

  nextDatabase.users = normalizeUsers(source.users, nextDatabase);
  const knownUserIds = new Set(nextDatabase.users.map(user => user.id));
  nextDatabase.sessions = normalizeSessions(source.sessions).filter(session =>
    knownUserIds.has(session.userId)
  );
  nextDatabase.orders = nextDatabase.orders.filter(order => knownUserIds.has(order.userId));

  return nextDatabase;
}

async function ensureFileDatabaseDirectory() {
  await fs.mkdir(path.dirname(getFileDatabasePath()), { recursive: true });
}

async function writeNormalizedDatabase(database) {
  await ensureFileDatabaseDirectory();
  await fs.writeFile(getFileDatabasePath(), JSON.stringify(database, null, 2));
}

async function readNormalizedDatabase() {
  try {
    const raw = await fs.readFile(getFileDatabasePath(), 'utf8');
    return normalizeFileDatabase(raw.trim() ? JSON.parse(raw) : {});
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      const emptyDatabase = normalizeFileDatabase({});
      await writeNormalizedDatabase(emptyDatabase);
      return emptyDatabase;
    }

    throw error;
  }
}

export async function readFileDatabase() {
  return withFileStoreLock(() => readNormalizedDatabase());
}

export async function writeFileDatabase(database) {
  return withFileStoreLock(async () => {
    const normalized = normalizeFileDatabase(database);
    await writeNormalizedDatabase(normalized);
    return normalized;
  });
}

export async function mutateFileDatabase(mutator) {
  return withFileStoreLock(async () => {
    const database = await readNormalizedDatabase();
    const result = await mutator(database);
    await writeNormalizedDatabase(normalizeFileDatabase(database));
    return result;
  });
}

export function getFileDatabaseInfo() {
  return {
    provider: 'json',
    configured: true,
    fallback: true,
    path: getFileDatabasePath(),
  };
}
