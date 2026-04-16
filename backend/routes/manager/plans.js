import { appendAuditLog } from '../../audit/service.js';
import { requireManager } from '../../auth/context.js';
import { mutateFileDatabase as mutateDatabase } from '../../db/file-store.js';
import { createAuditLog } from '../../db/prisma-helpers.js';
import { findStoredPlan, listStoredPlans } from '../../db/plans-store.js';
import { prisma } from '../../db/prisma.js';
import { runStoreTransaction } from '../../db/store.js';
import { readJsonBody, sendJson } from '../../lib/http.js';
import {
  getDatabasePlans,
  normalizePlanRecord,
  slugifyPlanId,
} from '../../services/plans.js';
import { normalizePlanView } from '../../services/prisma-views.js';
import { normalizeInteger, normalizeText, nowIso } from '../../validation/common.js';
import { validatePlanCreateInput } from '../../validation/manager.js';

export async function handleManagerPlansList(request, response) {
  const context = await requireManager(request, response);
  if (!context) return;

  if (context.store === 'prisma') {
    sendJson(response, 200, {
      plans: await listStoredPlans(prisma, { includeInactive: true }),
    });
    return;
  }

  sendJson(response, 200, {
    plans: getDatabasePlans(context.database, { includeInactive: true }),
  });
}

export async function handleManagerPlanCreate(request, response) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);
  const { limit, name } = validatePlanCreateInput(body);

  if (context.store === 'prisma') {
    const plan = await runStoreTransaction({
      prisma: async tx => {
        const planId = slugifyPlanId(body.id || name);
        const existingPlan = await findStoredPlan(tx, planId);

        if (existingPlan) {
          throw new Error('Plan with this id already exists');
        }

        const nextPlan = await tx.plan.create({
          data: {
            id: planId,
            name,
            monthlyGenerationLimit: limit,
            description: body.description || '',
            isActive: body.isActive !== false,
            createdAt: new Date(nowIso()),
            updatedAt: new Date(nowIso()),
          },
        });

        const normalized = normalizePlanView(nextPlan);
        await createAuditLog(tx, {
          action: 'plan.created',
          actorUserId: context.user.id,
          entityType: 'plan',
          entityId: nextPlan.id,
          after: normalized,
        });

        return normalized;
      },
      file: () =>
        mutateDatabase(database => {
          const planId = slugifyPlanId(body.id || name);

          if (database.plans.some(item => item.id === planId)) {
            throw new Error('Plan with this id already exists');
          }

          const nextPlan = normalizePlanRecord({
            id: planId,
            name,
            monthlyGenerationLimit: limit,
            description: body.description,
            isActive: body.isActive !== false,
            createdAt: nowIso(),
            updatedAt: nowIso(),
          });

          database.plans.push(nextPlan);
          appendAuditLog(database, {
            action: 'plan.created',
            actorUserId: context.user.id,
            entityType: 'plan',
            entityId: nextPlan.id,
            after: nextPlan,
          });

          return nextPlan;
        }),
    });

    sendJson(response, 201, { plan });
    return;
  }

  const plan = await mutateDatabase(database => {
    const planId = slugifyPlanId(body.id || name);

    if (database.plans.some(item => item.id === planId)) {
      throw new Error('Plan with this id already exists');
    }

    const nextPlan = normalizePlanRecord({
      id: planId,
      name,
      monthlyGenerationLimit: limit,
      description: body.description,
      isActive: body.isActive !== false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });

    database.plans.push(nextPlan);
    appendAuditLog(database, {
      action: 'plan.created',
      actorUserId: context.user.id,
      entityType: 'plan',
      entityId: nextPlan.id,
      after: nextPlan,
    });

    return nextPlan;
  });

  sendJson(response, 201, { plan });
}

export async function handleManagerPlanUpdate(request, response, planId) {
  const context = await requireManager(request, response);
  if (!context) return;

  const body = await readJsonBody(request);

  if (context.store === 'prisma') {
    const plan = await runStoreTransaction({
      prisma: async tx => {
        const target = await findStoredPlan(tx, planId);

        if (!target) {
          throw new Error('Plan not found');
        }

        const before = normalizePlanView(target);
        const nextLimit =
          body.monthlyGenerationLimit !== undefined
            ? normalizeInteger(body.monthlyGenerationLimit, target.monthlyGenerationLimit)
            : target.monthlyGenerationLimit;

        if (nextLimit <= 0) {
          throw new Error('Plan limit must be greater than 0');
        }

        const updated = await tx.plan.update({
          where: {
            id: planId,
          },
          data: {
            ...(body.name !== undefined
              ? { name: normalizeText(body.name) || target.name }
              : {}),
            ...(body.description !== undefined
              ? { description: normalizeText(body.description) }
              : {}),
            ...(body.monthlyGenerationLimit !== undefined
              ? { monthlyGenerationLimit: nextLimit }
              : {}),
            ...(body.isActive !== undefined ? { isActive: body.isActive !== false } : {}),
            updatedAt: new Date(nowIso()),
          },
        });

        const after = normalizePlanView(updated);
        await createAuditLog(tx, {
          action: 'plan.updated',
          actorUserId: context.user.id,
          entityType: 'plan',
          entityId: updated.id,
          before,
          after,
        });

        return after;
      },
      file: () =>
        mutateDatabase(database => {
          const target = database.plans.find(item => item.id === planId);
          if (!target) {
            throw new Error('Plan not found');
          }

          const before = { ...normalizePlanRecord(target) };

          if (body.name !== undefined) {
            target.name = normalizeText(body.name) || target.name;
          }
          if (body.description !== undefined) {
            target.description = normalizeText(body.description);
          }
          if (body.monthlyGenerationLimit !== undefined) {
            const nextLimit = normalizeInteger(body.monthlyGenerationLimit, target.monthlyGenerationLimit);
            if (nextLimit <= 0) {
              throw new Error('Plan limit must be greater than 0');
            }
            target.monthlyGenerationLimit = nextLimit;
          }
          if (body.isActive !== undefined) {
            target.isActive = body.isActive !== false;
          }
          target.updatedAt = nowIso();

          const after = normalizePlanRecord(target);
          appendAuditLog(database, {
            action: 'plan.updated',
            actorUserId: context.user.id,
            entityType: 'plan',
            entityId: target.id,
            before,
            after,
          });

          return after;
        }),
    });

    sendJson(response, 200, { plan });
    return;
  }

  const plan = await mutateDatabase(database => {
    const target = database.plans.find(item => item.id === planId);
    if (!target) {
      throw new Error('Plan not found');
    }

    const before = { ...normalizePlanRecord(target) };

    if (body.name !== undefined) {
      target.name = normalizeText(body.name) || target.name;
    }
    if (body.description !== undefined) {
      target.description = normalizeText(body.description);
    }
    if (body.monthlyGenerationLimit !== undefined) {
      const nextLimit = normalizeInteger(body.monthlyGenerationLimit, target.monthlyGenerationLimit);
      if (nextLimit <= 0) {
        throw new Error('Plan limit must be greater than 0');
      }
      target.monthlyGenerationLimit = nextLimit;
    }
    if (body.isActive !== undefined) {
      target.isActive = body.isActive !== false;
    }
    target.updatedAt = nowIso();

    const after = normalizePlanRecord(target);
    appendAuditLog(database, {
      action: 'plan.updated',
      actorUserId: context.user.id,
      entityType: 'plan',
      entityId: target.id,
      before,
      after,
    });

    return after;
  });

  sendJson(response, 200, { plan });
}
