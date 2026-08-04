import { registry } from '@campus-os/shared/plugin-registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'calendar',
    title: 'Calendar',
    url: '/calendar',
    icon: 'Calendar'
  });
}
