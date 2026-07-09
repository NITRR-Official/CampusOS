import { registry } from '@/lib/plugins/registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'vendor',
    title: 'Vendors',
    url: '/vendors',
    icon: 'Users'
  });
}
