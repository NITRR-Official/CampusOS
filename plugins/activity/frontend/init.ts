import { registry } from '@campus-os/shared/plugin-registry';
import { ActivityTimeline } from './components/ActivityTimeline';

export function initFrontend() {
  registry.registerWidget('dashboard-activity', 'activity', ActivityTimeline);
  registry.registerWidget('profile-activity', 'activity', ActivityTimeline);
}
