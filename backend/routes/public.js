import { getAuthContext } from '../auth/context.js';
import { getPlanById, isSupportedPdfDocumentType } from '../config/plans.js';
import { readFileDatabase } from '../db/file-store.js';
import { getDatabaseHealth, runStoreRead } from '../db/store.js';
import { listStoredPlans } from '../db/plans-store.js';
import { readJsonBody, sendJson, sendPdf } from '../lib/http.js';
import { createContractPdf } from '../pdf/contracts.js';
import { sanitizeOrderRecord } from '../db/prisma-helpers.js';
import { getDatabasePlans } from '../services/plans.js';
import { nowIso } from '../validation/common.js';

function resolvePdfPlan(context) {
  if (context?.user?.subscription?.plan?.id) {
    return context.user.subscription.plan;
  }

  if (context?.database) {
    const planId = context.user?.subscription?.planId || context.user?.planId;
    return (
      getDatabasePlans(context.database, { includeInactive: true }).find(plan => plan.id === planId) ||
      getPlanById(planId) ||
      getPlanById('plan-25')
    );
  }

  return getPlanById(context?.user?.subscription?.planId || context?.user?.planId || 'plan-25');
}

async function findOrderForPdf(context, orderId) {
  return runStoreRead({
    prisma: async client => {
      const order = await client.order.findUnique({
        where: {
          id: orderId,
        },
      });

      return order ? sanitizeOrderRecord(order) : null;
    },
    file: async () => {
      const database = context.database || (await readFileDatabase());
      return database.orders.find(order => order.id === orderId) || null;
    },
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
    const plans = await runStoreRead({
      prisma: client => listStoredPlans(client, { includeInactive: false }),
      file: async () => {
        const database = await readFileDatabase();
        return getDatabasePlans(database, { includeInactive: false });
      },
    });

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

    const order = await findOrderForPdf(context, orderId);
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
