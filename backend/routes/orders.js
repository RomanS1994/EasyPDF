import { getAuthContext, hasManagerAccess } from '../auth/context.js';
import {
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
import { hasFlightStatusAccess } from '../services/flight-status.js';
import {
  refreshFlightStatusForOrder,
  refreshFlightStatusesForOrders,
} from '../services/flight-status-refresh.js';
import { buildOrderRecord } from '../services/orders.js';
import {
  acceptOrderOffer,
  createOrderOffer,
  listAvailableOrderOffers,
  searchDispatchDrivers,
  skipOrderOffer,
} from '../services/order-dispatch.js';
import { validateOrderCreateInput } from '../validation/orders.js';
import { nowIso, normalizePaginationParams, normalizeText } from '../validation/common.js';

function getOrderSanitizeOptions(user) {
  return {
    includeFlightStatus: hasFlightStatusAccess(user),
  };
}

function getUtcDayBounds(isoValue) {
  const date = new Date(isoValue);
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    fallback.setUTCHours(0, 0, 0, 0);
    const next = new Date(fallback);
    next.setUTCDate(next.getUTCDate() + 1);
    return { start: fallback, end: next };
  }

  const start = new Date(date);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

async function handleCreateOrder(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  if (!context.user.phone) {
    return sendError(response, 403, 'Driver phone is required');
  }

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

      if (!freshUser.phone) {
        throw new Error('Driver phone is required');
      }

      const freshUserView = await buildSanitizedUser(tx, freshUser);
      const freshUsage = freshUserView.usage;

      if (freshUsage.status !== 'active') {
        throw new Error('Subscription is not active');
      }

      if (freshUsage.used >= freshUsage.limit) {
        throw new Error('Subscription limit reached');
      }

      const createdAt = nowIso();
      const { start, end } = getUtcDayBounds(createdAt);
      const orderSequence = (await tx.order.count({
        where: {
          userId: freshUser.id,
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      })) + 1;
      const nextOrder = buildOrderRecord(body, freshUser, {
        createdAt,
        orderSequence,
      });
      const createdOrder = await tx.order.create({
        data: {
          id: nextOrder.id,
          userId: nextOrder.userId,
          createdByUserId: nextOrder.createdByUserId,
          createdBySnapshot: nextOrder.createdBySnapshot,
          orderNumber: nextOrder.orderNumber,
          status: nextOrder.status,
          flightNumber: nextOrder.flightNumber,
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
          flightNumber: createdOrder.flightNumber,
        },
      });

      return sanitizeOrderRecord(createdOrder, getOrderSanitizeOptions(freshUser));
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
        flightNumber: order.flightNumber,
        totalPrice: order.totalPrice,
        pdf: order.pdf,
      };
      const nextFlightNumber =
        typeof body.flightNumber === 'string' ? body.flightNumber.trim() : '';
      const nextContractData =
        nextFlightNumber || body.contractData || body.status
          ? {
              ...(order.contractData || {}),
              ...(body.contractData && typeof body.contractData === 'object'
                ? body.contractData
                : {}),
              ...(nextFlightNumber ? { flightNumber: nextFlightNumber } : {}),
            }
          : order.contractData;

      const updated = await tx.order.update({
        where: {
          id: orderId,
        },
        data: {
          ...(typeof body.status === 'string' && body.status.trim()
            ? { status: body.status.trim() }
            : {}),
          ...(typeof body.flightNumber === 'string'
            ? { flightNumber: nextFlightNumber }
            : {}),
          ...(typeof body.totalPrice === 'string' ? { totalPrice: body.totalPrice } : {}),
          ...(nextPdf !== order.pdf ? { pdf: nextPdf } : {}),
          ...(nextContractData !== order.contractData ? { contractData: nextContractData } : {}),
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
          flightNumber: updated.flightNumber,
          totalPrice: updated.totalPrice,
          pdf: updated.pdf,
        },
      });

      return sanitizeOrderRecord(updated, getOrderSanitizeOptions(context.user));
    },
  });

  sendJson(response, 200, { order: updatedOrder });
}

