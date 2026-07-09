import { registry } from '@/lib/plugins/registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'task',
    title: 'Tasks',
    url: '/tasks',
    icon: 'CheckSquare'
  });
}
