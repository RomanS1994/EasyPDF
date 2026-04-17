import { handleAdminRoutes } from './admin.js';
import { handleAuthRoutes } from './auth/index.js';
import { handleManagerRoutes } from './manager/index.js';
import { handleMeRoutes } from './me.js';
import { handleOrderRoutes } from './orders.js';
import { handlePublicRoutes } from './public.js';

const routeHandlers = [
  handlePublicRoutes,
  handleAuthRoutes,
  handleMeRoutes,
  handleOrderRoutes,
  handleManagerRoutes,
  handleAdminRoutes,
];

export async function routeRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  const context = {
    url,
    pathName: url.pathname,
  };

  for (const handleRoute of routeHandlers) {
    if (await handleRoute(request, response, context)) {
      return;
    }
  }

  throw new Error('Route not found');
}
