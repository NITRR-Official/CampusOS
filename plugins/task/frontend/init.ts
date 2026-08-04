import { registry } from '@campus-os/shared/plugin-registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'task',
    title: 'Tasks',
    url: '/tasks',
    icon: 'CheckSquare'
  });
}
