import { prisma } from './prisma.js';
import { getFileDatabaseInfo } from './file-store.js';
import {
  getDatabaseUrl,
  isLocalFileStoreMode,
  isProductionEnvironment,
} from '../config/runtime-env.js';

const activeStore = isLocalFileStoreMode() ? 'file' : 'prisma';

async function withPreferredStore(runPrisma, runFile) {
  if (activeStore === 'file') {
    return runFile();
  }

  return runPrisma();
}

export async function runStoreRead({ prisma: runPrisma, file: runFile }) {
  return withPreferredStore(
    () => runPrisma(prisma),
    () => runFile()
  );
}

export async function runStoreTransaction({ prisma: runPrisma, file: runFile }) {
  return withPreferredStore(
    () => prisma.$transaction(async tx => runPrisma(tx)),
    () => runFile()
  );
}

export function getDatabaseInfo() {
  const prismaInfo = {
    provider: 'postgresql',
    configured: Boolean(getDatabaseUrl()),
    mode: 'prisma',
    productionOnly: isProductionEnvironment(),
  };

  if (activeStore === 'file') {
    return {
      ...getFileDatabaseInfo(),
      mode: 'file',
      localOnly: true,
      productionAllowed: false,
    };
  }

  return prismaInfo;
}

export async function getDatabaseHealth() {
  if (activeStore === 'file') {
    return {
      ok: true,
      database: {
        ...getDatabaseInfo(),
        connected: true,
      },
    };
  }

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    return {
      ok: true,
      database: {
        ...getDatabaseInfo(),
        connected: true,
      },
    };
  } catch {
    return {
      ok: false,
      database: {
        ...getDatabaseInfo(),
        connected: false,
      },
      error: 'Database connection failed.',
    };
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
