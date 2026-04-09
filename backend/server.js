import 'dotenv/config';
import http from 'node:http';
import { randomUUID } from 'node:crypto';

import { DEFAULT_PLAN_ID, PLANS as DEFAULT_PLANS } from './config/plans.js';
import {
  createSessionToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './lib/auth.js';
import {
  mutateDatabase,
  readDatabase,
  writeDatabase,
  getDataFilePath,
} from './lib/data-store.js';
import { createContractPdf } from './lib/pdf.js';
import {
  getBearerToken,
  handleCors,
  readJsonBody,
  sendError,
  sendJson,
  sendPdf,
} from './lib/http.js';

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);
const SESSION_TTL_HOURS = Number(process.env.SESSION_TTL_HOURS || 24 * 7);
const API_KEY = process.env.API_KEY || '';
const ROLE_VALUES = ['user', 'manager', 'admin'];
const SUBSCRIPTION_STATUS_VALUES = [
  'active',
  'trial',
  'paused',
  'canceled',
  'expired',
];

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeInteger(value, fallback = null) {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(0, Math.round(next));
}

function slugifyPlanId(value) {
  const base = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || `plan-${randomUUID().slice(0, 8)}`;
}

function toIsoDate(value) {
  if (!value) return '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return `${value}T00:00:00.000Z`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

function shiftMonths(isoDate, months) {
  const source = new Date(isoDate || nowIso());
  if (Number.isNaN(source.getTime())) {
    return nowIso();
  }

  source.setMonth(source.getMonth() + months);
  return source.toISOString();
}

function buildCycleWindow(startIso = nowIso()) {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) {
    return buildCycleWindow(nowIso());
  }

  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setMilliseconds(end.getMilliseconds() - 1);

  return {
    currentPeriodStart: start.toISOString(),
    currentPeriodEnd: end.toISOString(),
  };
}

function buildCurrentMonthWindow() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0) - 1
  );

  return {
    currentPeriodStart: start.toISOString(),
    currentPeriodEnd: end.toISOString(),
  };
}

