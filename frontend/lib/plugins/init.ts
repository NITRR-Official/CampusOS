/**
 * CampusOS Plugin Local / Fallback Initializer (ADR-018 / Issue #158)
 * Dynamic loader with safe fallback so that missing, uninstalled, or disabled plugins
 * do NOT break the core frontend compilation or build pipeline.
 */

import { setupPluginRuntime } from './runtime-env';

const KNOWN_CORE_PLUGINS = [
  'activity',
  'calendar',
  'club',
  'event',
  'forms',
  'recruitment',
  'task',
  'vendor'
];

export async function initializePlugins() {
  if (typeof window !== 'undefined') {
    setupPluginRuntime();
    // Prevent double initialization in React strict mode / fast refresh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__pluginsInitialized) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__pluginsInitialized = true;
  }

  // Attempt dynamic initializers with safe catch fallback so core Next.js build never crashes
  for (const name of KNOWN_CORE_PLUGINS) {
    try {
      // Dynamic import with webpackIgnore to avoid bundling remote/optional plugins at build time
      const mod = await import(
        /* webpackIgnore: true */ `@plugins/${name}/frontend/init`
      );
      if (typeof mod.initFrontend === 'function') {
        mod.initFrontend();
      }
    } catch {
      // Ignored: Plugin not present locally, or will be mounted dynamically via runtime ESM bundle
    }
  }
}

export default initializePlugins;
