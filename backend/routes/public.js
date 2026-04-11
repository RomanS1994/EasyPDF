import { readFileDatabase } from '../db/file-store.js';
import { getDatabaseInfo, runStoreRead } from '../db/store.js';
import { listStoredPlans } from '../db/plans-store.js';
import { readJsonBody, sendJson, sendPdf } from '../lib/http.js';
import { createContractPdf } from '../pdf/contracts.js';
import { getDatabasePlans } from '../services/plans.js';
import { nowIso } from '../validation/common.js';

export async function handlePublicRoutes(request, response, { pathName }) {
  if (request.method === 'GET' && pathName === '/api/health') {
    sendJson(response, 200, {
      ok: true,
      database: getDatabaseInfo(),
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
    const body = await readJsonBody(request);
    const contractData = body.order || body.contractData || {};
    const pdfBuffer = createContractPdf(contractData);
    const fileName = `contract-${contractData.orderNumber || 'draft'}.pdf`;

    sendPdf(response, 200, pdfBuffer, fileName);
    return true;
  }

  return false;
}
