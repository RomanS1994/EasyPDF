import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
const datasourceUrl =
  process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || undefined;

export const prisma =
  globalForPrisma.__pdfAppPrisma ||
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__pdfAppPrisma = prisma;
}
