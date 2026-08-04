export function registerEventHandlers(eventBus, registry, eventService) {
  eventBus.on('club:deleted', async (payload) => {
    try {
      if (payload && payload.clubId) {
        await eventService.deleteEventsByClub(payload.clubId);
      }
    } catch (err) {
      console.error('[Event Listener] Error handling club:deleted event:', err);
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
          ['event:create', 'event:manage', 'event:view']
        );
      }

      if (volunteerId) {
        await clubRoleService.systemAddPermissionsToRole(clubId, volunteerId, [
          'event:view'
        ]);
      }
    } catch (err) {
      console.error(
        '[Event Listener] Error handling club:roles_provisioned event:',
        err
      );
    }
  });
}
