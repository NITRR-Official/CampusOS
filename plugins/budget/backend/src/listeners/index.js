export function registerBudgetHandlers(eventBus, registry, budgetService) {
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
