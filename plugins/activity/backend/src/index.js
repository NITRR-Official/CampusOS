import { createActivityController } from './controller/activity.controller.js';
import { registerActivityRoutes } from './routes/activity.routes.js';
import { registerAuditListeners } from './listeners/audit.listener.js';
import { createActivityService } from './service/activity.service.js';

export async function init(app, registry, eventBus) {
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  // Initialize service with registry
  const activityService = createActivityService(registry);
  const activityController = createActivityController({ activityService });

  // Register EventBus Listeners
  if (eventBus) {
    registerAuditListeners(eventBus, activityService);
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
