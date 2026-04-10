import { DEFAULT_PLAN_ID, PLANS as DEFAULT_PLANS } from '../config/plans.js';
import {
  SUBSCRIPTION_STATUS_VALUES,
  formatDateShort,
  isIsoWithinRange,
  normalizeInteger,
  normalizeText,
  nowIso,
  toIsoDate,
} from '../validation/common.js';
import {
  getDatabasePlans,
  getPlanRecord,
  normalizePlanRecord,
} from './plans.js';

export function buildCycleWindow(startIso = nowIso()) {
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

export function buildCurrentMonthWindow() {
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

export function buildDefaultSubscription(
  database,
  user,
  { source = 'legacy_migration', startMode = 'month' } = {}
) {
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

export function normalizeSubscription(
  database,
  user,
  subscription,
  { fallbackStartMode = 'month' } = {}
) {
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

export function getResolvedSubscription(database, user) {
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

export function buildUsage(database, user) {
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

export function buildSubscriptionAssignment(
  database,
  planId,
  payload = {},
  actorUserId = null
) {
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

export function applySubscriptionToUser(database, user, nextSubscription) {
  const normalized = normalizeSubscription(database, user, nextSubscription, {
    fallbackStartMode: 'now',
  });

  user.subscription = normalized;
  user.planId = normalized.planId;
  user.updatedAt = nowIso();

  return user;
}
