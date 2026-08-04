import { registerPluginRoutes } from './routes/plugin.routes.js';
import { initPluginService } from './service/plugin.service.js';

export async function init(app, registry, eventBus) {
  initPluginService(registry);
  const requirePermissions = registry.getService('requirePermissions');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerPluginRoutes(app, requirePermissions);

  registry.registerModule('plugin-manager', {
    routes: [
      'GET /api/v1/plugins',
      'PUT /api/v1/plugins/:name/toggle',
      'POST /api/v1/plugins/restart'
    ]
  });
}
