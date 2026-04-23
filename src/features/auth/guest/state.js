import { getDefaultAuthMode } from '../shell/shell.js';

export const state = {
  plans: [],
  selectedPlanId: '',
  authMode: getDefaultAuthMode(),
};
