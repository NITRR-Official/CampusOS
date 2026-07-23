export function registerTaskHandlers(eventBus, registry) {
  eventBus.on('club:roles_provisioned', async (payload) => {
    if (!payload || !payload.clubId || !payload.roles) return;

    const clubRoleService = registry.getService('club:role_service');
    if (!clubRoleService) return;

    const {
      clubId,
      roles: { coordinatorId, volunteerId }
    } = payload;

    if (coordinatorId) {
      await clubRoleService.systemAddPermissionsToRole(clubId, coordinatorId, [
        'task:view'
      ]);
    }
    if (volunteerId) {
      await clubRoleService.systemAddPermissionsToRole(clubId, volunteerId, [
        'task:view'
      ]);
    }
  });
}
