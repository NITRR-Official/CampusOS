import { registry } from '@/lib/plugins/registry';
import { EventStatsWidget, EventQuickActionWidget } from './dashboard';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'Events',
    url: '/events',
    icon: 'Ticket'
  });
  
  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'Participants',
    url: '/participants',
    icon: 'Users'
  });

  // Register Dashboard Widgets
  registry.registerWidget('dashboard-stats', 'event', EventStatsWidget);
  registry.registerWidget('dashboard-actions', 'event', EventQuickActionWidget);
}
