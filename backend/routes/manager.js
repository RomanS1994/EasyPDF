import { appendAuditLog, sanitizeAuditLog } from '../audit/service.js';
import {
  requireAdmin,
  requireManager,
} from '../auth/context.js';
import { mutateFileDatabase as mutateDatabase } from '../db/file-store.js';
import {
  buildManagerUserSummaries,
  buildSanitizedUser,
  createAuditLog,
  ORDER_WITH_OWNER_INCLUDE,
  sanitizeAuditLogs,
  sanitizeOrderRecord,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import {
  findStoredPlan,
  listStoredPlans,
} from '../db/plans-store.js';
import { prisma } from '../db/prisma.js';
import { runStoreTransaction } from '../db/store.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import {
  buildManagerOrdersSummary,
  matchesManagerOrderStatus,
  sanitizeOrder,
} from '../services/orders.js';
import {
  getDatabasePlans,
  normalizePlanRecord,
  slugifyPlanId,
} from '../services/plans.js';
import {
  buildSubscriptionWriteData,
  normalizePlanView,
  resolveSubscriptionView,
} from '../services/prisma-views.js';
import {
  applySubscriptionToUser,
  buildSubscriptionAssignment,
  getResolvedSubscription,
} from '../services/subscriptions.js';
import {
  buildManagerUserSummary,
  findUserOrThrow,
  sanitizeUser,
} from '../services/users.js';
import {
  normalizeInteger,
  normalizeText,
  nowIso,
  shiftMonths,
} from '../validation/common.js';
import {
  resolveExtensionMonths,
  validatePlanCreateInput,
  validateRoleValue,
} from '../validation/manager.js';

async function handleManagerUserList(request, response, url) {
  const context = await requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const role = normalizeText(url.searchParams.get('role')).toLowerCase();
  const planId = normalizeText(url.searchParams.get('planId'));

  if (context.store === 'prisma') {
    const where = {
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(!role || role === 'all' ? {} : { role }),
      ...(!planId || planId === 'all'
        ? {}
        : {
            subscription: {
              is: {
                planId,
              },
            },
          }),
    };

    const rawUsers = await prisma.user.findMany({
      where,
      include: USER_WITH_SUBSCRIPTION_INCLUDE,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    let users = await buildManagerUserSummaries(prisma, rawUsers);

    if (status && status !== 'all') {
      users = users.filter(user => user.subscription.status === status);
    }

    sendJson(response, 200, { users });
    return;
  }

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

  sendJson(response, 200, { users });
}

async function handleManagerUserDetail(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  if (context.store === 'prisma') {
    const target = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: USER_WITH_SUBSCRIPTION_INCLUDE,
    });

    if (!target) {
      throw new Error('User not found');
    }

    const [summary, recentOrders, auditRecords] = await Promise.all([
      buildManagerUserSummaries(prisma, [target]),
      prisma.order.findMany({
        where: {
          userId: target.id,
        },
        include: ORDER_WITH_OWNER_INCLUDE,
        orderBy: {
          createdAt: 'desc',
        },
        take: 8,
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            {
              targetUserId: target.id,
            },
            {
              actorUserId: target.id,
            },
          ],
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      }),
    ]);

    sendJson(response, 200, {
      user: summary[0] || (await buildSanitizedUser(prisma, target)),
      recentOrders: recentOrders.map(sanitizeOrderRecord),
      audit: await sanitizeAuditLogs(prisma, auditRecords),
    });
    return;
  }

  const target = context.database.users.find(user => user.id === userId);
  if (!target) {
    throw new Error('User not found');
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

  sendJson(response, 200, {
    user: buildManagerUserSummary(context.database, target),
    recentOrders: orders,
    audit,
  });
}

