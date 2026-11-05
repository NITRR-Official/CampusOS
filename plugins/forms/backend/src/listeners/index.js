export function registerFormHandlers(eventBus, services) {
  const { formService, formResponseService } = services;

  eventBus.on('club:deleted', async (payload) => {
    try {
      if (payload && payload.clubId) {
        const forms = await formService.getFormsByEntity(
          'club',
          payload.clubId
        );
        const formIds = forms.map((f) => f._id || f.id);
        if (formIds.length > 0) {
          await formResponseService.deleteResponsesByFormIds(formIds);
          await formService.deleteFormsByEntity('club', payload.clubId);
        }
      }
    } catch (err) {
      console.error('[Forms Listener] Error handling club:deleted event:', err);
    }
  });

  eventBus.on('user:deleted', async (payload) => {
    try {
      if (payload && payload.userId) {
        await formResponseService.deleteResponsesByUserId(payload.userId);
      }
    } catch (err) {
      console.error('[Forms Listener] Error handling user:deleted event:', err);
    }
  });
}
