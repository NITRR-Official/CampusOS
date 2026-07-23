import { createClubController } from './controller/club.controller.js';
import { registerClubRoutes } from './routes/club.routes.js';
import { createClubService } from './service/club.service.js';
import { createRoleService } from './service/role.service.js';
import { createMemberService } from './service/member.service.js';
import { createProvisioningService } from './service/provisioning.service.js';
import { createClubRepository } from './repository/club.repository.js';
import { Club } from './schema/club.model.js';
import { ClubMember } from './schema/clubMember.model.js';
import { Role as ClubRole } from './schema/role.model.js';
import { createVerificationRepository } from './repository/verification.repository.js';
import { createVerificationService } from './service/verification.service.js';
import { VerificationToken } from './schema/verification-token.model.js';
import { createSlugResolver } from './middleware/slug-resolver.js';
import { registerEventHandlers } from './listeners/index.js';
import { registerClubPermissions } from './permissions/index.js';
import { createClubRbacPolicy } from './policy/club-rbac.policy.js';

export async function init(app, registry, eventBus) {
  const clubRepository = createClubRepository(Club, ClubMember, ClubRole);

  const authService = registry.getService('auth:service');
  const clubRbacPolicy = createClubRbacPolicy(
    clubRepository,
    registry.permissions
  );

  const roleService = createRoleService(clubRepository);
  const memberService = createMemberService(clubRepository, authService);
  const provisioningService = createProvisioningService(
    clubRepository,
    authService
  );
  const clubService = createClubService(
    clubRepository,
    eventBus,
    provisioningService
  );

  const verificationRepository =
    createVerificationRepository(VerificationToken);
  const verificationService = createVerificationService(
    verificationRepository,
    clubService
  );

  const clubController = createClubController(
    clubService,
    roleService,
    memberService,
    verificationService,
    clubRbacPolicy
  );

  const requirePermissions = registry.getService('requirePermissions');
  const requireSuperAdmin = registry.getService('requireSuperAdmin');

  if (typeof requirePermissions !== 'function') {
    throw new Error('Permission middleware service is not configured');
  }

  registry.registerPublicRoute(/^\/api\/v1\/clubs$/, 'GET');
  registry.registerPublicRoute(/^\/api\/v1\/clubs\/verify$/, 'GET');

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
    registerEventHandlers(eventBus, {
      memberService,
      verificationService,
      authService,
      roleService
    });
  }

  // Also register role:service for other plugins to use
  registry.registerService('club:role_service', roleService);

  registry.registerModule('club', {
    routes: [
      '/api/v1/clubs',
      '/api/v1/clubs/:clubId/members',
      '/api/v1/clubs/:clubId/members/:memberUserId',
      '/api/v1/clubs/:clubId/members/:memberUserId/role'
    ]
  });

  registerClubPermissions(registry);
}

export default init;
