import { createClubController } from './controller/club.controller.js';
import { registerClubRoutes } from './routes/club.routes.js';

export async function init(app, registry, eventBus) {
  const clubController = createClubController();
  const requireRoles = registry.getService('requireRoles');

  if (typeof requireRoles !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerClubRoutes(app, clubController, requireRoles);

  registry.registerModule('club', {
    routes: [
      '/api/v1/clubs',
      '/api/v1/clubs/:clubId/members',
      '/api/v1/clubs/:clubId/members/:memberUserId',
      '/api/v1/clubs/:clubId/members/:memberUserId/role'
    ]
  });
}

export default init;
