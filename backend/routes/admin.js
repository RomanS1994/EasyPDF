import { appendAuditLog } from '../audit/service.js';
import { requireAdmin } from '../auth/context.js';
import { mutateDatabase } from '../db/store.js';
import { readJsonBody, sendJson } from '../lib/http.js';
import { sanitizeOrder } from '../services/orders.js';
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

async function handleLegacyAdminUsers(request, response) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  const users = context.database.users.map(user => buildManagerUserSummary(context.database, user));
  sendJson(response, 200, { users });
}

async function handleLegacyAdminOrders(request, response, url) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  const userId = url.searchParams.get('userId');
  const orders = context.database.orders
    .filter(order => (userId ? order.userId === userId : true))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(order => sanitizeOrder(order, context.database));

  sendJson(response, 200, { orders });
}

async function handleLegacyAdminPlanUpdate(request, response, userId) {
  const context = await requireAdmin(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const user = await mutateDatabase(database => {
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
    });

    return updatedUser;
  });

  sendJson(response, 200, { user });
}

export async function handleAdminRoutes(request, response, { pathName, url }) {
  if (request.method === 'GET' && pathName === '/api/admin/users') {
    await handleLegacyAdminUsers(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/admin/orders') {
    await handleLegacyAdminOrders(request, response, url);
    return true;
  }

  const legacyAdminPlanMatch = pathName.match(/^\/api\/admin\/users\/([^/]+)\/plan$/);
  if (request.method === 'PATCH' && legacyAdminPlanMatch) {
    await handleLegacyAdminPlanUpdate(request, response, legacyAdminPlanMatch[1]);
    return true;
  }

  return false;
}
