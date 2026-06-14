export function registerClubRoutes(
  app,
  clubController,
  requireRoles,
  requirePermissions
) {
  const manageClubRoles = requireRoles('admin', 'coordinator');
  const managePermissions = requirePermissions || requireRoles;

  app.get('/api/v1/clubs', clubController.list);
  // Creating a club request is open to any authenticated user; approval is restricted to Super Admin
  app.post('/api/v1/clubs', clubController.create);

  // Super Admin approval endpoints
  app.patch('/api/v1/clubs/:clubId/approve', clubController.approveClub);
  app.patch('/api/v1/clubs/:clubId/reject', clubController.rejectClub);

  // Member management (requires member:manage permission)
  app.post(
    '/api/v1/clubs/:clubId/members',
    managePermissions('member:manage'),
    clubController.addMember
  );
  app.delete(
    '/api/v1/clubs/:clubId/members/:memberUserId',
    managePermissions('member:manage'),
    clubController.removeMember
  );
  app.patch(
    '/api/v1/clubs/:clubId/members/:memberUserId/role',
    managePermissions('member:manage'),
    clubController.assignRole
  );

  // Role management (requires role:manage permission)
  app.get(
    '/api/v1/clubs/:clubId/roles',
    managePermissions('role:manage'),
    clubController.listRoles
  );
  app.post(
    '/api/v1/clubs/:clubId/roles',
    managePermissions('role:manage'),
    clubController.createRole
  );
  app.post('/api/v1/admin/clubs', clubController.adminApproveClub);
}

export default registerClubRoutes;
