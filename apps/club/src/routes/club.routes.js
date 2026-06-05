export function registerClubRoutes(app, clubController, requireRoles) {
  const manageClubRoles = requireRoles('admin', 'coordinator');

  app.get('/api/v1/clubs', clubController.list);
  app.post('/api/v1/clubs', manageClubRoles, clubController.create);
  app.patch(
    '/api/v1/clubs/:clubId/approve',
    manageClubRoles,
    clubController.approveClub
  );
  app.patch(
    '/api/v1/clubs/:clubId/reject',
    manageClubRoles,
    clubController.rejectClub
  );

  app.post(
    '/api/v1/clubs/:clubId/members',
    manageClubRoles,
    clubController.addMember
  );
  app.delete(
    '/api/v1/clubs/:clubId/members/:memberUserId',
    manageClubRoles,
    clubController.removeMember
  );
  app.patch(
    '/api/v1/clubs/:clubId/members/:memberUserId/role',
    manageClubRoles,
    clubController.assignRole
  );
}

export default registerClubRoutes;
