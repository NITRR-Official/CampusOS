import { activityController } from './controller/activity.controller.js';
import { registerActivityRoutes } from './routes/activity.routes.js';
import { registerAuditListeners } from './listeners/audit.listener.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  // Register public routes
  registry.registerPublicRoute(/^\/api\/v1\/activity\/global$/, 'GET');
  registry.registerPublicRoute(/^\/api\/v1\/activity\/me$/, 'GET');
  registry.registerPublicRoute(/^\/api\/v1\/activity\/entity\/.+$/, 'GET');

  // Register EventBus Listeners
  if (eventBus) {
    registerAuditListeners(eventBus);
  }

  // Register API Routes
  registerActivityRoutes(app, activityController, requirePermissions);

  registry.registerModule('activity', {
    routes: ['/api/v1/activity']
  });

  return {
    name: 'activity',
    status: 'initialized'
  };
}