function formatDateShort(isoDate) {
  if (!isoDate) return '-';

  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return '-';

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function isIsoWithinRange(targetIso, startIso, endIso) {
  if (!targetIso || !startIso || !endIso) return false;
  return targetIso >= startIso && targetIso <= endIso;
}

function hasManagerAccess(role) {
  return role === 'manager' || role === 'admin';
}

function buildDefaultProfile(name = '') {
  const safeName = normalizeText(name);

  return {
    driver: {
      name: safeName,
      address: '',
      spz: '',
      ico: '',
    },
    provider: {
      name: safeName,
      address: '',
      ico: '',
    },
  };
}

function normalizeUserProfile(profile, name = '') {
  const source = profile && typeof profile === 'object' ? profile : {};
  const defaults = buildDefaultProfile(name);
  const driverSource =
    source.driver && typeof source.driver === 'object' ? source.driver : {};
  const providerSource =
    source.provider && typeof source.provider === 'object' ? source.provider : {};

  return {
    driver: {
      ...defaults.driver,
      name: normalizeText(driverSource.name || defaults.driver.name),
      address: normalizeText(driverSource.address),
      spz: normalizeText(driverSource.spz),
      ico: normalizeText(driverSource.ico),
    },
    provider: {
      ...defaults.provider,
      name: normalizeText(providerSource.name || defaults.provider.name),
      address: normalizeText(providerSource.address),
      ico: normalizeText(providerSource.ico),
    },
  };
}

function normalizePlanRecord(plan) {
  const timestamp = nowIso();
  const source = plan && typeof plan === 'object' ? plan : {};
  const limit = normalizeInteger(source.monthlyGenerationLimit, 0);

  return {
    id: normalizeText(source.id) || slugifyPlanId(source.name || `plan-${limit}`),
    name: normalizeText(source.name) || `Plan ${limit || ''}`.trim(),
    monthlyGenerationLimit: limit,
    description: normalizeText(source.description),
    isActive: source.isActive !== false,
    createdAt: source.createdAt || timestamp,
    updatedAt: source.updatedAt || timestamp,
  };
}

function getDatabasePlans(database, { includeInactive = true } = {}) {
  const source = Array.isArray(database.plans) && database.plans.length
    ? database.plans
    : DEFAULT_PLANS;

  const plans = source.map(normalizePlanRecord);
  const filtered = includeInactive
    ? plans
    : plans.filter(plan => plan.isActive !== false);

  return filtered.sort((left, right) => {
    if (left.monthlyGenerationLimit !== right.monthlyGenerationLimit) {
      return left.monthlyGenerationLimit - right.monthlyGenerationLimit;
    }

    return left.name.localeCompare(right.name);
  });
}

function getPlanRecord(database, planId, { includeInactive = true } = {}) {
  return (
    getDatabasePlans(database, { includeInactive }).find(plan => plan.id === planId) ||
    null
  );
}

function buildDefaultSubscription(database, user, { source = 'legacy_migration', startMode = 'month' } = {}) {
  const plan =
    getPlanRecord(database, user.planId || DEFAULT_PLAN_ID, { includeInactive: true }) ||
    getDatabasePlans(database, { includeInactive: true })[0] ||
    normalizePlanRecord(DEFAULT_PLANS[0]);

  const cycle = startMode === 'now' ? buildCycleWindow(nowIso()) : buildCurrentMonthWindow();

  return {
    planId: plan.id,
    status: 'active',
    source,
    currentPeriodStart: cycle.currentPeriodStart,
    currentPeriodEnd: cycle.currentPeriodEnd,
    monthlyGenerationLimit: plan.monthlyGenerationLimit,
    quotaOverride: null,
    assignedByUserId: null,
    assignedAt: user.createdAt || nowIso(),
    notes: source === 'legacy_migration' ? 'Migrated from legacy plan field' : '',
    canceledAt: null,
  };
}

function normalizeSubscription(database, user, subscription, { fallbackStartMode = 'month' } = {}) {
  const source = subscription && typeof subscription === 'object'
    ? subscription
    : buildDefaultSubscription(database, user, { startMode: fallbackStartMode });

  const plan =
    getPlanRecord(database, source.planId || user.planId || DEFAULT_PLAN_ID, {
      includeInactive: true,
    }) || getDatabasePlans(database, { includeInactive: true })[0];

  const status = SUBSCRIPTION_STATUS_VALUES.includes(source.status)
    ? source.status
    : 'active';

  const cycle =
    source.currentPeriodStart && source.currentPeriodEnd
      ? {
          currentPeriodStart: toIsoDate(source.currentPeriodStart),
          currentPeriodEnd: toIsoDate(source.currentPeriodEnd),
        }
      : buildCycleWindow(nowIso());

  if (!cycle.currentPeriodStart || !cycle.currentPeriodEnd) {
    const fallbackCycle = buildCycleWindow(nowIso());
    cycle.currentPeriodStart = fallbackCycle.currentPeriodStart;
    cycle.currentPeriodEnd = fallbackCycle.currentPeriodEnd;
  }

  const limit = normalizeInteger(source.monthlyGenerationLimit, plan?.monthlyGenerationLimit || 0);
  const quotaOverride = normalizeInteger(source.quotaOverride, null);

  return {
    planId: plan?.id || DEFAULT_PLAN_ID,
    status,
    source: normalizeText(source.source) || 'manager',
    currentPeriodStart: cycle.currentPeriodStart,
    currentPeriodEnd: cycle.currentPeriodEnd,
    monthlyGenerationLimit: limit,
    quotaOverride,
    assignedByUserId: source.assignedByUserId || null,
    assignedAt: source.assignedAt || nowIso(),
    notes: normalizeText(source.notes),
    canceledAt: source.canceledAt || null,
  };
}

function getResolvedSubscription(database, user) {
  const normalized = normalizeSubscription(database, user, user.subscription, {
    fallbackStartMode: user.subscription ? 'now' : 'month',
  });
  const periodEnded = normalized.currentPeriodEnd < nowIso();
  const resolvedStatus =
    periodEnded && (normalized.status === 'active' || normalized.status === 'trial')
      ? 'expired'
      : normalized.status;
  const plan = getPlanRecord(database, normalized.planId, { includeInactive: true });
  const effectiveLimit =
    normalized.quotaOverride !== null
      ? normalized.quotaOverride
      : normalized.monthlyGenerationLimit || plan?.monthlyGenerationLimit || 0;

  return {
    ...normalized,
    status: resolvedStatus,
    plan,
    effectiveLimit,
    isAccessActive: resolvedStatus === 'active' || resolvedStatus === 'trial',
  };
}

function buildUsage(database, user) {
  const subscription = getResolvedSubscription(database, user);
  const used = database.orders.filter(order => {
    return (
      order.userId === user.id &&
      isIsoWithinRange(
        String(order.createdAt || ''),
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      )
    );
  }).length;

  const limit = subscription.isAccessActive ? subscription.effectiveLimit : 0;
  const remaining = Math.max(limit - used, 0);
  const percent = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return {
    month: String(subscription.currentPeriodStart).slice(0, 7),
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    cycleLabel: `${formatDateShort(subscription.currentPeriodStart)} - ${formatDateShort(
      subscription.currentPeriodEnd
    )}`,
    status: subscription.status,
    used,
    limit,
    remaining,
    percent,
  };
}

function sanitizeUser(database, user) {
  const subscription = getResolvedSubscription(database, user);
  const plan = subscription.plan ||
    getPlanRecord(database, user.planId || DEFAULT_PLAN_ID, { includeInactive: true });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planId: plan?.id || DEFAULT_PLAN_ID,
    plan,
    profile: normalizeUserProfile(user.profile, user.name),
    subscription: {
      planId: subscription.planId,
      status: subscription.status,
      source: subscription.source,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      monthlyGenerationLimit: subscription.effectiveLimit,
      quotaOverride: subscription.quotaOverride,
      assignedByUserId: subscription.assignedByUserId,
      assignedAt: subscription.assignedAt,
      notes: subscription.notes,
      canceledAt: subscription.canceledAt,
      isAccessActive: subscription.isAccessActive,
    },
    usage: buildUsage(database, user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function sanitizeOrder(order, database) {
  const owner = database.users.find(user => user.id === order.userId);

  return {
    ...order,
    user: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          planId: owner.planId,
          role: owner.role,
        }
      : null,
  };
}

function sanitizeAuditLog(database, record) {
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

function generateOrderNumber() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${Date.now()}-${suffix}`;
}

function pruneExpiredSessions(database) {
  const now = Date.now();

  database.sessions = database.sessions.filter(session => {
    return new Date(session.expiresAt).getTime() > now;
  });
}

function loadDatabaseWithFreshSessions() {
  const database = readDatabase();
  const before = database.sessions.length;
  pruneExpiredSessions(database);

  if (database.sessions.length !== before) {
    writeDatabase(database);
  }

  return database;
}

function requireApiKey(request, response) {
  if (!API_KEY) return true;

  if (request.headers['x-api-key'] !== API_KEY) {
    sendError(response, 401, 'Invalid API key');
    return false;
  }

  return true;
}

function getAuthContext(request, response) {
  const token = getBearerToken(request);

  if (!token) {
    sendError(response, 401, 'Authorization token is required');
    return null;
  }

  const database = loadDatabaseWithFreshSessions();
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

function requireManager(request, response) {
  const context = getAuthContext(request, response);
  if (!context) return null;

  if (!hasManagerAccess(context.user.role)) {
    sendError(response, 403, 'Manager access is required');
    return null;
  }

  return context;
}

function requireAdmin(request, response) {
  const context = getAuthContext(request, response);
  if (!context) return null;

  if (context.user.role !== 'admin') {
    sendError(response, 403, 'Admin access is required');
    return null;
  }

  return context;
}

function appendAuditLog(database, payload) {
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

function findUserOrThrow(database, userId) {
  const target = database.users.find(user => user.id === userId);

  if (!target) {
    throw new Error('User not found');
  }

  return target;
}

function buildOrderRecord(body, user) {
  const contractData = body.contractData || body.order || {};
  const createdAt = nowIso();

  return {
    id: randomUUID(),
    userId: user.id,
    orderNumber:
      contractData.orderNumber || body.orderNumber || generateOrderNumber(),
    status: body.status || 'created',
    source: body.source || 'pdf-app',
    customer: {
      name: contractData.customer?.name || body.customer?.name || '',
      email:
        contractData.customer?.email ||
        body.customer?.email ||
        contractData.customer?.phone ||
        '',
      phone: contractData.customer?.phone || body.customer?.phone || '',
    },
    trip: {
      from: contractData.trip?.from?.address || body.trip?.from || '',
      to: contractData.trip?.to?.address || body.trip?.to || '',
      time: contractData.trip?.time || body.trip?.time || '',
      paymentMethod:
        contractData.trip?.paymentMethod || body.trip?.paymentMethod || '',
    },
    totalPrice: contractData.totalPrice || body.totalPrice || '',
    pdf: {
      url: body.pdf?.url || body.pdfUrl || '',
      fileName: body.pdf?.fileName || body.pdfFileName || '',
    },
    contractData,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
    createdAt,
    updatedAt: createdAt,
  };
}

function buildSubscriptionAssignment(database, planId, payload = {}, actorUserId = null) {
  const plan = getPlanRecord(database, planId, { includeInactive: true });

  if (!plan) {
    throw new Error('Invalid plan');
  }

  const start = toIsoDate(payload.currentPeriodStart) || nowIso();
  const defaultCycle = buildCycleWindow(start);
  const end = toIsoDate(payload.currentPeriodEnd) || defaultCycle.currentPeriodEnd;

  if (end < start) {
    throw new Error('Subscription end date must be after start date');
  }

  const requestedStatus = normalizeText(payload.status).toLowerCase();
  const status = SUBSCRIPTION_STATUS_VALUES.includes(requestedStatus)
    ? requestedStatus
    : 'active';
  const quotaOverride = normalizeInteger(payload.quotaOverride, null);

  return {
    planId: plan.id,
    status,
    source: normalizeText(payload.source) || (actorUserId ? 'manager' : 'self_signup'),
    currentPeriodStart: start,
    currentPeriodEnd: end,
    monthlyGenerationLimit: normalizeInteger(
      payload.monthlyGenerationLimit,
      plan.monthlyGenerationLimit
    ),
    quotaOverride,
    assignedByUserId: actorUserId,
    assignedAt: nowIso(),
    notes: normalizeText(payload.notes),
    canceledAt: status === 'canceled' ? nowIso() : null,
  };
}

function applySubscriptionToUser(database, user, nextSubscription) {
  const normalized = normalizeSubscription(database, user, nextSubscription, {
    fallbackStartMode: 'now',
  });

  user.subscription = normalized;
  user.planId = normalized.planId;
  user.updatedAt = nowIso();

  return sanitizeUser(database, user);
}

function buildManagerUserSummary(database, user) {
  const sanitized = sanitizeUser(database, user);
  const totalOrders = database.orders.filter(order => order.userId === user.id).length;

  return {
    ...sanitized,
    totalOrders,
  };
}

async function handleRegister(request, response) {
  const body = await readJsonBody(request);
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const name = normalizeText(body.name);
  const selectedPlanId = body.planId || DEFAULT_PLAN_ID;

  if (!name) return sendError(response, 400, 'Name is required');
  if (!email) return sendError(response, 400, 'Email is required');
  if (password.length < 8) {
    return sendError(response, 400, 'Password must be at least 8 characters long');
  }

  const rawToken = createSessionToken();

  const payload = mutateDatabase(database => {
    const existingUser = database.users.find(user => user.email === email);

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const selectedPlan = getPlanRecord(database, selectedPlanId, { includeInactive: false });
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

    const session = {
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(rawToken),
      createdAt: timestamp,
      expiresAt: new Date(
        Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
      ).toISOString(),
    };

    database.users.push(user);
    database.sessions.push(session);
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
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) {
    return sendError(response, 400, 'Email and password are required');
  }

  const database = loadDatabaseWithFreshSessions();
  const user = database.users.find(item => item.email === email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return sendError(response, 401, 'Invalid email or password');
  }

  const rawToken = createSessionToken();

  mutateDatabase(nextDatabase => {
    pruneExpiredSessions(nextDatabase);
    nextDatabase.sessions.push({
      id: randomUUID(),
      userId: user.id,
      tokenHash: hashToken(rawToken),
      createdAt: nowIso(),
      expiresAt: new Date(
        Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000
      ).toISOString(),
    });
  });

  const freshDatabase = loadDatabaseWithFreshSessions();
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

  mutateDatabase(database => {
    database.sessions = database.sessions.filter(
      session => session.tokenHash !== hashToken(token)
    );
  });

  sendJson(response, 200, { ok: true });
}

async function handleDeleteMe(request, response) {
  const context = getAuthContext(request, response);
  if (!context) return;

  mutateDatabase(database => {
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
  const context = getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const incomingProfile =
    body.profile && typeof body.profile === 'object' ? body.profile : body;

  const user = mutateDatabase(database => {
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

async function handleCreateOrder(request, response) {
  const context = getAuthContext(request, response);
  if (!context) return;

  const usage = buildUsage(context.database, context.user);
  if (usage.status !== 'active' && usage.status !== 'trial') {
    return sendError(response, 403, 'Subscription is not active', usage);
  }
  if (usage.used >= usage.limit) {
    return sendError(response, 403, 'Subscription limit reached', usage);
  }

  const body = await readJsonBody(request);

  const order = mutateDatabase(database => {
    const freshUser = findUserOrThrow(database, context.user.id);
    const freshUsage = buildUsage(database, freshUser);

    if (freshUsage.status !== 'active' && freshUsage.status !== 'trial') {
      throw new Error('Subscription is not active');
    }

    if (freshUsage.used >= freshUsage.limit) {
      throw new Error('Subscription limit reached');
    }

    const nextOrder = buildOrderRecord(body, freshUser);
    database.orders.push(nextOrder);
    appendAuditLog(database, {
      action: 'order.created',
      actorUserId: freshUser.id,
      targetUserId: freshUser.id,
      entityType: 'order',
      entityId: nextOrder.id,
      after: {
        orderNumber: nextOrder.orderNumber,
        status: nextOrder.status,
      },
    });

    return sanitizeOrder(nextOrder, database);
  });

  sendJson(response, 201, { order });
}

async function handleUpdateOrder(request, response, orderId) {
  const context = getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  const updatedOrder = mutateDatabase(database => {
    const order = database.orders.find(item => item.id === orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    const isOwner = order.userId === context.user.id;
    const isManager = hasManagerAccess(context.user.role);

    if (!isOwner && !isManager) {
      throw new Error('You do not have access to this order');
    }

    const before = {
      status: order.status,
      totalPrice: order.totalPrice,
      pdf: order.pdf,
    };

    if (typeof body.status === 'string' && body.status.trim()) {
      order.status = body.status.trim();
    }

    if (typeof body.totalPrice === 'string') {
      order.totalPrice = body.totalPrice;
    }

    if (body.pdfUrl || body.pdfFileName || body.pdf) {
      order.pdf = {
        ...order.pdf,
        ...(body.pdf || {}),
        ...(body.pdfUrl ? { url: body.pdfUrl } : {}),
        ...(body.pdfFileName ? { fileName: body.pdfFileName } : {}),
      };
    }

    if (body.contractData && typeof body.contractData === 'object') {
      order.contractData = body.contractData;
    }

    if (body.metadata && typeof body.metadata === 'object') {
      order.metadata = {
        ...order.metadata,
        ...body.metadata,
      };
    }

    order.updatedAt = nowIso();
    appendAuditLog(database, {
      action: 'order.updated',
      actorUserId: context.user.id,
      targetUserId: order.userId,
      entityType: 'order',
      entityId: order.id,
      before,
      after: {
        status: order.status,
        totalPrice: order.totalPrice,
        pdf: order.pdf,
      },
    });

    return sanitizeOrder(order, database);
  });

  sendJson(response, 200, { order: updatedOrder });
}

async function handleManagerUserList(request, response, url) {
  const context = requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const role = normalizeText(url.searchParams.get('role')).toLowerCase();
  const planId = normalizeText(url.searchParams.get('planId'));

  const users = context.database.users
    .filter(user => {
      const summary = sanitizeUser(context.database, user);
      const haystack = `${summary.name} ${summary.email}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      const matchesStatus = !status || status === 'all' || summary.subscription.status === status;
      const matchesRole = !role || role === 'all' || summary.role === role;
      const matchesPlan = !planId || planId === 'all' || summary.planId === planId;

      return matchesSearch && matchesStatus && matchesRole && matchesPlan;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .map(user => buildManagerUserSummary(context.database, user));

  return sendJson(response, 200, { users });
}

async function handleManagerUserDetail(request, response, userId) {
  const context = requireManager(request, response);
  if (!context) return;

  const target = context.database.users.find(user => user.id === userId);
  if (!target) {
    return sendError(response, 404, 'User not found');
  }

  const orders = context.database.orders
    .filter(order => order.userId === target.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 8)
    .map(order => sanitizeOrder(order, context.database));

  const audit = context.database.auditLogs
    .filter(record => record.targetUserId === target.id || record.actorUserId === target.id)
    .slice(0, 20)
    .map(record => sanitizeAuditLog(context.database, record));

  return sendJson(response, 200, {
    user: buildManagerUserSummary(context.database, target),
    recentOrders: orders,
    audit,
  });
}

async function handleManagerUserSubscription(request, response, userId) {
  const context = requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  const user = mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);
    const nextPlanId = body.planId || before.planId;
    const nextSubscription = buildSubscriptionAssignment(
      database,
      nextPlanId,
      {
        ...before,
        ...body,
        source: 'manager',
        monthlyGenerationLimit:
          body.monthlyGenerationLimit !== undefined &&
          body.monthlyGenerationLimit !== null &&
          body.monthlyGenerationLimit !== ''
            ? body.monthlyGenerationLimit
            : nextPlanId === before.planId
              ? before.monthlyGenerationLimit
              : undefined,
      },
      context.user.id
    );

    const updatedUser = applySubscriptionToUser(database, target, nextSubscription);
    appendAuditLog(database, {
      action: 'subscription.updated',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'subscription',
      entityId: target.id,
      before,
      after: updatedUser.subscription,
      meta: {
        planId: updatedUser.planId,
      },
    });

    return updatedUser;
  });

  return sendJson(response, 200, { user });
}

