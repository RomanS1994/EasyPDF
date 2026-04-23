import { sendError } from './http.js';

const STATUS_BY_MESSAGE = new Map([
  ['User with this email already exists', 409],
  ['Plan with this id already exists', 409],
  ['Order not found', 404],
  ['User not found', 404],
  ['Route not found', 404],
  ['Plan not found', 404],
  ['Subscription limit reached', 403],
  ['Subscription is not active', 403],
  ['You do not have access to this order', 403],
  ['At least one admin is required', 403],
  ['Too many failed login attempts. Try again later.', 429],
  ['Too many failed registration attempts. Try again later.', 429],
  ['Invalid JSON body', 400],
  ['Request body is too large', 400],
  ['Invalid plan', 400],
  ['Invalid PDF document type', 400],
  ['Invalid role', 400],
  ['Name is required', 400],
  ['Email is required', 400],
  ['Email and password are required', 400],
  ['Order id is required for PDF generation', 400],
  ['Password must be at least 8 characters long', 400],
  ['Plan name is required', 400],
  ['Subscription end date must be after start date', 400],
  ['Plan limit must be greater than 0', 400],
  ['Order contract data is incomplete', 400],
]);

export function resolveErrorStatus(error) {
  const message = error instanceof Error ? error.message : String(error);
  return STATUS_BY_MESSAGE.get(message) || 500;
}

export function sendHttpError(response, error) {
  const message = error instanceof Error ? error.message : 'Unexpected server error';
  const status = resolveErrorStatus(error);

  if (status === 500) {
    console.error('Backend error:', error);
  }

  return sendError(response, status, message);
}
