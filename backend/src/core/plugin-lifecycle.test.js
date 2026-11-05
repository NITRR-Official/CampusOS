import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  loadPlugins,
  unloadPlugin,
  isPluginActive,
  resetActivePlugins
} from '../plugin-loader.js';
import {
  validatePluginModule,
  PluginContractError
} from '@campus-os/shared/plugin-contract';
import { eventBus } from './event-bus.js';
import registry from '../utils/registry.js';
import { createScopedRegistry } from './sandbox-registry.js';

describe('Plugin Lifecycle Teardown & Resource Cleanup (Issue #124)', () => {
  let tempPluginsDir;
  let mockApp;

  beforeEach(() => {
    tempPluginsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'campusos-lifecycle-test-')
    );
    mockApp = {};
    resetActivePlugins();
    registry.reset();
  });

  afterEach(() => {
    resetActivePlugins();
    registry.reset();
    try {
      fs.rmSync(tempPluginsDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  });

  describe('validatePluginModule contract enforcement', () => {
    it('passes for module with function init', () => {
      const module = {
        init: () => {}
      };
      const result = validatePluginModule(module, 'test-plugin');
      expect(typeof result.init).toBe('function');
      expect(result.destroy).toBeUndefined();
    });

    it('passes for module with init and destroy hooks', () => {
      const destroyHook = vi.fn();
      const module = {
        init: () => {},
        destroy: destroyHook
      };
      const result = validatePluginModule(module, 'test-plugin');
      expect(typeof result.init).toBe('function');
      expect(result.destroy).toBe(destroyHook);
    });

    it('passes for module using teardown alias', () => {
      const teardownHook = vi.fn();
      const module = {
        init: () => {},
        teardown: teardownHook
      };
      const result = validatePluginModule(module, 'test-plugin');
      expect(result.destroy).toBe(teardownHook);
    });

    it('throws PluginContractError when init is missing', () => {
      expect(() => validatePluginModule({}, 'bad-plugin')).toThrow(
        PluginContractError
      );
      expect(() =>
        validatePluginModule({ init: 'string' }, 'bad-plugin')
      ).toThrow(PluginContractError);
    });

    it('throws PluginContractError when destroy is defined but not a function', () => {
      expect(() =>
        validatePluginModule({ init: () => {}, destroy: 123 }, 'bad-plugin')
      ).toThrow(PluginContractError);
    });
  });

  describe('ScopedRegistry timer tracking & auto-clearance', () => {
    it('tracks and automatically clears active intervals and timeouts', () => {
      const manifest = { name: 'timer-test', capabilities: ['*'] };
      const scopedReg = createScopedRegistry(manifest, registry, {
        isCore: true
      });

      const spyInterval = vi.fn();
      const spyTimeout = vi.fn();

      scopedReg.timers.setInterval(spyInterval, 100);
      const timer2 = scopedReg.timers.setTimeout(spyTimeout, 100);

      expect(scopedReg.timers.count).toBe(2);

      scopedReg.timers.clearTimeout(timer2);
      expect(scopedReg.timers.count).toBe(1);

      scopedReg.cleanup();
      expect(scopedReg.timers.count).toBe(0);
    });
  });

  describe('unloadPlugin runtime teardown', () => {
    it('returns gracefully if plugin is not loaded or already unloaded', async () => {
      const result = await unloadPlugin('non-existent-plugin');
      expect(result.success).toBe(true);
    });

    it('invokes destroy() hook and emits plugin:unloaded event on unload', async () => {
      const pluginDir = path.join(tempPluginsDir, 'lifecycle-sample');
      const backendSrc = path.join(pluginDir, 'backend', 'src');
      fs.mkdirSync(backendSrc, { recursive: true });

      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'lifecycle-sample',
          version: '1.0.0',
          description: 'Plugin with destroy hook'
        })
      );

      // Create plugin that sets up service, listener, and destroy hook
      fs.writeFileSync(
        path.join(backendSrc, 'index.js'),
        `
        let activeInterval;
        export async function init(app, registry, eventBus) {
          registry.registerService('lifecycle-sample:service', { data: 42 });
          eventBus.on('lifecycle-sample:ping', () => {});
        }
        export async function destroy(app, registry, eventBus) {
          globalThis.__LIFECYCLE_DESTROY_CALLED = true;
        }
      `
      );

      globalThis.__LIFECYCLE_DESTROY_CALLED = false;

      const unloadedListener = vi.fn();
      eventBus.on('plugin:unloaded', unloadedListener);

      await loadPlugins(mockApp, registry, {
        pluginsDir: tempPluginsDir,
        skipDb: true
      });

      expect(isPluginActive('lifecycle-sample')).toBe(true);
      expect(
        registry.getService('lifecycle-sample:service', false)
      ).toBeDefined();

      const unloadResult = await unloadPlugin('lifecycle-sample');
      expect(unloadResult.success).toBe(true);
      expect(globalThis.__LIFECYCLE_DESTROY_CALLED).toBe(true);
      expect(isPluginActive('lifecycle-sample')).toBe(false);

      // Service should be pruned from registry
      expect(
        registry.getService('lifecycle-sample:service', false)
      ).toBeUndefined();

      // Event should be emitted
      expect(unloadedListener).toHaveBeenCalledWith(
        expect.objectContaining({
          pluginName: 'lifecycle-sample'
        })
      );

      eventBus.off('plugin:unloaded', unloadedListener);
    });

    it('handles timeout when destroy() hangs without hanging system', async () => {
      const pluginDir = path.join(tempPluginsDir, 'hanging-plugin');
      const backendSrc = path.join(pluginDir, 'backend', 'src');
      fs.mkdirSync(backendSrc, { recursive: true });

      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'hanging-plugin',
          version: '1.0.0',
          description: 'Plugin with hanging destroy'
        })
      );

      fs.writeFileSync(
        path.join(backendSrc, 'index.js'),
        `
        export async function init() {}
        export async function destroy() {
          // Never resolves
          return new Promise(() => {});
        }
      `
      );

      await loadPlugins(mockApp, registry, {
        pluginsDir: tempPluginsDir,
        skipDb: true
      });

      expect(isPluginActive('hanging-plugin')).toBe(true);

      const startTime = Date.now();
      // Use 150ms timeout for test speed
      const res = await unloadPlugin('hanging-plugin', { timeout: 150 });
      const elapsed = Date.now() - startTime;

      expect(res.success).toBe(true);
      expect(elapsed).toBeLessThan(1000);
      expect(isPluginActive('hanging-plugin')).toBe(false);
    });

    it('unregisters all event listeners registered through scoped bus upon unload', async () => {
      const pluginDir = path.join(tempPluginsDir, 'event-test-plugin');
      const backendSrc = path.join(pluginDir, 'backend', 'src');
      fs.mkdirSync(backendSrc, { recursive: true });

      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'event-test-plugin',
          version: '1.0.0',
          description: 'Subscribes to events',
          consumes: {
            events: ['core:tick']
          }
        })
      );

      fs.writeFileSync(
        path.join(backendSrc, 'index.js'),
        `
        export async function init(app, registry, eventBus) {
          eventBus.on('core:tick', () => {});
        }
      `
      );

      await loadPlugins(mockApp, registry, {
        pluginsDir: tempPluginsDir,
        skipDb: true
      });

      expect(eventBus.listenerCount('core:tick')).toBeGreaterThanOrEqual(1);
      const countBefore = eventBus.listenerCount('core:tick');

      await unloadPlugin('event-test-plugin');

      // The listener must be cleaned up
      expect(eventBus.listenerCount('core:tick')).toBe(countBefore - 1);
    });

    it('blocks unload when another active plugin depends on it unless force is true', async () => {
      const baseDir = path.join(tempPluginsDir, 'base-plugin');
      const baseBackend = path.join(baseDir, 'backend', 'src');
      fs.mkdirSync(baseBackend, { recursive: true });

      fs.writeFileSync(
        path.join(baseDir, 'plugin.json'),
        JSON.stringify({
          name: 'base-plugin',
          version: '1.0.0',
          description: 'Base'
        })
      );
      fs.writeFileSync(
        path.join(baseBackend, 'index.js'),
        'export async function init() {}'
      );

      const dependentDir = path.join(tempPluginsDir, 'consumer-plugin');
      const depBackend = path.join(dependentDir, 'backend', 'src');
      fs.mkdirSync(depBackend, { recursive: true });

      fs.writeFileSync(
        path.join(dependentDir, 'plugin.json'),
        JSON.stringify({
          name: 'consumer-plugin',
          version: '1.0.0',
          description: 'Consumer',
          dependencies: {
            'base-plugin': '^1.0.0'
          }
        })
      );
      fs.writeFileSync(
        path.join(depBackend, 'index.js'),
        'export async function init() {}'
      );

      await loadPlugins(mockApp, registry, {
        pluginsDir: tempPluginsDir,
        skipDb: true
      });

      expect(isPluginActive('base-plugin')).toBe(true);
      expect(isPluginActive('consumer-plugin')).toBe(true);

      // Attempting to unload base-plugin should fail because consumer-plugin depends on it
      await expect(unloadPlugin('base-plugin')).rejects.toThrow(
        PluginContractError
      );
      expect(isPluginActive('base-plugin')).toBe(true);

      // With force: true, unload succeeds
      const forcedResult = await unloadPlugin('base-plugin', { force: true });
      expect(forcedResult.success).toBe(true);
      expect(isPluginActive('base-plugin')).toBe(false);
    });
  });
});
