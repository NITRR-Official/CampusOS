import { initFrontend as initEvent } from '../../plugins/event/init';
import { initFrontend as initTask } from '../../plugins/task/init';
import { initFrontend as initCalendar } from '../../plugins/calendar/init';
import { initFrontend as initVendor } from '../../plugins/vendor/init';
import { initFrontend as initClub } from '../../plugins/club/init';

/**
 * This file acts as the Build-Time plugin loader.
 * In the final version, this file will be automatically generated
 * by the CLI installer script whenever a plugin is added/removed.
 */
export function initializePlugins() {
  if (typeof window !== 'undefined') {
    // Prevent double initialization in React strict mode / fast refresh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__pluginsInitialized) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__pluginsInitialized = true;
  }

  // Initialize all known frontend plugin UI components
  initEvent();
  initTask();
  initCalendar();
  initVendor();
  initClub();
}
