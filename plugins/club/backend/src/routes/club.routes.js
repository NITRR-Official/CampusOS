export function registerClubRoutes(
  app,
  clubController,
  requirePermissions,
  requireSuperAdmin
) {
  const manageClubRoles = requirePermissions('club:manage');
  const manageMembers = requirePermissions('member:manage');
  const manageRoles = requirePermissions('role:manage');

  // Club Endpoints
  app.get('/api/v1/clubs', clubController.list);
  // Creating a club requests it; it goes to pending.
  // We can let any authenticated user request a club, or restrict it.
  app.post('/api/v1/clubs', requirePermissions(), clubController.create);

  // Email verification route
  app.get('/api/v1/clubs/verify', clubController.verifyEmail);

  // Club Management
  app.patch(
    '/api/v1/clubs/:clubId',
    requirePermissions('club:manage'),
    clubController.update
  );

  app.post(
    '/api/v1/clubs/:clubId/archive',
    requirePermissions(), // Handled internally by controller/service
    clubController.archive
  );

  app.get('/api/v1/clubs/:clubId/my-permissions', clubController.myPermissions);

  // Approval Pipeline
  app.patch(
    '/api/v1/clubs/:clubId/approve',
    requireSuperAdmin,
    clubController.approveClub
  );
  app.patch(
    '/api/v1/clubs/:clubId/reject',
    requireSuperAdmin,
    clubController.rejectClub
  );

  // Member Management
  app.get(
    '/api/v1/clubs/:clubId/members',
    requirePermissions('club:manage', 'member:manage'),
    clubController.listMembers
  );
  app.post(
    '/api/v1/clubs/:clubId/members',
    manageMembers,
    clubController.addMember
  );
  app.delete(
    '/api/v1/clubs/:clubId/members/:memberUserId',
    manageMembers,
    clubController.removeMember
  );
  app.patch(
    '/api/v1/clubs/:clubId/members/:memberUserId/role',
    manageRoles,
    clubController.assignRole
  );
  app.delete(
    '/api/v1/clubs/:clubId/members/:memberUserId/roles/:roleName',
    manageRoles,
    clubController.revokeRole
  );

  // Role Management
  // listRoles requires either role:manage or club:manage so they can view the roles
  app.get(
    '/api/v1/clubs/:clubId/roles',
    requirePermissions('role:manage', 'club:manage'),
    clubController.listRoles
  );
  app.post(
    '/api/v1/clubs/:clubId/roles',
    manageRoles,
    clubController.createRole
  );
  app.patch(
    '/api/v1/clubs/:clubId/roles/:roleId',
    manageRoles,
    clubController.updateRole
  );
  app.delete(
    '/api/v1/clubs/:clubId/roles/:roleId',
    manageRoles,
    clubController.deleteRole
  );
}

export default registerClubRoutes;
