import { DEFAULT_PLAN_ID } from '../config/plans.js';
import { getPlanRecord } from './plans.js';
import { normalizeUserProfile } from './profiles.js';
import { buildUsage, getResolvedSubscription } from './subscriptions.js';

export function sanitizeUser(database, user) {
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
      pendingPlanId: subscription.pendingPlanId,
      pendingRequestedAt: subscription.pendingRequestedAt,
      pendingSource: subscription.pendingSource,
    },
    usage: buildUsage(database, user),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function findUserOrThrow(database, userId) {
  const target = database.users.find(user => user.id === userId);

  if (!target) {
    throw new Error('User not found');
  }

  return target;
}

export function buildManagerUserSummary(database, user) {
  const sanitized = sanitizeUser(database, user);
  const totalOrders = database.orders.filter(order => order.userId === user.id).length;

  return {
    ...sanitized,
    totalOrders,
  };
}
