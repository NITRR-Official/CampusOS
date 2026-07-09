import { registry } from '@/lib/plugins/registry';
import {
  ClubStatsWidget,
  ClubMemberStatsWidget,
  ClubQuickActionWidget,
  ClubMemberQuickActionWidget
} from './dashboard';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'club',
    title: 'Participants',
    url: '/participants',
    icon: 'Users'
  });

  // Register Dashboard Widgets
  registry.registerWidget('dashboard-stats', 'club', ClubStatsWidget);
  registry.registerWidget('dashboard-stats', 'club', ClubMemberStatsWidget);
  registry.registerWidget('dashboard-actions', 'club', ClubQuickActionWidget);
  registry.registerWidget(
    'dashboard-actions',
    'club',
    ClubMemberQuickActionWidget
  );
}
