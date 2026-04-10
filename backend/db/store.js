import { prisma } from './prisma.js';
import {
  getDatabaseInfo as getRepositoryDatabaseInfo,
  loadDatabaseSnapshot,
  persistDatabaseSnapshot,
  replaceDatabaseSnapshot,
} from './repository.js';

export async function readDatabase() {
  return prisma.$transaction(async tx => loadDatabaseSnapshot(tx));
}

export async function writeDatabase(database) {
  return prisma.$transaction(async tx => replaceDatabaseSnapshot(tx, database));
}

export async function mutateDatabase(mutator) {
  return prisma.$transaction(async tx => {
    const database = await loadDatabaseSnapshot(tx);
    const beforeDatabase = structuredClone(database);
    const result = await mutator(database);
    await persistDatabaseSnapshot(tx, beforeDatabase, database);
    return result;
  });
}

export function getDatabaseInfo() {
  return getRepositoryDatabaseInfo();
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}
