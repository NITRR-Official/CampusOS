import React from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { QuickActionCard } from '@/components/dashboard/QuickActionCard';

export function ClubStatsWidget() {
  return (
    <StatCard
      stat={{
        label: 'Clubs',
        value: '0',
        icon: 'Users',
        accent: 'accent'
      }}
    />
  );
}

export function ClubMemberStatsWidget() {
  return (
    <StatCard
      stat={{
        label: 'Members',
        value: '0',
        icon: 'UserPlus',
        accent: 'primary'
      }}
    />
  );
}

export function ClubQuickActionWidget() {
  return (
    <QuickActionCard
      action={{
        label: 'Create Club',
        description: 'Start a new student club',
        href: '/clubs',
        icon: 'Users',
        accent: 'accent'
      }}
    />
  );
}

export function ClubMemberQuickActionWidget() {
  return (
    <QuickActionCard
      action={{
        label: 'Invite Member',
        description: 'Add a member to a club',
        href: '/participants',
        icon: 'UserPlus',
        accent: 'primary'
      }}
    />
  );
}
