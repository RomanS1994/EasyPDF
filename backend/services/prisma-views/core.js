import { DEFAULT_PLAN_ID, getPlanById } from '../../config/plans.js';
import { normalizeUserProfile } from '../profiles.js';
import { buildCurrentMonthWindow, buildCycleWindow } from '../subscriptions/cycle.js';
import {
  SUBSCRIPTION_STATUS_VALUES,
  formatDateShort,
  normalizeInteger,
  normalizeText,
  nowIso,
  toIsoDate,
} from '../../validation/common.js';

function toIsoString(value) {
  if (!value) return '';

  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return parsed.toISOString();
}

function getFallbackPlan(planId = DEFAULT_PLAN_ID) {
  const fallback = getPlanById(planId) || getPlanById(DEFAULT_PLAN_ID);

  if (!fallback) {
    return {
      id: DEFAULT_PLAN_ID,
      name: 'Free',
      monthlyGenerationLimit: 10,
      priceCzk: 0,
      description: '',
      pdfProfile: 'free',
      pdfQuality: 'basic',
      pdfDocuments: ['offer', 'confirmation'],
      isActive: true,
      createdAt: '',
      updatedAt: '',
    };
  }

  return {
    ...fallback,
    isActive: true,
    createdAt: '',
    updatedAt: '',
  };
}

export function normalizePlanView(plan) {
  const fallback = getFallbackPlan(plan?.id);
  const configuredPlan = plan?.id ? getPlanById(plan.id) : null;

  return {
    id: normalizeText(plan?.id) || fallback.id,
    name: normalizeText(plan?.name) || fallback.name,
    monthlyGenerationLimit: normalizeInteger(
      plan?.monthlyGenerationLimit,
      fallback.monthlyGenerationLimit
    ),
    priceCzk: normalizeInteger(plan?.priceCzk, configuredPlan?.priceCzk ?? fallback.priceCzk),
    description: normalizeText(plan?.description) || fallback.description,
    pdfProfile: normalizeText(plan?.pdfProfile) || configuredPlan?.pdfProfile || fallback.pdfProfile,
    pdfQuality: normalizeText(plan?.pdfQuality) || configuredPlan?.pdfQuality || fallback.pdfQuality,
    pdfDocuments:
      Array.isArray(plan?.pdfDocuments) && plan.pdfDocuments.length
        ? plan.pdfDocuments.map(item => normalizeText(item)).filter(Boolean)
        : configuredPlan?.pdfDocuments || fallback.pdfDocuments,
    isActive: plan?.isActive !== false,
    createdAt: toIsoString(plan?.createdAt) || fallback.createdAt,
    updatedAt: toIsoString(plan?.updatedAt) || fallback.updatedAt,
  };
}

function buildDefaultSubscriptionView(
  user,
  plan,
  { source = 'legacy_migration', startMode = 'month' } = {}
) {
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
    assignedAt: toIsoString(user?.createdAt) || nowIso(),
    notes: source === 'legacy_migration' ? 'Migrated from legacy plan field' : '',
    canceledAt: null,
    pendingPlanId: null,
    pendingRequestedAt: null,
    pendingSource: null,
  };
}

export function resolveSubscriptionView({
  user,
  subscription,
  plan,
  fallbackStartMode = 'month',
} = {}) {
  const resolvedPlan = normalizePlanView(plan || getFallbackPlan(subscription?.planId));
  const source =
    subscription && typeof subscription === 'object'
      ? subscription
      : buildDefaultSubscriptionView(user, resolvedPlan, {
          startMode: fallbackStartMode,
        });

  const status = SUBSCRIPTION_STATUS_VALUES.includes(source.status)
    ? source.status
    : 'active';
  const normalizedStatus = status === 'trial' ? 'active' : status;
  const requestedStart = toIsoDate(source.currentPeriodStart);
  const requestedEnd = toIsoDate(source.currentPeriodEnd);
  const defaultCycle = requestedStart && requestedEnd ? null : buildCycleWindow(requestedStart || nowIso());
  const currentPeriodStart = requestedStart || defaultCycle.currentPeriodStart;
  const currentPeriodEnd = requestedEnd || defaultCycle.currentPeriodEnd;
  const periodEnded = currentPeriodEnd < nowIso();
  const resolvedStatus =
    periodEnded && normalizedStatus === 'active' ? 'expired' : normalizedStatus;
  const monthlyGenerationLimit = normalizeInteger(
    source.monthlyGenerationLimit,
    resolvedPlan.monthlyGenerationLimit
  );
  const quotaOverride = normalizeInteger(source.quotaOverride, null);
  const effectiveLimit =
    quotaOverride !== null ? quotaOverride : monthlyGenerationLimit || resolvedPlan.monthlyGenerationLimit || 0;

  return {
    planId: normalizeText(source.planId) || resolvedPlan.id,
    status: resolvedStatus,
    source: normalizeText(source.source) || 'manager',
    currentPeriodStart,
    currentPeriodEnd,
    monthlyGenerationLimit,
    quotaOverride,
    assignedByUserId: source.assignedByUserId || null,
    assignedAt: toIsoDate(source.assignedAt) || nowIso(),
    notes: normalizeText(source.notes),
    canceledAt: toIsoDate(source.canceledAt) || null,
    pendingPlanId: normalizeText(source.pendingPlanId) || null,
    pendingRequestedAt:
      normalizeText(source.pendingPlanId)
        ? toIsoDate(source.pendingRequestedAt) || toIsoDate(source.assignedAt) || nowIso()
        : null,
    pendingSource: normalizeText(source.pendingSource) || null,
    plan: resolvedPlan,
    effectiveLimit,
    isAccessActive: resolvedStatus === 'active',
  };
}

