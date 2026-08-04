export function registerResourceHandlers(eventBus, registry, resourceService) {
  eventBus.on('event:deleted', async (payload) => {
    try {
      if (payload && payload.eventId) {
        await resourceService.deleteEventAllocations(payload.eventId);
      }
    } catch (err) {
      console.error(
        '[Resource Listener] Error handling event:deleted event:',
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
        roles: { coordinatorId, volunteerId }
      } = payload;

      if (coordinatorId) {
        await clubRoleService.systemAddPermissionsToRole(
          clubId,
          coordinatorId,
          ['resource:view']
        );
      }
      if (volunteerId) {
        await clubRoleService.systemAddPermissionsToRole(clubId, volunteerId, [
          'resource:view'
        ]);
      }
    } catch (err) {
      console.error(
        '[Resource Listener] Error handling club:roles_provisioned event:',
        err
      );
    }
  });
}
