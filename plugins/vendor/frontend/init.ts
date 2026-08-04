import { registry } from '@campus-os/shared/plugin-registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'vendor',
    title: 'Vendors',
    url: '/vendors',
    icon: 'Users'
  });
}
