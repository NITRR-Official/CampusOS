'use client';

import React from 'react';
import { registry } from '@campus-os/shared/plugin-registry';
import { CheckInDesk } from './components/CheckInDesk';

export function initCheckinFrontend() {
  registry.registerWidget(
    'event-checkin-desk',
    'checkin',
    ({ context }: { context?: any }) => {
      if (!context?.eventId) return null;
      return (
        <CheckInDesk
          eventId={context.eventId}
          eventTitle={context.eventTitle || 'Event'}
          initialRegistrations={
            context.registrations || context.initialRegistrations || []
          }
        />
      );
    }
  );
}

// Auto-register when module is loaded
initCheckinFrontend();
