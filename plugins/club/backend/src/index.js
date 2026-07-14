import { createClubController } from './controller/club.controller.js';
import { registerClubRoutes } from './routes/club.routes.js';
import { createClubService } from './service/club.service.js';
import { createClubRepository } from './repository/club.repository.js';
import { Club } from './schema/club.model.js';
import { ClubMember } from './schema/clubMember.model.js';
import { Role as ClubRole } from './schema/role.model.js';
import { verificationService } from './service/verification.service.js';
import { mailProvider } from './service/mail.provider.js';
import { createSlugResolver } from './middleware/slug-resolver.js';

export async function init(app, registry, eventBus) {
  const models = registry.getService('core:models');
  if (!models || !models.User) {
    throw new Error('core:models service not found in registry');
  }

  const clubRepository = createClubRepository(
    Club,
    ClubMember,
    ClubRole,
    models.User
  );
  const clubService = createClubService(clubRepository, eventBus, registry);
  const clubController = createClubController(clubService);
  const requirePermissions = registry.getService('requirePermissions');
  const requireSuperAdmin = registry.getService('requireSuperAdmin');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registerClubRoutes(
    app,
    clubController,
    requirePermissions,
    requireSuperAdmin
  );

  // Mount the slug resolver middleware globally for all downstream plugins under /api/v1
  const slugResolver = createSlugResolver(Club);
  app.use('/api/v1', slugResolver);

  if (eventBus) {
    eventBus.on('club.proposed', async (club) => {
      try {
        const token = await verificationService.generateTokenForClub(
          club.id || club._id
        );
        await mailProvider.sendVerificationEmail(club.email, club.name, token);
      } catch (err) {
        console.error(
          'Failed to send verification email for club proposal:',
          err
        );
      }
    });

    eventBus.on('user:deleted', async (payload) => {
      if (payload && payload.userId) {
        await clubService.removeAllUserMemberships(payload.userId);
      }
    });
  }

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
