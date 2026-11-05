export function registerTaskHandlers(eventBus, registry, taskService) {
  eventBus.on('club:deleted', async (payload) => {
    try {
      if (payload && payload.clubId && taskService) {
        await taskService.deleteTasksByClub(payload.clubId);
      }
    } catch (err) {
      console.error('[Task Listener] Error handling club:deleted event:', err);
    }
  });

  eventBus.on('user:deleted', async (payload) => {
    try {
      if (payload && payload.userId && taskService) {
        await taskService.unassignTasksByUser(payload.userId);
      }
    } catch (err) {
      console.error('[Task Listener] Error handling user:deleted event:', err);
    }
  });

  eventBus.on('club:roles_provisioned', async (payload) => {
    if (!payload || !payload.clubId || !payload.roles) return;

    const clubRoleService = registry?.getService
      ? registry.getService('club:role_service')
      : null;
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
