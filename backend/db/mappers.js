import { DEFAULT_PLAN_ID } from '../config/plans.js';
import { normalizeUserProfile } from '../services/profiles.js';

function toIsoString(value) {
  return value ? new Date(value).toISOString() : null;
}

function toDate(value, fallback = new Date()) {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed;
}

export function mapPlanRecord(record) {
  return {
    id: record.id,
    name: record.name,
    monthlyGenerationLimit: record.monthlyGenerationLimit,
    description: record.description,
    isActive: record.isActive,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export function mapSubscriptionRecord(record) {
  if (!record) return null;

  return {
    id: record.id,
    planId: record.planId,
    status: record.status,
    source: record.source,
    currentPeriodStart: toIsoString(record.currentPeriodStart),
    currentPeriodEnd: toIsoString(record.currentPeriodEnd),
    monthlyGenerationLimit: record.monthlyGenerationLimit,
    quotaOverride: record.quotaOverride,
    assignedByUserId: record.assignedByUserId,
    assignedAt: toIsoString(record.assignedAt),
    notes: record.notes,
    canceledAt: toIsoString(record.canceledAt),
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export function mapUserRecord(record, subscription = null) {
  const mappedSubscription = mapSubscriptionRecord(subscription);

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
    planId: mappedSubscription?.planId || DEFAULT_PLAN_ID,
    profile: normalizeUserProfile(record.profile, record.name),
    subscription: mappedSubscription,
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export function mapSessionRecord(record) {
  return {
    id: record.id,
    userId: record.userId,
    tokenHash: record.tokenHash,
    createdAt: toIsoString(record.createdAt),
    expiresAt: toIsoString(record.expiresAt),
  };
}

export function mapOrderRecord(record) {
  return {
    id: record.id,
    userId: record.userId,
    orderNumber: record.orderNumber,
    status: record.status,
    source: record.source,
    customer: record.customer || {},
    trip: record.trip || {},
    totalPrice: record.totalPrice,
    pdf: record.pdf || {},
    contractData: record.contractData || {},
    metadata: record.metadata || {},
    createdAt: toIsoString(record.createdAt),
    updatedAt: toIsoString(record.updatedAt),
  };
}

export function mapAuditLogRecord(record) {
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
  };
}

export function serializePlanRecord(record) {
  return {
    id: record.id,
    name: record.name,
    monthlyGenerationLimit: Number(record.monthlyGenerationLimit || 0),
    description: record.description || '',
    isActive: record.isActive !== false,
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
  };
}

export function serializeUserRecord(record) {
  return {
    id: record.id,
    name: record.name || '',
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
    profile: normalizeUserProfile(record.profile, record.name),
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
  };
}

export function serializeSubscriptionRecord(userRecord) {
  const subscription = userRecord.subscription;
  if (!subscription) return null;

  return {
    id: subscription.id || userRecord.id,
    userId: userRecord.id,
    planId: subscription.planId || userRecord.planId || DEFAULT_PLAN_ID,
    status: subscription.status || 'active',
    source: subscription.source || 'manager',
    currentPeriodStart: toDate(subscription.currentPeriodStart),
    currentPeriodEnd: toDate(subscription.currentPeriodEnd),
    monthlyGenerationLimit: Number(subscription.monthlyGenerationLimit || 0),
    quotaOverride:
      subscription.quotaOverride === null || subscription.quotaOverride === undefined
        ? null
        : Number(subscription.quotaOverride),
    assignedByUserId: subscription.assignedByUserId || null,
    assignedAt: toDate(subscription.assignedAt),
    notes: subscription.notes || '',
    canceledAt: subscription.canceledAt ? toDate(subscription.canceledAt) : null,
    createdAt: toDate(subscription.createdAt || userRecord.createdAt),
    updatedAt: toDate(subscription.updatedAt || userRecord.updatedAt),
  };
}

export function extractSubscriptionRecords(userRecords) {
  return userRecords
    .map(userRecord => serializeSubscriptionRecord(userRecord))
    .filter(Boolean);
}

export function serializeSessionRecord(record) {
  return {
    id: record.id,
    userId: record.userId,
    tokenHash: record.tokenHash,
    createdAt: toDate(record.createdAt),
    expiresAt: toDate(record.expiresAt),
  };
}

export function serializeOrderRecord(record) {
  return {
    id: record.id,
    userId: record.userId,
    orderNumber: record.orderNumber || '',
    status: record.status || 'created',
    source: record.source || 'pdf-app',
    customer: record.customer || {},
    trip: record.trip || {},
    totalPrice: record.totalPrice || '',
    pdf: record.pdf || {},
    contractData: record.contractData || {},
    metadata: record.metadata || {},
    createdAt: toDate(record.createdAt),
    updatedAt: toDate(record.updatedAt),
  };
}

export function serializeAuditLogRecord(record) {
  return {
    id: record.id,
    action: record.action,
    actorUserId: record.actorUserId || null,
    targetUserId: record.targetUserId || null,
    entityType: record.entityType,
    entityId: record.entityId || null,
    before: record.before ?? null,
    after: record.after ?? null,
    meta: record.meta || {},
    createdAt: toDate(record.createdAt),
  };
}
