export function resolveNextMonthlyGenerationLimit(body, before, nextPlanId) {
  return body.monthlyGenerationLimit !== undefined &&
    body.monthlyGenerationLimit !== null &&
    body.monthlyGenerationLimit !== ''
    ? body.monthlyGenerationLimit
    : nextPlanId === before.planId
      ? before.monthlyGenerationLimit
      : undefined;
}
