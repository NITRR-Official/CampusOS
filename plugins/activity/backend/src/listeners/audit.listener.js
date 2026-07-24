import { activityService } from '../service/activity.service.js';

export function registerAuditListeners(eventBus) {
  // High value events determined by the user for V1 logging
  const HIGH_VALUE_EVENTS = [
    'club:created',
    'club:approved',
    'club:member:added',
    'club:member:removed',
    'club:role:assigned',
    'event:created',
    'event:published',
    'form:created',
    'campaign:created'
  ];

  HIGH_VALUE_EVENTS.forEach((eventName) => {
    eventBus.on(eventName, async (payload) => {
      // Intelligently parse the payload generic identifiers
      const rawActorId =
        payload?.actorId || payload?.userId || payload?.adminId;
      const rawEntityId =
        payload?.clubId ||
        payload?.eventId ||
        payload?.formId ||
        payload?.campaignId ||
        payload?.id ||
        payload?._id;

      let entityType = 'system';
      if (payload?.clubId || eventName.startsWith('club:')) entityType = 'club';
      else if (payload?.eventId || eventName.startsWith('event:'))
        entityType = 'event';
      else if (payload?.formId || eventName.startsWith('form:'))
        entityType = 'form';
      else if (payload?.campaignId || eventName.startsWith('campaign:'))
        entityType = 'campaign';

      // Dynamic import to avoid mongoose dependency at module load if not needed
      const mongoose = await import('mongoose');

      const actorId = mongoose.Types.ObjectId.isValid(rawActorId)
        ? rawActorId
        : null;
      const entityId = mongoose.Types.ObjectId.isValid(rawEntityId)
        ? rawEntityId
        : null;

      const logPayload = {
        actorId,
        action: eventName,
        entityId,
        entityType,
        metadata: payload
      };

      await activityService.logActivity(logPayload);
    });
  });
}

export default registerAuditListeners;
