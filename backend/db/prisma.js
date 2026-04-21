import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from '../config/runtime-env.js';

const globalForPrisma = globalThis;
const datasourceUrl = getDatabaseUrl() || undefined;

export const prisma =
  globalForPrisma.__pdfAppPrisma ||
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__pdfAppPrisma = prisma;
}
