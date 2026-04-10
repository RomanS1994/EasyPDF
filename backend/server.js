import 'dotenv/config';
import http from 'node:http';

import { requireApiKey } from './auth/context.js';
import { handleCors, sendError } from './lib/http.js';
import { routeRequest } from './routes/index.js';

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 3001);

function handleUnexpectedError(response, error) {
  const message =
    error instanceof Error ? error.message : 'Unexpected server error';

  if (
    message === 'User with this email already exists' ||
    message === 'Plan with this id already exists'
  ) {
    return sendError(response, 409, message);
  }

  if (
    message === 'Order not found' ||
    message === 'User not found' ||
    message === 'Route not found' ||
    message === 'Plan not found'
  ) {
    return sendError(response, 404, message);
  }

  if (
    message === 'Subscription limit reached' ||
    message === 'Subscription is not active' ||
    message === 'You do not have access to this order' ||
    message === 'At least one admin is required'
  ) {
    return sendError(response, 403, message);
  }

  if (
    message === 'Invalid JSON body' ||
    message === 'Request body is too large' ||
    message === 'Invalid plan' ||
    message === 'Invalid role' ||
    message === 'Name is required' ||
    message === 'Email is required' ||
    message === 'Email and password are required' ||
    message === 'Password must be at least 8 characters long' ||
    message === 'Plan name is required' ||
    message === 'Subscription end date must be after start date' ||
    message === 'Plan limit must be greater than 0'
  ) {
    return sendError(response, 400, message);
  }

  console.error('Backend error:', error);
  return sendError(response, 500, message);
}

const server = http.createServer(async (request, response) => {
  try {
    if (handleCors(request, response)) return;
    if (!requireApiKey(request, response)) return;

    await routeRequest(request, response);
  } catch (error) {
    handleUnexpectedError(response, error);
  }
});

server.listen(PORT, () => {
  console.log(`pdf.app backend is running on http://localhost:${PORT}`);
});
