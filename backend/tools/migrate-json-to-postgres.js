import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';

import { DEFAULT_PLAN_ID, PLANS as DEFAULT_PLANS } from '../config/plans.js';
import { writeDatabase } from '../db/legacy-store.js';
import { disconnectDatabase } from '../db/store.js';
import { normalizeUserProfile } from '../services/profiles.js';
import { buildDefaultSubscription } from '../services/subscriptions.js';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--input') {
      args.input = argv[index + 1];
      index += 1;
      continue;
    }

    if (value.startsWith('--input=')) {
      args.input = value.slice('--input='.length);
    }
  }

  return args;
}

function normalizeLegacyDatabase(database) {
  const source = database && typeof database === 'object' ? database : {};
  const plans =
    Array.isArray(source.plans) && source.plans.length
      ? source.plans
      : DEFAULT_PLANS;
  const planIds = new Set(plans.map(plan => plan.id));

  return {
    plans,
    sessions: Array.isArray(source.sessions) ? source.sessions : [],
    orders: Array.isArray(source.orders) ? source.orders : [],
    auditLogs: Array.isArray(source.auditLogs) ? source.auditLogs : [],
    users: Array.isArray(source.users)
      ? source.users.map(user => {
          const nextUser = {
            ...user,
            name: user.name || '',
            planId:
              user.planId && planIds.has(user.planId) ? user.planId : DEFAULT_PLAN_ID,
            profile: normalizeUserProfile(user.profile, user.name),
          };

          if (!nextUser.subscription) {
            nextUser.subscription = buildDefaultSubscription(
              { plans },
              nextUser,
              { source: 'legacy_migration' }
            );
          }

          return nextUser;
        })
      : [],
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const inputPath =
    args.input ||
    process.env.LEGACY_DATA_FILE ||
    path.resolve(process.cwd(), 'data/db.json');
  const resolvedPath = path.resolve(process.cwd(), inputPath);
  const raw = await fs.readFile(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);
  const legacyDatabase = normalizeLegacyDatabase(parsed);

  await writeDatabase(legacyDatabase);

  console.log(
    JSON.stringify(
      {
        ok: true,
        source: resolvedPath,
        imported: {
          users: legacyDatabase.users.length,
          sessions: legacyDatabase.sessions.length,
          plans: legacyDatabase.plans.length,
          orders: legacyDatabase.orders.length,
          auditLogs: legacyDatabase.auditLogs.length,
        },
      },
      null,
      2
    )
  );
}

main()
  .catch(error => {
    console.error('JSON to PostgreSQL migration failed');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