async function handleManagerUserExtend(request, response, userId) {
  const context = requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const months = Math.min(12, Math.max(1, normalizeInteger(body.months, 1)));

  const user = mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);
    const nextEnd = shiftMonths(before.currentPeriodEnd, months);

    const updatedUser = applySubscriptionToUser(database, target, {
      ...before,
      status: 'active',
      source: 'manager',
      currentPeriodEnd: nextEnd,
      assignedByUserId: context.user.id,
      assignedAt: nowIso(),
      notes: before.notes,
      canceledAt: null,
    });

    appendAuditLog(database, {
      action: 'subscription.extended',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'subscription',
      entityId: target.id,
      before,
      after: updatedUser.subscription,
      meta: { months },
    });

    return updatedUser;
  });

  return sendJson(response, 200, { user });
}

async function handleManagerUserCancel(request, response, userId) {
  const context = requireManager(request, response);
  if (!context) return;

  const user = mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);

    const updatedUser = applySubscriptionToUser(database, target, {
      ...before,
      status: 'canceled',
      source: 'manager',
      currentPeriodEnd: nowIso(),
      canceledAt: nowIso(),
      assignedByUserId: context.user.id,
      assignedAt: nowIso(),
    });

    appendAuditLog(database, {
      action: 'subscription.canceled',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'subscription',
      entityId: target.id,
      before,
      after: updatedUser.subscription,
    });

    return updatedUser;
  });

  return sendJson(response, 200, { user });
}

