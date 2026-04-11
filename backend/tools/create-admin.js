import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { appendAuditLog } from '../audit/service.js';
import { hashPassword } from '../auth/tokens.js';
import { DEFAULT_PLAN_ID } from '../config/plans.js';
import { mutateFileDatabase } from '../db/file-store.js';
import {
  buildSanitizedUser,
  createAuditLog,
  USER_WITH_SUBSCRIPTION_INCLUDE,
} from '../db/prisma-helpers.js';
import { findStoredPlan } from '../db/plans-store.js';
import { disconnectDatabase, runStoreTransaction } from '../db/store.js';
import { getPlanRecord } from '../services/plans.js';
import { normalizeUserProfile } from '../services/profiles.js';
import {
  buildCycleWindow,
  buildSubscriptionAssignment,
} from '../services/subscriptions.js';
import { sanitizeUser } from '../services/users.js';
import { normalizeEmail, normalizeText, nowIso } from '../validation/common.js';

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (!value.startsWith('--')) {
      continue;
    }

    const withoutPrefix = value.slice(2);
    if (!withoutPrefix) {
      continue;
    }

    const [rawKey, inlineValue] = withoutPrefix.split('=');
    const key = rawKey.trim();
    if (!key) {
      continue;
    }

    if (inlineValue !== undefined) {
      args[key] = inlineValue;
      continue;
    }

    const nextValue = argv[index + 1];
    if (!nextValue || nextValue.startsWith('--')) {
      args[key] = true;
      continue;
    }

    args[key] = nextValue;
    index += 1;
  }

  return args;
}

function printUsage() {
  console.log(
    [
      'Usage:',
      '  node tools/create-admin.js --email=admin@example.com --name="Admin" --password="strong-password"',
      '',
      'Options:',
      '  --email              Required. Admin email.',
      '  --name               Required for new admin. Optional when promoting existing user.',
      '  --password           Required for new admin. Optional when promoting existing user.',
      '  --plan               Optional. Defaults to plan-25 for new admins or users without subscription.',
      '  --promote-existing   Optional. Promote existing user to admin instead of failing.',
    ].join('\n')
  );
}

