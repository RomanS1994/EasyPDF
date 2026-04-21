import { getAuthContext } from '../auth/context.js';
import { getPlanById, isSupportedPdfDocumentType } from '../config/plans.js';
import { getDatabaseHealth } from '../db/store.js';
import { listStoredPlans } from '../db/plans-store.js';
import { ORDER_WITH_OWNER_INCLUDE, sanitizeOrderRecord } from '../db/prisma-helpers.js';
import { prisma } from '../db/prisma.js';
import { readJsonBody, sendJson, sendPdf } from '../lib/http.js';
import { createContractPdf } from '../pdf/contracts.js';
import { nowIso } from '../validation/common.js';

function resolvePdfPlan(context) {
  if (context?.user?.subscription?.plan?.id) {
    return context.user.subscription.plan;
  }

  return getPlanById(context?.user?.subscription?.planId || context?.user?.planId || 'plan-free');
}

async function findOrderForPdf(orderId) {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: ORDER_WITH_OWNER_INCLUDE,
  });

  return order ? sanitizeOrderRecord(order) : null;
}

async function listAvailablePlans() {
  return listStoredPlans(prisma, {
    includeInactive: false,
  });
}

export async function handlePublicRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/health') {
    const health = await getDatabaseHealth();

    sendJson(response, health.ok ? 200 : 503, {
      ok: health.ok,
      database: health.database,
      error: health.error || null,
      time: nowIso(),
    });
    return true;
  }

  if (request.method === 'GET' && pathName === '/api/plans') {
    const plans = await listAvailablePlans();

    sendJson(response, 200, {
      plans,
    });
    return true;
  }

  if (request.method === 'POST' && pathName === '/api/contracts/get-pdf') {
    const context = await getAuthContext(request, response);
    if (!context) return true;

    const body = await readJsonBody(request);
    const orderId = String(body.orderId || '').trim();

    if (!orderId) {
      throw new Error('Order id is required for PDF generation');
    }

    const order = await findOrderForPdf(orderId);
    if (!order || order.userId !== context.user.id) {
      throw new Error('Order not found');
    }

    const requestedDocumentType = String(
      body.documentType ||
        body.order?.documentType ||
        body.contractData?.documentType ||
        order.contractData?.documentType ||
        'confirmation'
    ).trim();

    if (!isSupportedPdfDocumentType(requestedDocumentType)) {
      throw new Error('Invalid PDF document type');
    }

    const contractData = {
      ...(order.contractData && typeof order.contractData === 'object' ? order.contractData : {}),
      ...(body.order && typeof body.order === 'object' ? body.order : {}),
      ...(body.contractData && typeof body.contractData === 'object' ? body.contractData : {}),
      orderNumber: order.orderNumber || body.order?.orderNumber || body.contractData?.orderNumber || '',
      documentType: requestedDocumentType,
    };
    const pdfDocument = await createContractPdf({
      contractData,
      plan: resolvePdfPlan(context),
      documentType: requestedDocumentType,
      language: String(body.language || body.order?.language || body.contractData?.language || 'uk'),
    });

    sendPdf(response, 200, pdfDocument.buffer, pdfDocument.fileName);
    return true;
  }

  return false;
}