async function handleDeleteOrder(request, response, orderId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  await runStoreTransaction({
    prisma: async tx => {
      const order = await tx.order.findFirst({
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

      await createAuditLog(tx, {
        action: 'order.deleted',
        actorUserId: context.user.id,
        targetUserId: order.userId,
        entityType: 'order',
        entityId: order.id,
        before: {
          orderNumber: order.orderNumber,
          status: order.status,
          flightNumber: order.flightNumber,
          userId: order.userId,
          totalPrice: order.totalPrice,
        },
        after: null,
      });

      await tx.archivedOrder.create({
        data: {
          id: order.id,
          userId: order.userId,
          createdByUserId: order.createdByUserId,
          createdBySnapshot: order.createdBySnapshot,
          orderNumber: order.orderNumber,
          status: order.status,
          flightNumber: order.flightNumber,
          source: order.source,
          customer: order.customer,
          trip: order.trip,
          totalPrice: order.totalPrice,
          pdf: order.pdf,
          contractData: order.contractData,
          metadata: order.metadata,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          deletedAt: new Date(nowIso()),
        },
      });

      await tx.order.delete({
        where: {
          id: orderId,
        },
      });
    },
  });

  sendJson(response, 200, { ok: true });
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
        return sanitizeOrderRecord(order, getOrderSanitizeOptions(context.user));
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

      return sanitizeOrderRecord(updated, getOrderSanitizeOptions(context.user));
    },
  });

  sendJson(response, 200, { order: transferredOrder });
}

async function handleSearchDispatchDrivers(request, response, url) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search'));
  const drivers = await searchDispatchDrivers(prisma, {
    search,
    excludeUserId: context.user.id,
  });

  sendJson(response, 200, { drivers });
}

async function handleAvailableOrderOffers(request, response) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const offers = await listAvailableOrderOffers(prisma, context.user);

  sendJson(response, 200, { offers });
}

async function handleCreateOrderOffer(request, response, orderId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const offer = await runStoreTransaction({
    prisma: async tx => {
      const order = await tx.order.findFirst({
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

      return createOrderOffer(tx, {
        actor: context.user,
        order,
        body,
      });
    },
  });

  sendJson(response, 201, { offer });
}

async function handleAcceptOrderOffer(request, response, orderId, offerId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const order = await runStoreTransaction({
    prisma: tx => acceptOrderOffer(tx, {
      actor: context.user,
      orderId,
      offerId,
    }),
  });

  sendJson(response, 200, { order });
}

async function handleSkipOrderOffer(request, response, orderId, offerId) {
  const context = await getAuthContext(request, response);
  if (!context) return;

  const result = await runStoreTransaction({
    prisma: tx => skipOrderOffer(tx, {
      actor: context.user,
      orderId,
      offerId,
    }),
  });

  sendJson(response, 200, result);
}

export async function handleOrderRoutes(request, response, { pathName, url }) {
  if (request.method === 'POST' && pathName === '/api/orders') {
    await handleCreateOrder(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/orders/available') {
    await handleAvailableOrderOffers(request, response);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/orders/drivers') {
    await handleSearchDispatchDrivers(request, response, url);
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/orders') {
    const context = await getAuthContext(request, response);
    if (!context) return true;
    const { skip, limit } = normalizePaginationParams(url.searchParams);

    const orders = await prisma.order.findMany({
      where: {
        userId: context.user.id,
        offers: {
          none: {
            status: 'open',
          },
        },
      },
      select: ORDER_LIST_SELECT,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
    const refreshedOrders = await refreshFlightStatusesForOrders(prisma, orders, {
      enabled: hasFlightStatusAccess(context.user),
    });

    sendJson(response, 200, {
      orders: refreshedOrders.map(order => sanitizeOrderListRecord(order, getOrderSanitizeOptions(context.user))),
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

  if (action === 'offers' && request.method === 'POST' && segments.length === 4) {
    await handleCreateOrderOffer(request, response, orderId);
    return true;
  }

  if (action === 'offers' && request.method === 'POST' && segments.length === 6) {
    const offerId = segments[4] || '';
    const offerAction = segments[5] || '';

    if (offerAction === 'accept') {
      await handleAcceptOrderOffer(request, response, orderId, offerId);
      return true;
    }

    if (offerAction === 'skip') {
      await handleSkipOrderOffer(request, response, orderId, offerId);
      return true;
    }
  }

  if (segments.length > 3 && action !== 'assign-driver') {
    return false;
  }

  if (request.method === 'GET') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const order = await prisma.order.findFirst({
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

    const refreshedOrder = await refreshFlightStatusForOrder(prisma, order, {
      enabled: hasFlightStatusAccess(context.user),
    });

    sendJson(response, 200, {
      order: sanitizeOrderRecord(refreshedOrder, getOrderSanitizeOptions(context.user)),
    });
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

  if (request.method === 'DELETE') {
    await handleDeleteOrder(request, response, orderId);
    return true;
  }

  return false;
}
