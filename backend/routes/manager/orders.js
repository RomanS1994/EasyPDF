import { requireManager } from '../../auth/context.js';
import {
  ORDER_WITH_OWNER_INCLUDE,
  sanitizeOrderRecord,
} from '../../db/prisma-helpers.js';
import { prisma } from '../../db/prisma.js';
import { sendJson } from '../../lib/http.js';
import {
  buildManagerOrdersSummary,
  matchesManagerOrderStatus,
} from '../../services/orders.js';
import { normalizeInteger, normalizeText } from '../../validation/common.js';

export async function handleManagerOrders(request, response, url) {
  const context = await requireManager(request, response);
  if (!context) return;

  const search = normalizeText(url.searchParams.get('search')).toLowerCase();
  const status = normalizeText(url.searchParams.get('status')).toLowerCase();
  const userId = normalizeText(url.searchParams.get('userId'));
  const limit = Math.min(200, Math.max(10, normalizeInteger(url.searchParams.get('limit'), 100)));

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
}
