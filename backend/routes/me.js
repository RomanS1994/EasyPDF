import { randomUUID } from 'node:crypto';

import { getAuthContext } from '../auth/context.js';
import { DEFAULT_PLAN_ID } from '../config/plans.js';
import {
  buildSanitizedUser,
  createAuditLog,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import { prisma } from '../db/prisma.js';
import { findStoredPlan } from '../db/plans-store.js';
import { runStoreTransaction } from '../db/store.js';
import {
  readJsonBody,
  sendError,
  sendJson,
} from '../lib/http.js';
import { normalizeTeamDriverIds, normalizeUserProfile } from '../services/profiles.js';
import { requireTeamFeatureAccess } from '../services/team-access.js';
import {
  buildSubscriptionWriteData,
  countDeletedMessages,
  resolveSubscriptionView,
} from '../services/prisma-views.js';
import { normalizePhoneNumber, normalizeText, nowIso } from '../validation/common.js';
import { buildCurrentMonthWindow } from '../services/subscriptions/cycle.js';

const TEAM_DRIVER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  profile: true,
  updatedAt: true,
};

const TEAM_WITH_MEMBERS_INCLUDE = {
  members: {
    select: {
      userId: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
};

function sanitizeTeamDriver(user) {
  const profile = normalizeUserProfile(user.profile, user.name);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    avatarUrl: profile.avatarUrl,
    profile: {
      avatarUrl: profile.avatarUrl,
      driver: profile.driver,
    },
    updatedAt:
      user.updatedAt instanceof Date ? user.updatedAt.toISOString() : String(user.updatedAt || ''),
  };
}

function toIsoString(value) {
  if (!value) return '';

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function sanitizeTeamRecord(team) {
  return {
    id: team.id,
    name: team.name,
    driverIds: (team.members || []).map(member => member.userId).filter(Boolean),
    createdAt: toIsoString(team.createdAt),
    updatedAt: toIsoString(team.updatedAt),
  };
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeTeamId(value, ownerUserId) {
  const id = normalizeText(value);
  if (!id) {
    return randomUUID();
  }

  if (isUuidLike(id) || id.startsWith(`${ownerUserId}-`)) {
    return id;
  }

  return `${ownerUserId}-${id}`;
}

function normalizeTeamRecords(value, ownerUserId) {
  const source = Array.isArray(value) ? value : [];
  const seen = new Set();
  const teams = [];

  for (const item of source) {
    const team = item && typeof item === 'object' ? item : {};
    let id = normalizeTeamId(team.id, ownerUserId);

    if (seen.has(id)) {
      id = `${id}-${teams.length + 1}`;
    }

    seen.add(id);
    teams.push({
      id,
      name: normalizeText(team.name) || `Team ${teams.length + 1}`,
      driverIds: normalizeTeamDriverIds(team.driverIds ?? team.teamDriverIds),
    });
  }

  return teams;
}

function filterTeamDrivers(teams, availableDriverIds) {
  return teams.map(team => ({
    ...team,
    driverIds: team.driverIds.filter(driverId => availableDriverIds.has(driverId)),
  }));
}

function getActiveTeam(teams, activeTeamId) {
  return teams.find(team => team.id === activeTeamId) || teams[0] || null;
}

async function loadAvailableTeamDrivers(client) {
  const users = await client.user.findMany({
    where: {
      role: {
        in: ['user', 'manager'],
      },
    },
    select: TEAM_DRIVER_SELECT,
    orderBy: [
      {
        name: 'asc',
      },
      {
        email: 'asc',
      },
    ],
  });

  return users.map(sanitizeTeamDriver);
}

async function loadUserTeams(client, ownerUserId) {
  const teams = await client.team.findMany({
    where: {
      ownerUserId,
    },
    include: TEAM_WITH_MEMBERS_INCLUDE,
    orderBy: [
      {
        createdAt: 'asc',
      },
      {
        name: 'asc',
      },
    ],
  });

  return teams.map(sanitizeTeamRecord);
}

async function handleGetMyTeam(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;
  requireTeamFeatureAccess(context.user);

  const [drivers, storedTeams] = await Promise.all([
    loadAvailableTeamDrivers(prisma),
    loadUserTeams(prisma, context.user.id),
  ]);
  const availableDriverIds = new Set(drivers.map(driver => driver.id));
  const teams = filterTeamDrivers(storedTeams, availableDriverIds);
  const activeTeam = getActiveTeam(teams, context.user.activeTeamId);
  const activeTeamId = activeTeam?.id || '';
  const teamDriverIds = activeTeam?.driverIds || [];

  sendJson(response, 200, {
    activeTeamId,
    teamDriverIds,
    teams,
    drivers,
  });
}

async function handleUpdateMyTeam(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;
  requireTeamFeatureAccess(context.user);

  const body = await readJsonBody(request);

  const result = await runStoreTransaction({
    prisma: async tx => {
      const [target, drivers] = await Promise.all([
        tx.user.findUnique({
          where: {
            id: context.user.id,
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        }),
        loadAvailableTeamDrivers(tx),
      ]);

      if (!target) {
        throw new Error('User not found');
      }

      const currentTeams = await loadUserTeams(tx, target.id);
      const availableDriverIds = new Set(drivers.map(driver => driver.id));
      const hasTeamListInput = Array.isArray(body.teams);
      const hasDriverIdsInput =
        Object.prototype.hasOwnProperty.call(body, 'driverIds') ||
        Object.prototype.hasOwnProperty.call(body, 'teamDriverIds');
      const requestedActiveTeamId = normalizeText(
        body.activeTeamId ?? target.activeTeamId
      );
      let requestedTeams = hasTeamListInput
        ? normalizeTeamRecords(body.teams, target.id)
        : filterTeamDrivers(currentTeams, availableDriverIds);

      if (hasDriverIdsInput) {
        const requestedDriverIds = normalizeTeamDriverIds(body.driverIds ?? body.teamDriverIds);
        const activeTeam = getActiveTeam(requestedTeams, requestedActiveTeamId);

        if (activeTeam) {
          requestedTeams = requestedTeams.map(team =>
            team.id === activeTeam.id ? { ...team, driverIds: requestedDriverIds } : team
          );
        } else if (requestedDriverIds.length) {
          requestedTeams = [
            {
              id: `${target.id}-default`,
              name: 'My team',
              driverIds: requestedDriverIds,
            },
          ];
        }
      }

      const activeTeam = getActiveTeam(requestedTeams, requestedActiveTeamId);
      const nextActiveTeamId = activeTeam?.id || requestedTeams[0]?.id || null;

      if (requestedTeams.length > 20) {
        throw new Error('Team limit exceeded');
      }

      if (requestedTeams.some(team => team.driverIds.length > 200)) {
        throw new Error('Team driver limit exceeded');
      }

      const requestedDriverIds = requestedTeams.flatMap(team => team.driverIds);
      const hasUnknownDriver = requestedDriverIds.some(driverId => !availableDriverIds.has(driverId));

      if (hasUnknownDriver) {
        throw new Error('Selected driver not found');
      }

      const requestedTeamIds = requestedTeams.map(team => team.id);
      if (requestedTeamIds.length) {
        const foreignTeam = await tx.team.findFirst({
          where: {
            id: {
              in: requestedTeamIds,
            },
            ownerUserId: {
              not: target.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (foreignTeam) {
          throw new Error('Team not found');
        }
      }

      if (requestedTeamIds.length) {
        await tx.team.deleteMany({
          where: {
            ownerUserId: target.id,
            id: {
              notIn: requestedTeamIds,
            },
          },
        });
      } else {
        await tx.team.deleteMany({
          where: {
            ownerUserId: target.id,
          },
        });
      }

      for (const team of requestedTeams) {
        await tx.team.upsert({
          where: {
            id: team.id,
          },
          create: {
            id: team.id,
            ownerUserId: target.id,
            name: team.name,
          },
          update: {
            name: team.name,
            updatedAt: new Date(nowIso()),
          },
        });

        if (team.driverIds.length) {
          await tx.teamMember.deleteMany({
            where: {
              teamId: team.id,
              userId: {
                notIn: team.driverIds,
              },
            },
          });
          await tx.teamMember.createMany({
            data: team.driverIds.map(driverId => ({
              teamId: team.id,
              userId: driverId,
            })),
            skipDuplicates: true,
          });
        } else {
          await tx.teamMember.deleteMany({
            where: {
              teamId: team.id,
            },
          });
        }
      }

      const updatedUser = await tx.user.update({
        where: {
          id: target.id,
        },
        data: {
          activeTeamId: nextActiveTeamId,
          updatedAt: new Date(nowIso()),
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });
      const nextTeams = await loadUserTeams(tx, target.id);

      await createAuditLog(tx, {
        action: 'user.team.updated',
        actorUserId: target.id,
        targetUserId: target.id,
        entityType: 'team',
        entityId: target.id,
        before: {
          activeTeamId: target.activeTeamId || '',
          teams: currentTeams,
        },
        after: {
          activeTeamId: nextActiveTeamId || '',
          teams: nextTeams,
        },
        meta: {
          teamsCount: nextTeams.length,
          selectedDriversCount: requestedDriverIds.length,
        },
      });
      const nextActiveTeam = getActiveTeam(nextTeams, nextActiveTeamId);

      return {
        activeTeamId: nextActiveTeam?.id || '',
        drivers,
        teamDriverIds: nextActiveTeam?.driverIds || [],
        teams: nextTeams,
        user: await buildSanitizedUser(tx, updatedUser),
      };
    },
  });

  sendJson(response, 200, result);
}

async function handleDeleteMe(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  await runStoreTransaction({
    prisma: async tx => {
      await createAuditLog(tx, {
        action: 'user.deleted_self',
        actorUserId: context.user.id,
        targetUserId: context.user.id,
        entityType: 'user',
        entityId: context.user.id,
      });

      await tx.user.delete({
        where: {
          id: context.user.id,
        },
      });
    },
  });

  sendJson(response, 200, { ok: true });
}

async function handleUpdateMyProfile(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const incomingProfile =
    body.profile && typeof body.profile === 'object' ? body.profile : body;
  const hasPhoneInput =
    Object.prototype.hasOwnProperty.call(body, 'phone') ||
    Object.prototype.hasOwnProperty.call(incomingProfile, 'phone');

  const user = await runStoreTransaction({
    prisma: async tx => {
      const target = await tx.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      if (!target) {
        throw new Error('User not found');
      }

      const currentProfile = normalizeUserProfile(target.profile, target.name);
      const requestedName = normalizeText(body.name ?? incomingProfile.name ?? target.name) || target.name;
      const nextPhone = hasPhoneInput
        ? normalizePhoneNumber(body.phone ?? incomingProfile.phone)
        : target.phone || '';
      const nextAvatarUrl = normalizeText(
        body.avatarUrl ??
          incomingProfile.avatarUrl ??
          incomingProfile.avatar ??
          currentProfile.avatarUrl
      );

      if (nextAvatarUrl && nextAvatarUrl.length > 120000) {
        throw new Error('Avatar image is too large. Please upload a smaller image.');
      }

      if (hasPhoneInput && nextPhone) {
        const existingPhoneUser = await tx.user.findFirst({
          where: {
            phone: nextPhone,
            id: {
              not: target.id,
            },
          },
          select: {
            id: true,
          },
        });

        if (existingPhoneUser) {
          throw new Error('Phone number is already used');
        }
      }

      const nextProfile = normalizeUserProfile(
        {
          ...currentProfile,
          driver: {
            ...currentProfile.driver,
            ...(incomingProfile.driver || {}),
          },
          provider: {
            ...currentProfile.provider,
            ...(incomingProfile.provider || {}),
          },
          avatarUrl: nextAvatarUrl,
        },
        requestedName
      );
      const before = {
        name: target.name,
        phone: target.phone || '',
        profile: currentProfile,
      };
      const after = {
        name: requestedName,
        phone: nextPhone,
        profile: nextProfile,
      };

      const updatedUser = await tx.user.update({
        where: {
          id: context.user.id,
        },
        data: {
          name: requestedName,
          ...(hasPhoneInput ? { phone: nextPhone || null } : {}),
          profile: nextProfile,
          updatedAt: new Date(nowIso()),
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'user.profile.updated',
        actorUserId: context.user.id,
        targetUserId: updatedUser.id,
        entityType: 'profile',
        entityId: updatedUser.id,
        before,
        after,
      });

      return buildSanitizedUser(tx, updatedUser);
    },
  });

  sendJson(response, 200, { user });
}

function getPlanValue(plan) {
  const price = Number(plan?.priceCzk || 0);
  const limit = Number(plan?.monthlyGenerationLimit || 0);

  return price * 100000 + limit;
}

function getPlanRequestMode(before, requestedPlan) {
  if (requestedPlan.id === before.planId) {
    return 'renewal';
  }

  const currentPlanValue = getPlanValue(before.plan);
  const requestedPlanValue = getPlanValue(requestedPlan);

  if (requestedPlanValue < currentPlanValue) {
    return 'downgrade';
  }

  if (requestedPlanValue > currentPlanValue) {
    return 'upgrade';
  }

  return 'change';
}

async function handleUpgradeRequest(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const requestedPlanId = normalizeText(body.planId);

  if (!requestedPlanId) {
    throw new Error('Choose a plan for manual activation');
  }

  const user = await runStoreTransaction({
    prisma: async tx => {
      const target = await tx.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      if (!target) {
        throw new Error('User not found');
      }

      const [currentPlan, requestedPlan] = await Promise.all([
        target.subscription?.plan ||
          findStoredPlan(tx, target.subscription?.planId || target.planId || DEFAULT_PLAN_ID, {
            includeInactive: true,
          }),
        findStoredPlan(tx, requestedPlanId, { includeInactive: false }),
      ]);

      if (!currentPlan) {
        throw new Error('Current plan is not configured');
      }

      if (!requestedPlan) {
        throw new Error('Invalid plan');
      }

      const before = resolveSubscriptionView({
        user: target,
        subscription: target.subscription,
        plan: target.subscription?.plan || currentPlan,
        fallbackStartMode: target.subscription ? 'now' : 'month',
      });

      if (requestedPlan.id === DEFAULT_PLAN_ID && before.planId === DEFAULT_PLAN_ID) {
        throw new Error('Free plan is already active');
      }

      const requestMode = getPlanRequestMode(before, requestedPlan);
      const requestedAt = nowIso();
      const subscriptionData = buildSubscriptionWriteData({
        plan: currentPlan,
        before,
        payload: {
          ...before,
          pendingPlanId: requestedPlan.id,
          pendingRequestedAt: requestedAt,
          pendingSource:
            requestedPlan.id === DEFAULT_PLAN_ID ? 'manual_downgrade' : 'manual_payment',
          notes: normalizeText(body.notes ?? before.notes),
        },
        actorUserId: null,
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
          canceledAt: subscriptionData.canceledAt ? new Date(subscriptionData.canceledAt) : null,
          pendingPlanId: subscriptionData.pendingPlanId,
          pendingRequestedAt: subscriptionData.pendingRequestedAt
            ? new Date(subscriptionData.pendingRequestedAt)
            : null,
          pendingSource: subscriptionData.pendingSource,
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
          canceledAt: subscriptionData.canceledAt ? new Date(subscriptionData.canceledAt) : null,
          pendingPlanId: subscriptionData.pendingPlanId,
          pendingRequestedAt: subscriptionData.pendingRequestedAt
            ? new Date(subscriptionData.pendingRequestedAt)
            : null,
          pendingSource: subscriptionData.pendingSource,
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
        action: 'subscription.upgrade_requested',
        actorUserId: updatedUser.id,
        targetUserId: updatedUser.id,
        entityType: 'subscription',
        entityId: updatedUser.id,
        before,
        after: userView.subscription,
        meta: {
          requestedPlanId: requestedPlan.id,
          mode: requestMode,
        },
      });

      return userView;
    },
  });

  sendJson(response, 200, { user });
}

export async function handleMeRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/me') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const user = await buildSanitizedUser(prisma, context.user);
    sendJson(response, 200, { user });
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/me/team') {
    await handleGetMyTeam(request, response);
    return true;
  }

  if (request.method === 'PATCH' && pathName === '/api/me/team') {
    await handleUpdateMyTeam(request, response);
    return true;
  }

  if (request.method === 'DELETE' && pathName === '/api/me') {
    await handleDeleteMe(request, response);
    return true;
  }

  if (request.method === 'PATCH' && pathName === '/api/me/plan') {
    sendError(
      response,
      403,
      'Self-service plan changes are disabled. Contact a manager.'
    );
    return true;
  }

  if (request.method === 'PATCH' && pathName === '/api/me/profile') {
    await handleUpdateMyProfile(request, response);
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/me/subscription/upgrade-request') {
    await handleUpgradeRequest(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/me/usage') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const currentMonthWindow = buildCurrentMonthWindow();
    const [user, orderCount, deletedMessagesThisMonth] = await Promise.all([
      buildSanitizedUser(prisma, context.user),
      prisma.order.count({
        where: {
          userId: context.user.id,
        },
      }),
      countDeletedMessages(prisma, context.user.id, currentMonthWindow),
    ]);

    sendJson(response, 200, {
      usage: {
        ...user.usage,
        orderCount,
        deletedMessagesThisMonth,
      },
    });
    return true;
  }

  return false;
}
