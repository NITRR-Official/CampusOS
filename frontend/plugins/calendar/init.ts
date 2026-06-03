import { registry } from '../../lib/plugins/registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'calendar',
    title: 'Calendar',
    url: '/calendar',
    icon: 'Calendar'
  });
}
