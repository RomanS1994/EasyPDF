import fs from 'node:fs';
import path from 'node:path';

import { PLANS as DEFAULT_PLANS } from '../config/plans.js';

const FALLBACK_DATA_FILE = path.resolve(process.cwd(), 'backend/data/db.json');
const DATA_FILE = path.resolve(process.cwd(), process.env.DATA_FILE || FALLBACK_DATA_FILE);

function seedPlans() {
  const timestamp = new Date().toISOString();

  return DEFAULT_PLANS.map(plan => ({
    ...plan,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function createEmptyDatabase() {
  return {
    meta: {
      version: 2,
      createdAt: new Date().toISOString(),
    },
    users: [],
    orders: [],
    sessions: [],
    plans: seedPlans(),
    auditLogs: [],
  };
}

function writeFreshDatabase() {
  const database = createEmptyDatabase();
  fs.writeFileSync(DATA_FILE, JSON.stringify(database, null, 2));
  return database;
}

function ensureDataFile() {
  const directory = path.dirname(DATA_FILE);
  fs.mkdirSync(directory, { recursive: true });

  if (!fs.existsSync(DATA_FILE)) {
    writeFreshDatabase();
    return;
  }

  const stats = fs.statSync(DATA_FILE);
  if (stats.size === 0) {
    writeFreshDatabase();
  }
}

export function readDatabase() {
  ensureDataFile();

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  if (!raw.trim()) {
    return writeFreshDatabase();
  }

  let parsed;

  try {
    parsed = JSON.parse(raw);
  } catch {
    const backupFile = `${DATA_FILE}.corrupt-${Date.now()}`;
    fs.writeFileSync(backupFile, raw);
    return writeFreshDatabase();
  }

  const emptyDatabase = createEmptyDatabase();

  return {
    ...emptyDatabase,
    ...parsed,
    meta: {
      ...emptyDatabase.meta,
      ...(parsed.meta || {}),
      version: 2,
    },
    users: Array.isArray(parsed.users) ? parsed.users : [],
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    plans:
      Array.isArray(parsed.plans) && parsed.plans.length
        ? parsed.plans
        : seedPlans(),
    auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
  };
}

export function writeDatabase(database) {
  ensureDataFile();

  const tempFile = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(database, null, 2));
  fs.renameSync(tempFile, DATA_FILE);
}

export function mutateDatabase(mutator) {
  const database = readDatabase();
  const result = mutator(database);
  writeDatabase(database);
  return result;
}

export function getDataFilePath() {
  return DATA_FILE;
}
