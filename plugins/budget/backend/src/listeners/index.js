export function registerBudgetHandlers(eventBus, registry, budgetService) {
  eventBus.on('event:deleted', async (payload) => {
    if (payload && payload.eventId) {
      await budgetService.deleteEventBudget(payload.eventId);
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
        'budget:view'
      ]);
    }
  });
}
