export const PLANS = [
  {
    id: 'plan-25',
    name: 'Starter 25',
    monthlyGenerationLimit: 25,
    description: '25 PDF/order generations per month',
  },
  {
    id: 'plan-50',
    name: 'Growth 50',
    monthlyGenerationLimit: 50,
    description: '50 PDF/order generations per month',
  },
  {
    id: 'plan-100',
    name: 'Scale 100',
    monthlyGenerationLimit: 100,
    description: '100 PDF/order generations per month',
  },
];

export const DEFAULT_PLAN_ID = PLANS[0].id;

export function getPlanById(planId) {
  return PLANS.find(plan => plan.id === planId) || null;
}
