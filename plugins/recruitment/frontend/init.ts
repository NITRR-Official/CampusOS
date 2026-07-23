import { registry } from '@campus-os/shared/plugin-registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'recruitment',
    title: 'Recruitment',
    url: '/recruitment',
    icon: 'Users',
    context: 'workspace'
  });
}
