import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, getDirectDatabaseUrl } from '../config/runtime-env.js';

const globalForPrisma = globalThis;
// Runtime should use the primary DATABASE_URL first.
// DIRECT_DATABASE_URL stays as a fallback when the primary runtime URL is not set.
const datasourceUrl = getDatabaseUrl() || getDirectDatabaseUrl() || undefined;

export const prisma =
  globalForPrisma.__pdfAppPrisma ||
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__pdfAppPrisma = prisma;
}
