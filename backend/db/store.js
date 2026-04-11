import { prisma } from './prisma.js';
import {
  getFileDatabaseInfo,
  mutateFileDatabase,
  readFileDatabase,
  writeFileDatabase,
} from './file-store.js';
import {
  getDatabaseInfo as getRepositoryDatabaseInfo,
  loadDatabaseSnapshot,
  persistDatabaseSnapshot,
  replaceDatabaseSnapshot,
} from './repository.js';

let activeStore = process.env.DB_MODE === 'file' ? 'file' : 'prisma';
let fallbackWarningShown = false;

function isExplicitFileStoreRequested() {
  return (
    process.env.DB_MODE === 'file' ||
    Boolean(process.env.DATA_FILE) ||
    Boolean(process.env.LEGACY_DATA_FILE)
  );
}

function canUseFileFallback() {
  return isExplicitFileStoreRequested() || process.env.NODE_ENV !== 'production';
}

function logFallbackWarning(error) {
  if (fallbackWarningShown) return;

  fallbackWarningShown = true;
  console.warn(
    'Database fallback activated: using JSON store because PostgreSQL is unavailable.'
  );

  if (error) {
    console.warn(error instanceof Error ? error.message : String(error));
  }
}

async function withPreferredStore(runPrisma, runFile, error = null) {
  if (activeStore === 'file') {
    return runFile();
  }

  try {
    return await runPrisma();
  } catch (nextError) {
    if (!canUseFileFallback()) {
      throw nextError;
    }

    activeStore = 'file';
    logFallbackWarning(nextError || error);
    return runFile();
  }
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

export async function readDatabase() {
  return runStoreRead({
    prisma: tx => loadDatabaseSnapshot(tx),
    file: () => readFileDatabase(),
  });
}

export async function writeDatabase(database) {
  return withPreferredStore(
    () => prisma.$transaction(async tx => replaceDatabaseSnapshot(tx, database)),
    () => writeFileDatabase(database)
  );
}

export async function mutateDatabase(mutator) {
  return runStoreTransaction({
    prisma: async tx => {
      const database = await loadDatabaseSnapshot(tx);
      const beforeDatabase = structuredClone(database);
      const result = await mutator(database);
      await persistDatabaseSnapshot(tx, beforeDatabase, database);
      return result;
    },
    file: () => mutateFileDatabase(mutator),
  });
}

export function getDatabaseInfo() {
  if (activeStore === 'file') {
    return getFileDatabaseInfo();
  }

  if (canUseFileFallback()) {
    return {
      ...getRepositoryDatabaseInfo(),
      fallbackAvailable: true,
    };
  }

  return getRepositoryDatabaseInfo();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
