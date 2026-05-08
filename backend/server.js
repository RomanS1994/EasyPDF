import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

import { requireApiKey } from './auth/api-key.js';
import { assertRuntimeEnv } from './config/runtime-env.js';
import { ensureDefaultPlans } from './db/plans-store.js';
import { syncSubscriptionPlanLimits } from './db/subscription-limits-store.js';
import { bindRequestContext, handleCors } from './lib/http.js';
import { sendHttpError } from './lib/errors.js';
import { routeRequest } from './routes/index.js';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(serverDir, '.env') });

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);

try {
  assertRuntimeEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

const { prisma } = await import('./db/prisma.js');

const server = http.createServer(async (request, response) => {
  try {
    bindRequestContext(response, request);
    if (handleCors(request, response)) return;
    if (!requireApiKey(request, response)) return;

    await routeRequest(request, response);
  } catch (error) {
    sendHttpError(response, error);
  }
});

async function synchronizeSubscriptionLimits() {
  try {
    const updatedCount = await syncSubscriptionPlanLimits(prisma);
    if (updatedCount > 0) {
      console.info(`Synchronized ${updatedCount} subscription limits with their assigned plans.`);
    }
  } catch (error) {
    console.warn(
      `Failed to synchronize subscription limits: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function initializeDatabase() {
  try {
    await prisma.$connect();
    await ensureDefaultPlans(prisma);
    await synchronizeSubscriptionLimits();
  } catch (error) {
    throw new Error(
      `Failed to start backend against PostgreSQL via Prisma: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

async function startServer() {
  await initializeDatabase();

  server.listen(PORT, () => {
    console.log(`pdf.app backend is running on http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
