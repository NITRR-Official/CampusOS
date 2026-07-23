export function registerResourceHandlers(eventBus, registry, resourceService) {
  eventBus.on('event:deleted', async (payload) => {
    if (payload && payload.eventId) {
      await resourceService.deleteEventAllocations(payload.eventId);
    }
  });

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
        'resource:view'
      ]);
    }
    if (volunteerId) {
      await clubRoleService.systemAddPermissionsToRole(clubId, volunteerId, [
        'resource:view'
      ]);
    }
  });
}
