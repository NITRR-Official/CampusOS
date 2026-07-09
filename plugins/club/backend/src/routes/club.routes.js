export function registerClubRoutes(app, clubController, requirePermissions) {
  const manageClubRoles = requirePermissions('club:manage');
  const manageMembers = requirePermissions('member:manage');
  const manageRoles = requirePermissions('role:manage');
  const superAdminOnly = requirePermissions('administrator');

  // Club Endpoints
  app.get('/api/v1/clubs', clubController.list);
  // Creating a club requests it; it goes to pending.
  // We can let any authenticated user request a club, or restrict it.
  app.post('/api/v1/clubs', requirePermissions(), clubController.create);

  // Approval Pipeline
  app.patch(
    '/api/v1/clubs/:clubId/approve',
    superAdminOnly,
    clubController.approveClub
  );
  app.patch(
    '/api/v1/clubs/:clubId/reject',
    superAdminOnly,
    clubController.rejectClub
  );

  // Member Management
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
    manageMembers,
    clubController.assignRole
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