async function createOrPromoteAdmin({
  email,
  name,
  password,
  planId,
  promoteExisting,
}) {
  return runStoreTransaction({
    prisma: async tx => {
      const existingUser = await tx.user.findUnique({
        where: {
          email,
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      if (existingUser) {
        if (!promoteExisting) {
          throw new Error(
            'User already exists. Re-run with --promote-existing to grant admin role.'
          );
        }

        const nextName = normalizeText(name) || existingUser.name;
        const nextProfile = normalizeUserProfile(existingUser.profile, nextName);
        let nextUser = await tx.user.update({
          where: {
            id: existingUser.id,
          },
          data: {
            role: 'admin',
            ...(normalizeText(name) ? { name: nextName } : {}),
            ...(password ? { passwordHash: hashPassword(password) } : {}),
            ...(normalizeText(name) ? { profile: nextProfile } : {}),
            updatedAt: new Date(nowIso()),
          },
          include: USER_WITH_SUBSCRIPTION_INCLUDE,
        });

        if (!nextUser.subscription) {
          const selectedPlan = await findStoredPlan(tx, planId, {
            includeInactive: false,
          });

          if (!selectedPlan) {
            throw new Error('Invalid plan');
          }

          const timestamp = nowIso();
          const cycle = buildCycleWindow(timestamp);
          await tx.subscription.create({
            data: {
              id: nextUser.id,
              userId: nextUser.id,
              planId: selectedPlan.id,
              status: 'active',
              source: 'admin_cli',
              currentPeriodStart: new Date(timestamp),
              currentPeriodEnd: new Date(cycle.currentPeriodEnd),
              monthlyGenerationLimit: selectedPlan.monthlyGenerationLimit,
              quotaOverride: null,
              assignedByUserId: null,
              assignedAt: new Date(timestamp),
              notes: 'Created via admin CLI bootstrap',
              canceledAt: null,
            },
          });

          nextUser = await tx.user.findUnique({
            where: {
              id: nextUser.id,
            },
            include: USER_WITH_SUBSCRIPTION_INCLUDE,
          });
        }

        if (!nextUser) {
          throw new Error('User not found');
        }

        await createAuditLog(tx, {
          action: 'user.admin.provisioned',
          targetUserId: nextUser.id,
          entityType: 'user',
          entityId: nextUser.id,
          before: {
            role: existingUser.role,
          },
          after: {
            role: nextUser.role,
          },
          meta: {
            source: 'admin_cli',
            promotedExisting: true,
          },
        });

        return buildSanitizedUser(tx, nextUser);
      }

      if (!normalizeText(name)) {
        throw new Error('Name is required for a new admin');
      }

      if (!password) {
        throw new Error('Password is required for a new admin');
      }

      const selectedPlan = await findStoredPlan(tx, planId, {
        includeInactive: false,
      });

      if (!selectedPlan) {
        throw new Error('Invalid plan');
      }

      const timestamp = nowIso();
      const cycle = buildCycleWindow(timestamp);
      const userId = randomUUID();
      const createdUser = await tx.user.create({
        data: {
          id: userId,
          name: normalizeText(name),
          email,
          passwordHash: hashPassword(password),
          role: 'admin',
          profile: normalizeUserProfile(null, name),
          subscription: {
            create: {
              id: userId,
              planId: selectedPlan.id,
              status: 'active',
              source: 'admin_cli',
              currentPeriodStart: new Date(timestamp),
              currentPeriodEnd: new Date(cycle.currentPeriodEnd),
              monthlyGenerationLimit: selectedPlan.monthlyGenerationLimit,
              quotaOverride: null,
              assignedByUserId: null,
              assignedAt: new Date(timestamp),
              notes: 'Created via admin CLI bootstrap',
              canceledAt: null,
            },
          },
        },
        include: USER_WITH_SUBSCRIPTION_INCLUDE,
      });

      await createAuditLog(tx, {
        action: 'user.admin.provisioned',
        targetUserId: createdUser.id,
        entityType: 'user',
        entityId: createdUser.id,
        after: {
          role: createdUser.role,
          email: createdUser.email,
        },
        meta: {
          source: 'admin_cli',
          promotedExisting: false,
        },
      });

      return buildSanitizedUser(tx, createdUser);
    },
    file: () =>
      mutateFileDatabase(database => {
        const existingUser = database.users.find(item => item.email === email) || null;

        if (existingUser) {
          if (!promoteExisting) {
            throw new Error(
              'User already exists. Re-run with --promote-existing to grant admin role.'
            );
          }

          const beforeRole = existingUser.role;
          const nextName = normalizeText(name) || existingUser.name;
          existingUser.role = 'admin';
          existingUser.name = nextName;
          if (password) {
            existingUser.passwordHash = hashPassword(password);
          }
          if (normalizeText(name)) {
            existingUser.profile = normalizeUserProfile(existingUser.profile, nextName);
          }
          if (!existingUser.subscription) {
            existingUser.subscription = buildSubscriptionAssignment(
              database,
              planId,
              {
                source: 'admin_cli',
                status: 'active',
                currentPeriodStart: nowIso(),
                notes: 'Created via admin CLI bootstrap',
              },
              null
            );
            existingUser.planId = existingUser.subscription.planId;
          }
          existingUser.updatedAt = nowIso();

          appendAuditLog(database, {
            action: 'user.admin.provisioned',
            targetUserId: existingUser.id,
            entityType: 'user',
            entityId: existingUser.id,
            before: {
              role: beforeRole,
            },
            after: {
              role: existingUser.role,
            },
            meta: {
              source: 'admin_cli',
              promotedExisting: true,
            },
          });

          return sanitizeUser(database, existingUser);
        }

        if (!normalizeText(name)) {
          throw new Error('Name is required for a new admin');
        }

        if (!password) {
          throw new Error('Password is required for a new admin');
        }

        const selectedPlan = getPlanRecord(database, planId, {
          includeInactive: false,
        });

        if (!selectedPlan) {
          throw new Error('Invalid plan');
        }

        const timestamp = nowIso();
        const user = {
          id: randomUUID(),
          name: normalizeText(name),
          email,
          passwordHash: hashPassword(password),
          role: 'admin',
          planId: selectedPlan.id,
          profile: normalizeUserProfile(null, name),
          subscription: buildSubscriptionAssignment(
            database,
            selectedPlan.id,
            {
              source: 'admin_cli',
              status: 'active',
              currentPeriodStart: timestamp,
              notes: 'Created via admin CLI bootstrap',
            },
            null
          ),
          createdAt: timestamp,
          updatedAt: timestamp,
        };

        database.users.push(user);
        appendAuditLog(database, {
          action: 'user.admin.provisioned',
          targetUserId: user.id,
          entityType: 'user',
          entityId: user.id,
          after: {
            role: user.role,
            email: user.email,
          },
          meta: {
            source: 'admin_cli',
            promotedExisting: false,
          },
        });

        return sanitizeUser(database, user);
      }),
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || args.h) {
    printUsage();
    return;
  }

  const email = normalizeEmail(args.email);
  const name = normalizeText(args.name);
  const password = String(args.password || '');
  const planId = normalizeText(args.plan) || DEFAULT_PLAN_ID;
  const promoteExisting = Boolean(args['promote-existing']);

  if (!email) {
    throw new Error('Email is required');
  }

  const user = await createOrPromoteAdmin({
    email,
    name,
    password,
    planId,
    promoteExisting,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          planId: user.planId,
        },
      },
      null,
      2
    )
  );
}

const isEntrypoint =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main()
    .catch(error => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    })
    .finally(async () => {
      await disconnectDatabase();
    });
}
