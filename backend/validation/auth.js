import { DEFAULT_PLAN_ID } from '../config/plans.js';
import { normalizeEmail, normalizeText } from './common.js';

export function validateRegistrationInput(body = {}) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');
  const name = normalizeText(body.name);
  const selectedPlanId = normalizeText(body.planId);

  if (!name) {
    throw new Error('Name is required');
  }

  if (!email) {
    throw new Error('Email is required');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return {
    email,
    name,
    password,
    selectedPlanId: selectedPlanId || DEFAULT_PLAN_ID,
  };
}

export function validateLoginInput(body = {}) {
  const email = normalizeEmail(body.email);
  const password = String(body.password || '');

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  return {
    email,
    password,
  };
}
