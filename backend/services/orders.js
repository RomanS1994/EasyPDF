import { randomUUID } from 'node:crypto';

import { nowIso } from '../validation/common.js';

export function generateOrderNumber() {
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${Date.now()}-${suffix}`;
}

export function buildOrderRecord(body, user) {
  const contractData = body.contractData || body.order || {};
  const createdAt = nowIso();

  return {
    id: randomUUID(),
    userId: user.id,
    orderNumber:
      contractData.orderNumber || body.orderNumber || generateOrderNumber(),
    status: body.status || 'created',
    source: body.source || 'pdf-app',
    customer: {
      name: contractData.customer?.name || body.customer?.name || '',
      email:
        contractData.customer?.email ||
        body.customer?.email ||
        contractData.customer?.phone ||
        '',
      phone: contractData.customer?.phone || body.customer?.phone || '',
    },
    trip: {
      from: contractData.trip?.from?.address || body.trip?.from || '',
      to: contractData.trip?.to?.address || body.trip?.to || '',
      time: contractData.trip?.time || body.trip?.time || '',
      paymentMethod:
        contractData.trip?.paymentMethod || body.trip?.paymentMethod || '',
    },
    totalPrice: contractData.totalPrice || body.totalPrice || '',
    pdf: {
      url: body.pdf?.url || body.pdfUrl || '',
      fileName: body.pdf?.fileName || body.pdfFileName || '',
    },
    contractData,
    metadata: typeof body.metadata === 'object' && body.metadata ? body.metadata : {},
    createdAt,
    updatedAt: createdAt,
  };
}

export function matchesManagerOrderStatus(order, status) {
  if (!status || status === 'all') return true;

  const value = String(order.status || '').toLowerCase();

  if (status === 'generated') {
    return value === 'pdf_generated';
  }

  if (status === 'failed') {
    return value.includes('fail');
  }

  if (status === 'pending') {
    return value !== 'pdf_generated' && !value.includes('fail');
  }

  return value === status;
}

export function buildManagerOrdersSummary(orders) {
  return orders.reduce(
    (summary, order) => {
      summary.all += 1;

      if (matchesManagerOrderStatus(order, 'generated')) {
        summary.generated += 1;
      } else if (matchesManagerOrderStatus(order, 'failed')) {
        summary.failed += 1;
      } else {
        summary.pending += 1;
      }

      return summary;
    },
    {
      all: 0,
      pending: 0,
      failed: 0,
      generated: 0,
    }
  );
}
