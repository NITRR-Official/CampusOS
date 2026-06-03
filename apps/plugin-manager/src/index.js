import { registerPluginRoutes } from './routes/plugin.routes.js';

export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerPluginRoutes(app, requireRoles);

  registry.registerModule('plugin-manager', {
    routes: [
      'GET /api/v1/plugins',
      'PUT /api/v1/plugins/:name/toggle',
      'POST /api/v1/plugins/restart'
    ]
  });
}