async function handleManagerUserRole(request, response, userId) {
  const context = requireAdmin(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const nextRole = normalizeText(body.role).toLowerCase();

  if (!ROLE_VALUES.includes(nextRole)) {
    return sendError(response, 400, 'Invalid role');
  }

  const user = mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const beforeRole = target.role;

    if (beforeRole === 'admin' && nextRole !== 'admin') {
      const adminCount = database.users.filter(item => item.role === 'admin').length;
      if (adminCount <= 1) {
        throw new Error('At least one admin is required');
      }
    }

    target.role = nextRole;
    target.updatedAt = nowIso();

    appendAuditLog(database, {
      action: 'user.role.updated',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'user',
      entityId: target.id,
      before: { role: beforeRole },
      after: { role: nextRole },
    });

    return sanitizeUser(database, target);
  });

  return sendJson(response, 200, { user });
}

async function handleManagerPlansList(request, response) {
  const context = requireManager(request, response);
  if (!context) return;

  return sendJson(response, 200, {
    plans: getDatabasePlans(context.database, { includeInactive: true }),
  });
}

async function handleManagerPlanCreate(request, response) {
  const context = requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const limit = normalizeInteger(body.monthlyGenerationLimit, 0);
  const name = normalizeText(body.name);

  if (!name) {
    return sendError(response, 400, 'Plan name is required');
  }

  if (limit <= 0) {
    return sendError(response, 400, 'Plan limit must be greater than 0');
  }

  const plan = mutateDatabase(database => {
    const planId = slugifyPlanId(body.id || name);

    if (database.plans.some(item => item.id === planId)) {
      throw new Error('Plan with this id already exists');
    }

    const nextPlan = normalizePlanRecord({
      id: planId,
      name,
      monthlyGenerationLimit: limit,
      description: body.description,
      isActive: body.isActive !== false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    database.plans.push(nextPlan);
    appendAuditLog(database, {
      action: 'plan.created',
      actorUserId: context.user.id,
      entityType: 'plan',
      entityId: nextPlan.id,
      after: nextPlan,
    });

    return nextPlan;
  });

  return sendJson(response, 201, { plan });
}

async function handleManagerPlanUpdate(request, response, planId) {
  const context = requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  const plan = mutateDatabase(database => {
    const target = database.plans.find(item => item.id === planId);
    if (!target) {
      throw new Error('Plan not found');
    }

    const before = { ...normalizePlanRecord(target) };

    if (body.name !== undefined) {
      target.name = normalizeText(body.name) || target.name;
    }
    if (body.description !== undefined) {
      target.description = normalizeText(body.description);
    }
    if (body.monthlyGenerationLimit !== undefined) {
      const nextLimit = normalizeInteger(body.monthlyGenerationLimit, target.monthlyGenerationLimit);
      if (nextLimit <= 0) {
        throw new Error('Plan limit must be greater than 0');
      }
      target.monthlyGenerationLimit = nextLimit;
    }
    if (body.isActive !== undefined) {
      target.isActive = body.isActive !== false;
    }
    target.updatedAt = nowIso();

    const after = normalizePlanRecord(target);
    appendAuditLog(database, {
      action: 'plan.updated',
      actorUserId: context.user.id,
      entityType: 'plan',
      entityId: target.id,
      before,
      after,
    });

    return after;
  });

  return sendJson(response, 200, { plan });
}

async function handleManagerAudit(request, response, url) {
  const context = requireManager(request, response);
  if (!context) return;

  const targetUserId = normalizeText(url.searchParams.get('targetUserId'));
  const limit = Math.min(100, Math.max(10, normalizeInteger(url.searchParams.get('limit'), 40)));

  const audit = context.database.auditLogs
    .filter(record => {
      return !targetUserId || record.targetUserId === targetUserId || record.actorUserId === targetUserId;
    })
    .slice(0, limit)
    .map(record => sanitizeAuditLog(context.database, record));

  return sendJson(response, 200, { audit });
}

function matchesManagerOrderStatus(order, status) {
  if (!status || status === 'all') return true;

  const value = String(order.status || '').toLowerCase();

  if (status === 'generated') {
    return value === 'pdf_generated';
  }

  if (status === 'failed') {
    return value.includes('fail');
  }

  if (status === 'pending') {
    return value !== 'pdf_generated' && !value.includes('fail');
  }

  return value === status;
}

function buildManagerOrdersSummary(orders) {
  return orders.reduce(
    (summary, order) => {
      summary.all += 1;

      if (matchesManagerOrderStatus(order, 'generated')) {
        summary.generated += 1;
      } else if (matchesManagerOrderStatus(order, 'failed')) {
        summary.failed += 1;
      } else {
        summary.pending += 1;
      }

      return summary;
    },
    {
      all: 0,
      pending: 0,
      failed: 0,
      generated: 0,
    }
  );
}

async function handleManagerOrders(request, response, url) {
  const context = requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const userId = normalizeText(url.searchParams.get('userId'));
  const limit = Math.min(200, Math.max(10, normalizeInteger(url.searchParams.get('limit'), 100)));

  const scopedOrders = context.database.orders
    .filter(order => {
      if (userId && order.userId !== userId) {
        return false;
      }

      if (!search) {
        return true;
      }

      const owner = context.database.users.find(user => user.id === order.userId);
      const haystack = [
        order.orderNumber,
        order.customer?.name,
        order.customer?.email,
        order.trip?.from,
        order.trip?.to,
        owner?.name,
        owner?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(search);
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  const summary = buildManagerOrdersSummary(scopedOrders);
  const orders = scopedOrders
    .filter(order => matchesManagerOrderStatus(order, status))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limit)
    .map(order => sanitizeOrder(order, context.database));

  return sendJson(response, 200, { orders, summary });
}

async function handleLegacyAdminUsers(request, response) {
  const context = requireAdmin(request, response);
  if (!context) return;

  const users = context.database.users.map(user => buildManagerUserSummary(context.database, user));
  return sendJson(response, 200, { users });
}

async function handleLegacyAdminOrders(request, response, url) {
  const context = requireAdmin(request, response);
  if (!context) return;

  const userId = url.searchParams.get('userId');
  const orders = context.database.orders
    .filter(order => (userId ? order.userId === userId : true))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(order => sanitizeOrder(order, context.database));

  return sendJson(response, 200, { orders });
}

async function handleLegacyAdminPlanUpdate(request, response, userId) {
  const context = requireAdmin(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const user = mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);
    const nextPlanId = body.planId || before.planId;
    const nextSubscription = buildSubscriptionAssignment(
      database,
      nextPlanId,
      {
        ...before,
        status: before.status === 'expired' ? 'active' : before.status,
        source: 'manager',
        monthlyGenerationLimit:
          nextPlanId === before.planId ? before.monthlyGenerationLimit : undefined,
      },
      context.user.id
    );

    const updatedUser = applySubscriptionToUser(database, target, nextSubscription);
    appendAuditLog(database, {
      action: 'subscription.updated',
      actorUserId: context.user.id,
      targetUserId: target.id,
      entityType: 'subscription',
      entityId: target.id,
      before,
      after: updatedUser.subscription,
    });

    return updatedUser;
  });

  return sendJson(response, 200, { user });
}

async function routeRequest(request, response) {
  if (handleCors(request, response)) return;
  if (!requireApiKey(request, response)) return;

  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const pathName = url.pathname;

  if (request.method === 'GET' && pathName === '/api/health') {
    return sendJson(response, 200, {
      ok: true,
      dataFile: getDataFilePath(),
      time: nowIso(),
    });
  }

  if (request.method === 'GET' && pathName === '/api/plans') {
    const database = loadDatabaseWithFreshSessions();
    return sendJson(response, 200, {
      plans: getDatabasePlans(database, { includeInactive: false }),
    });
  }

  if (request.method === 'POST' && pathName === '/api/auth/register') {
    return handleRegister(request, response);
  }

  if (request.method === 'POST' && pathName === '/api/auth/login') {
    return handleLogin(request, response);
  }

  if (request.method === 'POST' && pathName === '/api/auth/logout') {
    return handleLogout(request, response);
  }

  if (request.method === 'GET' && pathName === '/api/me') {
    const context = getAuthContext(request, response);
    if (!context) return;

    return sendJson(response, 200, {
      user: sanitizeUser(context.database, context.user),
    });
  }

  if (request.method === 'DELETE' && pathName === '/api/me') {
    return handleDeleteMe(request, response);
  }

  if (request.method === 'PATCH' && pathName === '/api/me/plan') {
    return sendError(
      response,
      403,
      'Self-service plan changes are disabled. Contact a manager.'
    );
  }

  if (request.method === 'PATCH' && pathName === '/api/me/profile') {
    return handleUpdateMyProfile(request, response);
  }

  if (request.method === 'GET' && pathName === '/api/me/usage') {
    const context = getAuthContext(request, response);
    if (!context) return;

    return sendJson(response, 200, {
      usage: buildUsage(context.database, context.user),
    });
  }

  if (request.method === 'POST' && pathName === '/api/contracts/get-pdf') {
    const body = await readJsonBody(request);
    const contractData = body.order || body.contractData || {};
    const pdfBuffer = createContractPdf(contractData);
    const fileName = `contract-${contractData.orderNumber || 'draft'}.pdf`;

    return sendPdf(response, 200, pdfBuffer, fileName);
  }

  if (request.method === 'POST' && pathName === '/api/orders') {
    return handleCreateOrder(request, response);
  }

  if (request.method === 'GET' && pathName === '/api/orders') {
    const context = getAuthContext(request, response);
    if (!context) return;

    const orders = context.database.orders
      .filter(order => order.userId === context.user.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(order => sanitizeOrder(order, context.database));

    return sendJson(response, 200, { orders });
  }

  if (pathName.startsWith('/api/orders/')) {
    const orderId = pathName.split('/').pop();

    if (request.method === 'GET') {
      const context = getAuthContext(request, response);
      if (!context) return;

      const order = context.database.orders.find(item => item.id === orderId);

      if (!order) {
        return sendError(response, 404, 'Order not found');
      }

      const isOwner = order.userId === context.user.id;
      const isManager = hasManagerAccess(context.user.role);

      if (!isOwner && !isManager) {
        return sendError(response, 403, 'You do not have access to this order');
      }

      return sendJson(response, 200, {
        order: sanitizeOrder(order, context.database),
      });
    }

    if (request.method === 'PATCH') {
      return handleUpdateOrder(request, response, orderId);
    }
  }

  if (request.method === 'GET' && pathName === '/api/manager/users') {
    return handleManagerUserList(request, response, url);
  }

  const managerUserMatch = pathName.match(/^\/api\/manager\/users\/([^/]+)$/);
  if (request.method === 'GET' && managerUserMatch) {
    return handleManagerUserDetail(request, response, managerUserMatch[1]);
  }

  const managerSubscriptionMatch = pathName.match(
    /^\/api\/manager\/users\/([^/]+)\/subscription$/
  );
  if (request.method === 'PATCH' && managerSubscriptionMatch) {
    return handleManagerUserSubscription(request, response, managerSubscriptionMatch[1]);
  }

  const managerExtendMatch = pathName.match(
    /^\/api\/manager\/users\/([^/]+)\/subscription\/extend$/
  );
  if (request.method === 'POST' && managerExtendMatch) {
    return handleManagerUserExtend(request, response, managerExtendMatch[1]);
  }

  const managerCancelMatch = pathName.match(
    /^\/api\/manager\/users\/([^/]+)\/subscription\/cancel$/
  );
  if (request.method === 'POST' && managerCancelMatch) {
    return handleManagerUserCancel(request, response, managerCancelMatch[1]);
  }

  const managerRoleMatch = pathName.match(/^\/api\/manager\/users\/([^/]+)\/role$/);
  if (request.method === 'PATCH' && managerRoleMatch) {
    return handleManagerUserRole(request, response, managerRoleMatch[1]);
  }

  if (request.method === 'GET' && pathName === '/api/manager/plans') {
    return handleManagerPlansList(request, response);
  }

  if (request.method === 'GET' && pathName === '/api/manager/orders') {
    return handleManagerOrders(request, response, url);
  }

  if (request.method === 'POST' && pathName === '/api/manager/plans') {
    return handleManagerPlanCreate(request, response);
  }

  const managerPlanMatch = pathName.match(/^\/api\/manager\/plans\/([^/]+)$/);
  if (request.method === 'PATCH' && managerPlanMatch) {
    return handleManagerPlanUpdate(request, response, managerPlanMatch[1]);
  }

  if (request.method === 'GET' && pathName === '/api/manager/audit') {
    return handleManagerAudit(request, response, url);
  }

  if (request.method === 'GET' && pathName === '/api/admin/users') {
    return handleLegacyAdminUsers(request, response);
  }

  if (request.method === 'GET' && pathName === '/api/admin/orders') {
    return handleLegacyAdminOrders(request, response, url);
  }

  const legacyAdminPlanMatch = pathName.match(/^\/api\/admin\/users\/([^/]+)\/plan$/);
  if (request.method === 'PATCH' && legacyAdminPlanMatch) {
    return handleLegacyAdminPlanUpdate(request, response, legacyAdminPlanMatch[1]);
  }

  return sendError(response, 404, 'Route not found');
}

const server = http.createServer(async (request, response) => {
  try {
    await routeRequest(request, response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected server error';

    if (
      message === 'User with this email already exists' ||
      message === 'Plan with this id already exists'
    ) {
      return sendError(response, 409, message);
    }

    if (
      message === 'Order not found' ||
      message === 'User not found' ||
      message === 'Route not found' ||
      message === 'Plan not found'
    ) {
      return sendError(response, 404, message);
    }

    if (
      message === 'Subscription limit reached' ||
      message === 'Subscription is not active' ||
      message === 'You do not have access to this order' ||
      message === 'At least one admin is required'
    ) {
      return sendError(response, 403, message);
    }

    if (
      message === 'Invalid JSON body' ||
      message === 'Request body is too large' ||
      message === 'Invalid plan' ||
      message === 'Invalid role' ||
      message === 'Subscription end date must be after start date' ||
      message === 'Plan limit must be greater than 0'
    ) {
      return sendError(response, 400, message);
    }

    console.error('Backend error:', error);
    return sendError(response, 500, message);
  }
});

server.listen(PORT, () => {
  console.log(`pdf.app backend is running on http://localhost:${PORT}`);
});
