import { appendAuditLog } from '../audit/service.js';
import { getAuthContext, hasManagerAccess } from '../auth/context.js';
import { mutateDatabase } from '../db/store.js';
import { readJsonBody, sendError, sendJson } from '../lib/http.js';
import {
  buildOrderRecord,
  sanitizeOrder,
} from '../services/orders.js';
import { buildUsage } from '../services/subscriptions.js';
import { findUserOrThrow } from '../services/users.js';
import { nowIso } from '../validation/common.js';

async function handleCreateOrder(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const usage = buildUsage(context.database, context.user);
  if (usage.status !== 'active' && usage.status !== 'trial') {
    return sendError(response, 403, 'Subscription is not active', usage);
  }
  if (usage.used >= usage.limit) {
    return sendError(response, 403, 'Subscription limit reached', usage);
  }

  const body = await readJsonBody(request);

  const order = await mutateDatabase(database => {
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
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  const updatedOrder = await mutateDatabase(database => {
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

export async function handleOrderRoutes(request, response, { pathName }) {
  if (request.method === 'POST' && pathName === '/api/orders') {
    await handleCreateOrder(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/orders') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const orders = context.database.orders
      .filter(order => order.userId === context.user.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(order => sanitizeOrder(order, context.database));

    sendJson(response, 200, { orders });
    return true;
  }

  if (!pathName.startsWith('/api/orders/')) {
    return false;
  }

  const orderId = pathName.split('/').pop();

  if (request.method === 'GET') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const order = context.database.orders.find(item => item.id === orderId);

    if (!order) {
      sendError(response, 404, 'Order not found');
      return true;
    }

    const isOwner = order.userId === context.user.id;
    const isManager = hasManagerAccess(context.user.role);

    if (!isOwner && !isManager) {
      sendError(response, 403, 'You do not have access to this order');
      return true;
    }

    sendJson(response, 200, {
      order: sanitizeOrder(order, context.database),
    });
    return true;
  }

  if (request.method === 'PATCH') {
    await handleUpdateOrder(request, response, orderId);
    return true;
  }

  return false;
}