async function handleManagerUserSubscription(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  if (context.store === 'prisma') {
    const user = await runStoreTransaction({
      prisma: async tx => {
        const target = await tx.user.findUnique({
          where: {
            id: userId,
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        if (!target) {
          throw new Error('User not found');
        }

        const before = resolveSubscriptionView({
          user: target,
          subscription: target.subscription,
          plan: target.subscription?.plan,
          fallbackStartMode: target.subscription ? 'now' : 'month',
        });
        const nextPlanId = body.planId || before.planId;
        const selectedPlan = await findStoredPlan(tx, nextPlanId);

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const subscriptionData = buildSubscriptionWriteData({
          plan: selectedPlan,
          before,
          payload: {
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
          actorUserId: context.user.id,
        });

        await tx.subscription.upsert({
          where: {
            userId: target.id,
          },
          update: {
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: subscriptionData.canceledAt
              ? new Date(subscriptionData.canceledAt)
              : null,
          },
          create: {
            id: target.id,
            userId: target.id,
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: subscriptionData.canceledAt
              ? new Date(subscriptionData.canceledAt)
              : null,
          },
        });

        const updatedUser = await tx.user.update({
          where: {
            id: target.id,
          },
          data: {
            updatedAt: new Date(nowIso()),
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        const userView = await buildSanitizedUser(tx, updatedUser);
        await createAuditLog(tx, {
          action: 'subscription.updated',
          actorUserId: context.user.id,
          targetUserId: updatedUser.id,
          entityType: 'subscription',
          entityId: updatedUser.id,
          before,
          after: userView.subscription,
          meta: {
            planId: userView.planId,
          },
        });

        return userView;
      },
      file: () =>
        mutateDatabase(database => {
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

          const updatedUser = sanitizeUser(
            database,
            applySubscriptionToUser(database, target, nextSubscription)
          );
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
        }),
    });

    sendJson(response, 200, { user });
    return;
  }

  const user = await mutateDatabase(database => {
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

    const updatedUser = sanitizeUser(
      database,
      applySubscriptionToUser(database, target, nextSubscription)
    );
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

  sendJson(response, 200, { user });
}

async function handleManagerUserExtend(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const months = resolveExtensionMonths(body.months);

  if (context.store === 'prisma') {
    const user = await runStoreTransaction({
      prisma: async tx => {
        const target = await tx.user.findUnique({
          where: {
            id: userId,
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        if (!target) {
          throw new Error('User not found');
        }

        const before = resolveSubscriptionView({
          user: target,
          subscription: target.subscription,
          plan: target.subscription?.plan,
          fallbackStartMode: target.subscription ? 'now' : 'month',
        });
        const nextEnd = shiftMonths(before.currentPeriodEnd, months);
        const selectedPlan = target.subscription?.plan || (await findStoredPlan(tx, before.planId));

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const subscriptionData = buildSubscriptionWriteData({
          plan: selectedPlan,
          before,
          payload: {
            ...before,
            status: 'active',
            source: 'manager',
            currentPeriodEnd: nextEnd,
            notes: before.notes,
            canceledAt: null,
          },
          actorUserId: context.user.id,
        });

        await tx.subscription.upsert({
          where: {
            userId: target.id,
          },
          update: {
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: null,
          },
          create: {
            id: target.id,
            userId: target.id,
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: null,
          },
        });

        const updatedUser = await tx.user.update({
          where: {
            id: target.id,
          },
          data: {
            updatedAt: new Date(nowIso()),
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        const userView = await buildSanitizedUser(tx, updatedUser);
        await createAuditLog(tx, {
          action: 'subscription.extended',
          actorUserId: context.user.id,
          targetUserId: updatedUser.id,
          entityType: 'subscription',
          entityId: updatedUser.id,
          before,
          after: userView.subscription,
          meta: { months },
        });

        return userView;
      },
      file: () =>
        mutateDatabase(database => {
          const target = findUserOrThrow(database, userId);
          const before = getResolvedSubscription(database, target);
          const nextEnd = shiftMonths(before.currentPeriodEnd, months);

          const updatedUser = sanitizeUser(
            database,
            applySubscriptionToUser(database, target, {
              ...before,
              status: 'active',
              source: 'manager',
              currentPeriodEnd: nextEnd,
              assignedByUserId: context.user.id,
              assignedAt: nowIso(),
              notes: before.notes,
              canceledAt: null,
            })
          );

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
        }),
    });

    sendJson(response, 200, { user });
    return;
  }

  const user = await mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);
    const nextEnd = shiftMonths(before.currentPeriodEnd, months);

    const updatedUser = sanitizeUser(
      database,
      applySubscriptionToUser(database, target, {
        ...before,
        status: 'active',
        source: 'manager',
        currentPeriodEnd: nextEnd,
        assignedByUserId: context.user.id,
        assignedAt: nowIso(),
        notes: before.notes,
        canceledAt: null,
      })
    );

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

  sendJson(response, 200, { user });
}

async function handleManagerUserCancel(request, response, userId) {
  const context = await requireManager(request, response);
  if (!context) return;

  if (context.store === 'prisma') {
    const user = await runStoreTransaction({
      prisma: async tx => {
        const target = await tx.user.findUnique({
          where: {
            id: userId,
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        if (!target) {
          throw new Error('User not found');
        }

        const before = resolveSubscriptionView({
          user: target,
          subscription: target.subscription,
          plan: target.subscription?.plan,
          fallbackStartMode: target.subscription ? 'now' : 'month',
        });
        const canceledAt = nowIso();
        const selectedPlan = target.subscription?.plan || (await findStoredPlan(tx, before.planId));

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const subscriptionData = buildSubscriptionWriteData({
          plan: selectedPlan,
          before,
          payload: {
            ...before,
            status: 'canceled',
            source: 'manager',
            currentPeriodEnd: canceledAt,
            canceledAt,
          },
          actorUserId: context.user.id,
        });

        await tx.subscription.upsert({
          where: {
            userId: target.id,
          },
          update: {
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: new Date(subscriptionData.canceledAt),
          },
          create: {
            id: target.id,
            userId: target.id,
            planId: subscriptionData.planId,
            status: subscriptionData.status,
            source: subscriptionData.source,
            currentPeriodStart: new Date(subscriptionData.currentPeriodStart),
            currentPeriodEnd: new Date(subscriptionData.currentPeriodEnd),
            monthlyGenerationLimit: subscriptionData.monthlyGenerationLimit,
            quotaOverride: subscriptionData.quotaOverride,
            assignedByUserId: subscriptionData.assignedByUserId,
            assignedAt: new Date(subscriptionData.assignedAt),
            notes: subscriptionData.notes,
            canceledAt: new Date(subscriptionData.canceledAt),
          },
        });

        const updatedUser = await tx.user.update({
          where: {
            id: target.id,
          },
          data: {
            updatedAt: new Date(nowIso()),
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        const userView = await buildSanitizedUser(tx, updatedUser);
        await createAuditLog(tx, {
          action: 'subscription.canceled',
          actorUserId: context.user.id,
          targetUserId: updatedUser.id,
          entityType: 'subscription',
          entityId: updatedUser.id,
          before,
          after: userView.subscription,
        });

        return userView;
      },
      file: () =>
        mutateDatabase(database => {
          const target = findUserOrThrow(database, userId);
          const before = getResolvedSubscription(database, target);

          const updatedUser = sanitizeUser(
            database,
            applySubscriptionToUser(database, target, {
              ...before,
              status: 'canceled',
              source: 'manager',
              currentPeriodEnd: nowIso(),
              canceledAt: nowIso(),
              assignedByUserId: context.user.id,
              assignedAt: nowIso(),
            })
          );

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
        }),
    });

    sendJson(response, 200, { user });
    return;
  }

  const user = await mutateDatabase(database => {
    const target = findUserOrThrow(database, userId);
    const before = getResolvedSubscription(database, target);

    const updatedUser = sanitizeUser(
      database,
      applySubscriptionToUser(database, target, {
        ...before,
        status: 'canceled',
        source: 'manager',
        currentPeriodEnd: nowIso(),
        canceledAt: nowIso(),
        assignedByUserId: context.user.id,
        assignedAt: nowIso(),
      })
    );

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

  sendJson(response, 200, { user });
}

async function handleManagerUserRole(request, response, userId) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const nextRole = validateRoleValue(body.role);

  if (context.store === 'prisma') {
    const user = await runStoreTransaction({
      prisma: async tx => {
        const target = await tx.user.findUnique({
          where: {
            id: userId,
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        if (!target) {
          throw new Error('User not found');
        }

        const beforeRole = target.role;

        if (beforeRole === 'admin' && nextRole !== 'admin') {
          const adminCount = await tx.user.count({
            where: {
              role: 'admin',
            },
          });
          if (adminCount <= 1) {
            throw new Error('At least one admin is required');
          }
        }

        const updatedUser = await tx.user.update({
          where: {
            id: target.id,
          },
          data: {
            role: nextRole,
            updatedAt: new Date(nowIso()),
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        await createAuditLog(tx, {
          action: 'user.role.updated',
          actorUserId: context.user.id,
          targetUserId: updatedUser.id,
          entityType: 'user',
          entityId: updatedUser.id,
          before: { role: beforeRole },
          after: { role: nextRole },
        });

        return buildSanitizedUser(tx, updatedUser);
      },
      file: () =>
        mutateDatabase(database => {
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
        }),
    });

    sendJson(response, 200, { user });
    return;
  }

  const user = await mutateDatabase(database => {
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

  sendJson(response, 200, { user });
}

async function handleManagerPlansList(request, response) {
  const context = await requireManager(request, response);
  if (!context) return;

  if (context.store === 'prisma') {
    sendJson(response, 200, {
      plans: await listStoredPlans(prisma, { includeInactive: true }),
    });
    return;
  }

  sendJson(response, 200, {
    plans: getDatabasePlans(context.database, { includeInactive: true }),
  });
}

async function handleManagerPlanCreate(request, response) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const { limit, name } = validatePlanCreateInput(body);

  if (context.store === 'prisma') {
    const plan = await runStoreTransaction({
      prisma: async tx => {
        const planId = slugifyPlanId(body.id || name);
        const existingPlan = await findStoredPlan(tx, planId);

        if (existingPlan) {
          throw new Error('Plan with this id already exists');
        }

        const nextPlan = await tx.plan.create({
          data: {
            id: planId,
            name,
            monthlyGenerationLimit: limit,
            description: body.description || '',
            isActive: body.isActive !== false,
            createdAt: new Date(nowIso()),
            updatedAt: new Date(nowIso()),
          },
        });

        const normalized = normalizePlanView(nextPlan);
        await createAuditLog(tx, {
          action: 'plan.created',
          actorUserId: context.user.id,
          entityType: 'plan',
          entityId: nextPlan.id,
          after: normalized,
        });

        return normalized;
      },
      file: () =>
        mutateDatabase(database => {
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
        }),
    });

    sendJson(response, 201, { plan });
    return;
  }

  const plan = await mutateDatabase(database => {
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

  sendJson(response, 201, { plan });
}

async function handleManagerPlanUpdate(request, response, planId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  if (context.store === 'prisma') {
    const plan = await runStoreTransaction({
      prisma: async tx => {
        const target = await findStoredPlan(tx, planId);

        if (!target) {
          throw new Error('Plan not found');
        }

        const before = normalizePlanView(target);
        const nextLimit =
          body.monthlyGenerationLimit !== undefined
            ? normalizeInteger(body.monthlyGenerationLimit, target.monthlyGenerationLimit)
            : target.monthlyGenerationLimit;

        if (nextLimit <= 0) {
          throw new Error('Plan limit must be greater than 0');
        }

        const updated = await tx.plan.update({
          where: {
            id: planId,
          },
          data: {
            ...(body.name !== undefined
              ? { name: normalizeText(body.name) || target.name }
              : {}),
            ...(body.description !== undefined
              ? { description: normalizeText(body.description) }
              : {}),
            ...(body.monthlyGenerationLimit !== undefined
              ? { monthlyGenerationLimit: nextLimit }
              : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
            updatedAt: new Date(nowIso()),
          },
        });

        const after = normalizePlanView(updated);
        await createAuditLog(tx, {
          action: 'plan.updated',
          actorUserId: context.user.id,
          entityType: 'plan',
          entityId: updated.id,
          before,
          after,
        });

        return after;
      },
      file: () =>
        mutateDatabase(database => {
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
        }),
    });

    sendJson(response, 200, { plan });
    return;
  }

  const plan = await mutateDatabase(database => {
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

  sendJson(response, 200, { plan });
}

async function handleManagerAudit(request, response, url) {
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

async function handleManagerOrders(request, response, url) {
  const context = await requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const userId = normalizeText(url.searchParams.get('userId'));
  const limit = Math.min(200, Math.max(10, normalizeInteger(url.searchParams.get('limit'), 100)));

  if (context.store === 'prisma') {
    const candidateOrders = await prisma.order.findMany({
      where: userId
        ? {
            userId,
          }
        : undefined,
      include: ORDER_WITH_OWNER_INCLUDE,
      orderBy: {
        createdAt: 'desc',
      },
      take: search ? Math.max(limit * 5, 250) : Math.max(limit, 100),
    });

    const scopedOrders = candidateOrders.filter(order => {
      if (!search) {
        return true;
      }

      const owner = order.user;
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
    });

    const summary = buildManagerOrdersSummary(scopedOrders);
    const orders = scopedOrders
      .filter(order => matchesManagerOrderStatus(order, status))
      .slice(0, limit)
      .map(sanitizeOrderRecord);

    sendJson(response, 200, { orders, summary });
    return;
  }

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

  sendJson(response, 200, { orders, summary });
}

export async function handleManagerRoutes(request, response, { pathName, url }) {
  if (request.method === 'GET' && pathName === '/api/manager/users') {
    await handleManagerUserList(request, response, url);
    return true;
  }

  const managerUserMatch = pathName.match(/^\/api\/manager\/users\/([^/]+)$/);
  if (request.method === 'GET' && managerUserMatch) {
    await handleManagerUserDetail(request, response, managerUserMatch[1]);
    return true;
  }

  const managerSubscriptionMatch = pathName.match(
    /^\/api\/manager\/users\/([^/]+)\/subscription$/
  );
  if (request.method === 'PATCH' && managerSubscriptionMatch) {
    await handleManagerUserSubscription(request, response, managerSubscriptionMatch[1]);
    return true;
  }

  const managerExtendMatch = pathName.match(
    /^\/api\/manager\/users\/([^/]+)\/subscription\/extend$/
  );
  if (request.method === 'POST' && managerExtendMatch) {
    await handleManagerUserExtend(request, response, managerExtendMatch[1]);
    return true;
  }

  const managerCancelMatch = pathName.match(
    /^\/api\/manager\/users\/([^/]+)\/subscription\/cancel$/
  );
  if (request.method === 'POST' && managerCancelMatch) {
    await handleManagerUserCancel(request, response, managerCancelMatch[1]);
    return true;
  }

  const managerRoleMatch = pathName.match(/^\/api\/manager\/users\/([^/]+)\/role$/);
  if (request.method === 'PATCH' && managerRoleMatch) {
    await handleManagerUserRole(request, response, managerRoleMatch[1]);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/manager/plans') {
    await handleManagerPlansList(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/manager/orders') {
    await handleManagerOrders(request, response, url);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/manager/plans') {
    await handleManagerPlanCreate(request, response);
    return true;
  }

  const managerPlanMatch = pathName.match(/^\/api\/manager\/plans\/([^/]+)$/);
  if (request.method === 'PATCH' && managerPlanMatch) {
    await handleManagerPlanUpdate(request, response, managerPlanMatch[1]);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/manager/audit') {
    await handleManagerAudit(request, response, url);
    return true;
  }

  return false;
}