export function buildUsageView(subscription, used = 0) {
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

export function buildSubscriptionWriteData({ plan, payload = {}, before = null, actorUserId = null } = {}) {
  const resolvedPlan = normalizePlanView(plan || getFallbackPlan(before?.planId));
  const requestedStart = toIsoDate(payload.currentPeriodStart) || before?.currentPeriodStart || nowIso();
  const defaultCycle = buildCycleWindow(requestedStart);
  const requestedEnd =
    toIsoDate(payload.currentPeriodEnd) ||
    before?.currentPeriodEnd ||
    defaultCycle.currentPeriodEnd;

  if (requestedEnd < requestedStart) {
    throw new Error('Subscription end date must be after start date');
  }

  const requestedStatus = normalizeText(payload.status || before?.status).toLowerCase();
  const status = SUBSCRIPTION_STATUS_VALUES.includes(requestedStatus)
    ? (requestedStatus === 'trial' ? 'active' : requestedStatus)
    : 'active';
  const quotaOverride = normalizeInteger(payload.quotaOverride, before?.quotaOverride ?? null);

  const nextPendingPlanId =
    Object.prototype.hasOwnProperty.call(payload, 'pendingPlanId')
      ? normalizeText(payload.pendingPlanId) || null
      : normalizeText(before?.pendingPlanId) || null;
  const nextPendingRequestedAt =
    Object.prototype.hasOwnProperty.call(payload, 'pendingRequestedAt')
      ? toIsoDate(payload.pendingRequestedAt) || null
      : toIsoDate(before?.pendingRequestedAt) || null;
  const nextPendingSource =
    Object.prototype.hasOwnProperty.call(payload, 'pendingSource')
      ? normalizeText(payload.pendingSource) || null
      : normalizeText(before?.pendingSource) || null;

  return {
    planId: resolvedPlan.id,
    status,
    source:
      normalizeText(payload.source) ||
      normalizeText(before?.source) ||
      (actorUserId ? 'manager' : 'self_signup'),
    currentPeriodStart: requestedStart,
    currentPeriodEnd: requestedEnd,
    monthlyGenerationLimit: normalizeInteger(
      payload.monthlyGenerationLimit,
      before?.monthlyGenerationLimit ?? resolvedPlan.monthlyGenerationLimit
    ),
    quotaOverride,
    assignedByUserId: actorUserId,
    assignedAt: nowIso(),
    notes: normalizeText(payload.notes ?? before?.notes),
    canceledAt: status === 'canceled' ? toIsoDate(payload.canceledAt) || nowIso() : null,
    pendingPlanId: nextPendingPlanId,
    pendingRequestedAt: nextPendingPlanId ? nextPendingRequestedAt || nowIso() : null,
    pendingSource: nextPendingPlanId ? nextPendingSource : null,
  };
}

export function sanitizeUserFromRecords({ user, subscription, plan, usedOrders = 0 } = {}) {
  const resolvedSubscription = resolveSubscriptionView({
    user,
    subscription,
    plan,
    fallbackStartMode: subscription ? 'now' : 'month',
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planId: resolvedSubscription.planId || DEFAULT_PLAN_ID,
    plan: resolvedSubscription.plan,
    profile: normalizeUserProfile(user.profile, user.name),
    subscription: {
      planId: resolvedSubscription.planId,
      status: resolvedSubscription.status,
      source: resolvedSubscription.source,
      currentPeriodStart: resolvedSubscription.currentPeriodStart,
      currentPeriodEnd: resolvedSubscription.currentPeriodEnd,
      monthlyGenerationLimit: resolvedSubscription.effectiveLimit,
      quotaOverride: resolvedSubscription.quotaOverride,
      assignedByUserId: resolvedSubscription.assignedByUserId,
      assignedAt: resolvedSubscription.assignedAt,
      notes: resolvedSubscription.notes,
      canceledAt: resolvedSubscription.canceledAt,
      isAccessActive: resolvedSubscription.isAccessActive,
      pendingPlanId: resolvedSubscription.pendingPlanId,
      pendingRequestedAt: resolvedSubscription.pendingRequestedAt,
      pendingSource: resolvedSubscription.pendingSource,
    },
    usage: buildUsageView(resolvedSubscription, usedOrders),
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
  };
}

export function sanitizeOrderFromRecords(order, owner = null) {
  const planId = owner?.subscription?.planId || DEFAULT_PLAN_ID;

  return {
    id: order.id,
    userId: order.userId,
    orderNumber: order.orderNumber,
    status: order.status,
    source: order.source,
    customer: order.customer || {},
    trip: order.trip || {},
    totalPrice: order.totalPrice,
    pdf: order.pdf || {},
    contractData: order.contractData || {},
    metadata: order.metadata || {},
    createdAt: toIsoString(order.createdAt),
    updatedAt: toIsoString(order.updatedAt),
    user: owner
      ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          planId,
          role: owner.role,
        }
      : null,
  };
}

export function buildManagerUserSummaryFromRecords({
  user,
  subscription,
  plan,
  usedOrders = 0,
  totalOrders = 0,
} = {}) {
  return {
    ...sanitizeUserFromRecords({
      user,
      subscription,
      plan,
      usedOrders,
    }),
    totalOrders,
  };
}

export function sanitizeAuditLogFromRecords(record, { actor = null, target = null } = {}) {
  return {
    id: record.id,
    action: record.action,
    actorUserId: record.actorUserId,
    targetUserId: record.targetUserId,
    entityType: record.entityType,
    entityId: record.entityId,
    before: record.before ?? null,
    after: record.after ?? null,
    meta: record.meta || {},
    createdAt: toIsoString(record.createdAt),
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
