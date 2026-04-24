import { getAuthContext, hasManagerAccess } from '../auth/context.js';
import {
  ACTIVE_ORDER_WHERE,
  buildSanitizedUser,
  createAuditLog,
  ORDER_LIST_SELECT,
  ORDER_WITH_OWNER_INCLUDE,
  sanitizeOrderListRecord,
  sanitizeOrderRecord,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import { prisma } from '../db/prisma.js';
import { runStoreTransaction } from '../db/store.js';
import { readJsonBody, sendError, sendJson } from '../lib/http.js';
import { buildOrderRecord } from '../services/orders.js';
import { validateOrderCreateInput } from '../validation/orders.js';
import { nowIso, normalizePaginationParams, normalizeText } from '../validation/common.js';

async function handleCreateOrder(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const resolvedUsage = (await buildSanitizedUser(prisma, context.user)).usage;
  if (resolvedUsage.status !== 'active') {
    return sendError(response, 403, 'Subscription is not active', resolvedUsage);
  }
  if (resolvedUsage.used >= resolvedUsage.limit) {
    return sendError(response, 403, 'Subscription limit reached', resolvedUsage);
  }

  const body = await readJsonBody(request);
  validateOrderCreateInput(body);

  const order = await runStoreTransaction({
    prisma: async tx => {
      const freshUser = await tx.user.findUnique({
        where: {
          id: context.user.id,
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      if (!freshUser) {
        throw new Error('User not found');
      }

      const freshUserView = await buildSanitizedUser(tx, freshUser);
      const freshUsage = freshUserView.usage;

      if (freshUsage.status !== 'active') {
        throw new Error('Subscription is not active');
      }

      if (freshUsage.used >= freshUsage.limit) {
        throw new Error('Subscription limit reached');
      }

      const nextOrder = buildOrderRecord(body, freshUser);
      const createdOrder = await tx.order.create({
        data: {
          id: nextOrder.id,
          userId: nextOrder.userId,
          orderNumber: nextOrder.orderNumber,
          status: nextOrder.status,
          source: nextOrder.source,
          customer: nextOrder.customer,
          trip: nextOrder.trip,
          totalPrice: nextOrder.totalPrice,
          pdf: nextOrder.pdf,
          contractData: nextOrder.contractData,
          metadata: nextOrder.metadata,
          createdAt: new Date(nextOrder.createdAt),
          updatedAt: new Date(nextOrder.updatedAt),
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'order.created',
        actorUserId: freshUser.id,
        targetUserId: freshUser.id,
        entityType: 'order',
        entityId: createdOrder.id,
        after: {
          orderNumber: createdOrder.orderNumber,
          status: createdOrder.status,
        },
      });

      return sanitizeOrderRecord(createdOrder);
    },
  });

  sendJson(response, 201, { order });
}

async function handleUpdateOrder(request, response, orderId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  const updatedOrder = await runStoreTransaction({
    prisma: async tx => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          ...ACTIVE_ORDER_WHERE,
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const isOwner = order.userId === context.user.id;
      const isManager = hasManagerAccess(context.user.role);

      if (!isOwner && !isManager) {
        throw new Error('You do not have access to this order');
      }

      const nextPdf = body.pdfUrl || body.pdfFileName || body.pdf
        ? {
            ...(order.pdf || {}),
            ...(body.pdf || {}),
            ...(body.pdfUrl ? { url: body.pdfUrl } : {}),
            ...(body.pdfFileName ? { fileName: body.pdfFileName } : {}),
          }
        : order.pdf;
      const nextMetadata =
        body.metadata && typeof body.metadata === 'object'
          ? {
              ...(order.metadata || {}),
              ...body.metadata,
            }
          : order.metadata;

      const before = {
        status: order.status,
        totalPrice: order.totalPrice,
        pdf: order.pdf,
      };

      const updated = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          ...(typeof body.status === 'string' && body.status.trim()
            ? { status: body.status.trim() }
            : {}),
          ...(typeof body.totalPrice === 'string' ? { totalPrice: body.totalPrice } : {}),
          ...(nextPdf !== order.pdf ? { pdf: nextPdf } : {}),
          ...(body.contractData && typeof body.contractData === 'object'
            ? { contractData: body.contractData }
            : {}),
          ...(nextMetadata !== order.metadata ? { metadata: nextMetadata } : {}),
          updatedAt: new Date(nowIso()),
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'order.updated',
        actorUserId: context.user.id,
        targetUserId: updated.userId,
        entityType: 'order',
        entityId: updated.id,
        before,
        after: {
          status: updated.status,
          totalPrice: updated.totalPrice,
          pdf: updated.pdf,
        },
      });

      return sanitizeOrderRecord(updated);
    },
  });

  sendJson(response, 200, { order: updatedOrder });
}

async function handleArchiveOrder(request, response, orderId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const archivedOrder = await runStoreTransaction({
    prisma: async tx => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          ...ACTIVE_ORDER_WHERE,
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const isOwner = order.userId === context.user.id;
      const isManager = hasManagerAccess(context.user.role);

      if (!isOwner && !isManager) {
        throw new Error('You do not have access to this order');
      }

      const archivedAt = nowIso();
      const updated = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          archivedAt: new Date(archivedAt),
          updatedAt: new Date(archivedAt),
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'order.archived',
        actorUserId: context.user.id,
        targetUserId: updated.userId,
        entityType: 'order',
        entityId: updated.id,
        before: {
          archivedAt: order.archivedAt || null,
          status: order.status,
          userId: order.userId,
        },
        after: {
          archivedAt: archivedAt,
          status: updated.status,
          userId: updated.userId,
        },
      });

      return sanitizeOrderRecord(updated);
    },
  });

  sendJson(response, 200, { order: archivedOrder });
}

