import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';

export function EventStatsWidget() {
  return (
    <StatCard
      stat={{
        label: 'Events',
        value: '0',
        icon: 'Calendar',
        accent: 'secondary'
      }}
    />
  );
}

export function EventQuickActionWidget() {
  return (
    <QuickActionCard
      action={{
        label: 'Schedule Event',
        description: 'Plan an upcoming event',
        href: '/events',
        icon: 'CalendarPlus',
        accent: 'secondary'
      }}
    />
  );
}
