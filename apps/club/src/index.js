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

  // Register atomic permissions for RBAC
  if (registry.permissions) {
    registry.permissions.register({
      id: 'club:manage',
      module: 'club',
      label: 'Manage Club Settings',
      description:
        'Allows editing core club details like description and category'
    });
    registry.permissions.register({
      id: 'member:manage',
      module: 'club',
      label: 'Manage Members',
      description: 'Allows kicking members and assigning basic roles'
    });
    registry.permissions.register({
      id: 'role:manage',
      module: 'club',
      label: 'Manage Roles',
      description: 'Allows creating custom roles and editing the role hierarchy'
    });
  }
}

export default init;
