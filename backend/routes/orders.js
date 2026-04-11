import { randomUUID } from 'node:crypto';

import { getAuthContext, hasManagerAccess } from '../auth/context.js';
import { mutateFileDatabase as mutateDatabase } from '../db/file-store.js';
import {
  buildSanitizedUser,
  createAuditLog,
  ORDER_WITH_OWNER_INCLUDE,
  sanitizeOrderRecord,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import { prisma } from '../db/prisma.js';
import { runStoreTransaction } from '../db/store.js';
import { readJsonBody, sendError, sendJson } from '../lib/http.js';
import {
  buildOrderRecord,
  sanitizeOrder,
} from '../services/orders.js';
import { findUserOrThrow, sanitizeUser } from '../services/users.js';
import { nowIso } from '../validation/common.js';

async function handleCreateOrder(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const resolvedUsage =
    context.store === 'prisma'
      ? (await buildSanitizedUser(prisma, context.user)).usage
      : sanitizeUser(context.database, context.user).usage;
  if (resolvedUsage.status !== 'active' && resolvedUsage.status !== 'trial') {
    return sendError(response, 403, 'Subscription is not active', resolvedUsage);
  }
  if (resolvedUsage.used >= resolvedUsage.limit) {
    return sendError(response, 403, 'Subscription limit reached', resolvedUsage);
  }

  const body = await readJsonBody(request);

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

      if (freshUsage.status !== 'active' && freshUsage.status !== 'trial') {
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
    file: () =>
      mutateDatabase(database => {
        const freshUser = findUserOrThrow(database, context.user.id);
        const freshUsage = sanitizeUser(database, freshUser).usage;

        if (freshUsage.status !== 'active' && freshUsage.status !== 'trial') {
          throw new Error('Subscription is not active');
        }

        if (freshUsage.used >= freshUsage.limit) {
          throw new Error('Subscription limit reached');
        }

        const nextOrder = buildOrderRecord(body, freshUser);
        database.orders.push(nextOrder);
        database.auditLogs.unshift({
          id: randomUUID(),
          action: 'order.created',
          actorUserId: freshUser.id,
          targetUserId: freshUser.id,
          entityType: 'order',
          entityId: nextOrder.id,
          before: null,
          after: {
            orderNumber: nextOrder.orderNumber,
            status: nextOrder.status,
          },
          meta: {},
          createdAt: nowIso(),
        });

        return sanitizeOrder(nextOrder, database);
      }),
  });

  sendJson(response, 201, { order });
}

async function handleUpdateOrder(request, response, orderId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  const updatedOrder = await runStoreTransaction({
    prisma: async tx => {
      const order = await tx.order.findUnique({
        where: {
          id: orderId,
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
    file: () =>
      mutateDatabase(database => {
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
        database.auditLogs.unshift({
          id: randomUUID(),
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
          meta: {},
          createdAt: nowIso(),
        });

        return sanitizeOrder(order, database);
      }),
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

    if (context.store === 'prisma') {
      const orders = await prisma.order.findMany({
        where: {
          userId: context.user.id,
        },
        include: ORDER_WITH_OWNER_INCLUDE,
        orderBy: {
          createdAt: 'desc',
        },
      });

      sendJson(response, 200, {
        orders: orders.map(sanitizeOrderRecord),
      });
      return true;
    }

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

    if (context.store === 'prisma') {
      const order = await prisma.order.findUnique({
        where: {
          id: orderId,
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