async function handleAssignDriver(request, response, orderId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const targetUserId = normalizeText(body?.userId);

  if (!targetUserId) {
    throw new Error('Driver id is required');
  }

  const transferredOrder = await runStoreTransaction({
    prisma: async tx => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          ...ACTIVE_ORDER_WHERE,
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      if (!order) {
        throw new Error('Order not found');
      }

      if (!hasManagerAccess(context.user.role)) {
        throw new Error('Manager access is required to transfer this order');
      }

      const targetUser = await tx.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
          role: true,
        },
      });

      if (!targetUser) {
        throw new Error('Selected driver not found');
      }

      if (targetUser.role === 'admin') {
        throw new Error('Administrators cannot be selected as transfer targets');
      }

      if (targetUser.id === order.userId) {
        return sanitizeOrderRecord(order);
      }

      const updated = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          userId: targetUser.id,
          updatedAt: new Date(nowIso()),
        },
        include: ORDER_WITH_OWNER_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'order.reassigned',
        actorUserId: context.user.id,
        targetUserId: updated.userId,
        entityType: 'order',
        entityId: updated.id,
        before: {
          userId: order.userId,
        },
        after: {
          userId: updated.userId,
        },
      });

      return sanitizeOrderRecord(updated);
    },
  });

  sendJson(response, 200, { order: transferredOrder });
}

export async function handleOrderRoutes(request, response, { pathName, url }) {
  if (request.method === 'POST' && pathName === '/api/orders') {
    await handleCreateOrder(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/orders') {
    const context = await getAuthContext(request, response);
    if (!context) return true;
    const { skip, limit } = normalizePaginationParams(url.searchParams);

    const orders = await prisma.order.findMany({
      where: {
        userId: context.user.id,
        ...ACTIVE_ORDER_WHERE,
      },
      select: ORDER_LIST_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    sendJson(response, 200, {
      orders: orders.map(sanitizeOrderListRecord),
    });
    return true;
  }

  if (!pathName.startsWith('/api/orders/')) {
    return false;
  }

  const segments = pathName.split('/').filter(Boolean);
  const orderId = segments[2] || '';
  const action = segments[3] || '';

  if (!orderId) {
    return false;
  }

  if (segments.length > 3 && request.method !== 'PATCH') {
    return false;
  }

  if (request.method === 'GET') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...ACTIVE_ORDER_WHERE,
      },
      include: ORDER_WITH_OWNER_INCLUDE,
    });

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
      order: sanitizeOrderRecord(order),
    });
    return true;
  }

  if (action === 'archive' && request.method === 'PATCH') {
    await handleArchiveOrder(request, response, orderId);
    return true;
  }

  if (action === 'assign-driver' && request.method === 'PATCH') {
    await handleAssignDriver(request, response, orderId);
    return true;
  }

  if (segments.length > 3) {
    return false;
  }

  if (request.method === 'PATCH') {
    await handleUpdateOrder(request, response, orderId);
    return true;
  }

  return false;
}
