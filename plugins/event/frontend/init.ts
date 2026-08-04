import { registry } from '@campus-os/shared/plugin-registry';
import { EventStatsWidget, EventActivityWidget } from './dashboard';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'Events',
    url: '/events',
    icon: 'Calendar',
    context: 'global'
  });

  // Workspace Context
  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'Events',
    url: '/events',
    icon: 'Ticket'
  });

  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'My Events',
    url: '/my-events',
    icon: 'Users',
    context: 'global'
  });

  // Register Dashboard Widgets
  registry.registerWidget('dashboard-stats', 'event', EventStatsWidget);
}
