import { registry } from '../../lib/plugins/registry';
import { EventStatsWidget, EventQuickActionWidget } from './dashboard';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'event',
    title: 'Events',
    url: '/events',
    icon: 'Ticket'
  });

  // Register Dashboard Widgets
  registry.registerWidget('dashboard-stats', 'event', EventStatsWidget);
  registry.registerWidget('dashboard-actions', 'event', EventQuickActionWidget);
}
