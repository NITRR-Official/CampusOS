export function registerVendorHandlers(eventBus, registry, vendorService) {
  eventBus.on('event:deleted', async (payload) => {
    try {
      if (payload && payload.eventId) {
        await vendorService.deleteEventAssignments(payload.eventId);
      }
    } catch (err) {
      console.error(
        '[Vendor Listener] Error handling event:deleted event:',
        err
      );
    }
  });

  eventBus.on('club:roles_provisioned', async (payload) => {
    try {
      if (!payload || !payload.clubId || !payload.roles) return;

      const clubRoleService = registry.getService('club:role_service');
      if (!clubRoleService) return;

      const {
        clubId,
        roles: { coordinatorId }
      } = payload;

      if (coordinatorId) {
        await clubRoleService.systemAddPermissionsToRole(
          clubId,
          coordinatorId,
          ['vendor:view']
        );
      }
    } catch (err) {
      console.error(
        '[Vendor Listener] Error handling club:roles_provisioned event:',
        err
      );
    }
  });
}
