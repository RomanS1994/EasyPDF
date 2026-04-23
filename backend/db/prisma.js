import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, getDirectDatabaseUrl } from '../config/runtime-env.js';

const globalForPrisma = globalThis;
// Prefer the direct connection when it is available.
// This keeps the runtime aligned with prisma.config.ts and avoids routing
// the app through Prisma proxy URLs when a plain Postgres connection exists.
const datasourceUrl = getDirectDatabaseUrl() || getDatabaseUrl() || undefined;

export const prisma =
  globalForPrisma.__pdfAppPrisma ||
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__pdfAppPrisma = prisma;
}
