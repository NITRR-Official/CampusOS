export function registerBudgetHandlers(eventBus, registry, budgetService) {
  eventBus.on('club:deleted', async (payload) => {
    try {
      if (payload && payload.clubId && registry) {
        const eventService = registry?.getService
          ? registry.getService('event:service')
          : null;
        if (eventService) {
          const events = await eventService.listEvents(payload.clubId);
          if (Array.isArray(events)) {
            for (const ev of events) {
              await budgetService.deleteEventBudget(ev._id || ev.id);
            }
          }
        }
      }
    } catch (err) {
      console.error(
        '[Budget Listener] Error handling club:deleted event:',
        err
      );
    }
  });

  eventBus.on('event:deleted', async (payload) => {
    try {
      if (payload && payload.eventId) {
        await budgetService.deleteEventBudget(payload.eventId);
      }
    } catch (err) {
      console.error(
        '[Budget Listener] Error handling event:deleted event:',
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
          ['budget:view']
        );
      }
    } catch (err) {
      console.error(
        '[Budget Listener] Error handling club:roles_provisioned event:',
        err
      );
    }
  });
}
