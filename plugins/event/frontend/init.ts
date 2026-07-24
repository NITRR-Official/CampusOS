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

  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'Participants',
    url: '/participants',
    icon: 'Users'
  });

  // Register Dashboard Widgets
  registry.registerWidget('dashboard-stats', 'event', EventStatsWidget);
}
