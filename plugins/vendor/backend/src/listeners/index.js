export function registerVendorHandlers(eventBus, registry, vendorService) {
  eventBus.on('event:deleted', async (payload) => {
    if (payload && payload.eventId) {
      await vendorService.deleteEventAssignments(payload.eventId);
    }
  });

  eventBus.on('club:roles_provisioned', async (payload) => {
    if (!payload || !payload.clubId || !payload.roles) return;

    const clubRoleService = registry.getService('club:role_service');
    if (!clubRoleService) return;

    const {
      clubId,
      roles: { coordinatorId }
    } = payload;

    if (coordinatorId) {
      await clubRoleService.systemAddPermissionsToRole(clubId, coordinatorId, [
        'vendor:view'
      ]);
    }
  });
}
