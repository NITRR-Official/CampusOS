import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { loadPlugins } from './plugin-loader.js';
import {
  PluginContractError,
  InvalidTierClaimError,
  AccessDeniedError
} from '@campus-os/shared/plugin-contract';

describe('Plugin Loader Fail-Fast Contract & Bootloader (Issue #113)', () => {
  let tempPluginsDir;
  let mockApp;
  let mockRegistry;

  beforeEach(() => {
    tempPluginsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'campusos-plugins-test-')
    );
    mockApp = {};
    mockRegistry = {
      registerPluginMetadata: vi.fn(),
      getService: vi.fn()
    };
  });

  afterEach(() => {
    try {
      fs.rmSync(tempPluginsDir, { recursive: true, force: true });
    } catch {
      // Cleanup best effort
    }
  });

  it('fails fast when a plugin is missing its backend entrypoint', async () => {
    const pluginDir = path.join(tempPluginsDir, 'broken-plugin');
    fs.mkdirSync(pluginDir, { recursive: true });

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'broken-plugin',
        version: '1.0.0',
        description: 'Missing backend entrypoint'
      })
    );

    await expect(
      loadPlugins(mockApp, mockRegistry, {
        pluginsDir: tempPluginsDir,
        failFast: true
      })
    ).rejects.toThrow(PluginContractError);
  });

  it('fails fast when folder name does not match manifest.name', async () => {
    const pluginDir = path.join(tempPluginsDir, 'folder-name-mismatch');
    fs.mkdirSync(pluginDir, { recursive: true });

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'actual-manifest-name',
        version: '1.0.0',
        description: 'Name mismatch'
      })
    );

    await expect(
      loadPlugins(mockApp, mockRegistry, {
        pluginsDir: tempPluginsDir,
        failFast: true
      })
    ).rejects.toThrow(PluginContractError);
  });

  it('fails fast when plugin module does not export an init function', async () => {
    const pluginDir = path.join(tempPluginsDir, 'non-func-plugin');
    const backendSrc = path.join(pluginDir, 'backend', 'src');
    fs.mkdirSync(backendSrc, { recursive: true });

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'non-func-plugin',
        version: '1.0.0',
        description: 'Exports string instead of function'
      })
    );

    fs.writeFileSync(
      path.join(backendSrc, 'index.js'),
      'export default "not-a-function";'
    );

    await expect(
      loadPlugins(mockApp, mockRegistry, {
        pluginsDir: tempPluginsDir,
        failFast: true
      })
    ).rejects.toThrow(/Module must export an 'init' function/);
  });

  it('fails fast when circular dependencies are detected', async () => {
    // Plugin A depends on B
    const dirA = path.join(tempPluginsDir, 'plugin-a');
    fs.mkdirSync(path.join(dirA, 'backend', 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dirA, 'plugin.json'),
      JSON.stringify({
        name: 'plugin-a',
        version: '1.0.0',
        description: 'Plugin A',
        dependencies: { 'plugin-b': '^1.0.0' }
      })
    );
    fs.writeFileSync(
      path.join(dirA, 'backend', 'src', 'index.js'),
      'export function init() {}'
    );

    // Plugin B depends on A
    const dirB = path.join(tempPluginsDir, 'plugin-b');
    fs.mkdirSync(path.join(dirB, 'backend', 'src'), { recursive: true });
    fs.writeFileSync(
      path.join(dirB, 'plugin.json'),
      JSON.stringify({
        name: 'plugin-b',
        version: '1.0.0',
        description: 'Plugin B',
        dependencies: { 'plugin-a': '^1.0.0' }
      })
    );
    fs.writeFileSync(
      path.join(dirB, 'backend', 'src', 'index.js'),
      'export function init() {}'
    );

    await expect(
      loadPlugins(mockApp, mockRegistry, {
        pluginsDir: tempPluginsDir,
        failFast: true
      })
    ).rejects.toThrow(/Circular dependency detected/);
  });

  it('successfully loads a compliant plugin and registers its metadata', async () => {
    const pluginDir = path.join(tempPluginsDir, 'valid-plugin');
    const backendSrc = path.join(pluginDir, 'backend', 'src');
    fs.mkdirSync(backendSrc, { recursive: true });

    const manifest = {
      name: 'valid-plugin',
      version: '1.0.0',
      description: 'A fully compliant plugin'
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest)
    );

    fs.writeFileSync(
      path.join(backendSrc, 'index.js'),
      'export function init(app, registry) { app.inited = true; }'
    );

    await loadPlugins(mockApp, mockRegistry, {
      pluginsDir: tempPluginsDir,
      failFast: true
    });

    expect(mockApp.inited).toBe(true);
    expect(mockRegistry.registerPluginMetadata).toHaveBeenCalledWith(
      'valid-plugin',
      expect.objectContaining({ name: 'valid-plugin', version: '1.0.0' })
    );
  });

  it('injects a scoped child logger to plugin init() as the 4th argument', async () => {
    const pluginDir = path.join(tempPluginsDir, 'logged-plugin');
    const backendSrc = path.join(pluginDir, 'backend', 'src');
    fs.mkdirSync(backendSrc, { recursive: true });

    const manifest = {
      name: 'logged-plugin',
      version: '1.0.0',
      description: 'A plugin that uses scoped logger'
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest)
    );

    fs.writeFileSync(
      path.join(backendSrc, 'index.js'),
      'export function init(app, registry, eventBus, logger) { app.receivedPlugin = logger?.context?.plugin; }'
    );

    await loadPlugins(mockApp, mockRegistry, {
      pluginsDir: tempPluginsDir,
      failFast: true
    });

    expect(mockApp.receivedPlugin).toBe('logged-plugin');
  });

  it('rejects unverified 3rd-party plugin claiming core tier in failFast mode', async () => {
    const pluginDir = path.join(tempPluginsDir, 'spoofed-plugin');
    const backendSrc = path.join(pluginDir, 'backend', 'src');
    fs.mkdirSync(backendSrc, { recursive: true });

    const manifest = {
      name: 'spoofed-plugin',
      version: '1.0.0',
      description: 'Attempting to spoof core tier',
      tier: 'core'
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest)
    );

    fs.writeFileSync(
      path.join(backendSrc, 'index.js'),
      'export function init() {}'
    );

    await expect(
      loadPlugins(mockApp, mockRegistry, {
        pluginsDir: tempPluginsDir,
        failFast: true
      })
    ).rejects.toThrow(InvalidTierClaimError);
  });

  it('sandboxes community plugins: denies raw db access inside community plugin init()', async () => {
    const pluginDir = path.join(tempPluginsDir, 'community-test-plugin');
    const backendSrc = path.join(pluginDir, 'backend', 'src');
    fs.mkdirSync(backendSrc, { recursive: true });

    const manifest = {
      name: 'community-test-plugin',
      version: '1.0.0',
      description: 'Community plugin trying raw DB access',
      tier: 'community'
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest)
    );

    fs.writeFileSync(
      path.join(backendSrc, 'index.js'),
      'export function init(app, registry) { registry.getService("db:mongo"); }'
    );

    await expect(
      loadPlugins(mockApp, mockRegistry, {
        pluginsDir: tempPluginsDir,
        failFast: true
      })
    ).rejects.toThrow(AccessDeniedError);
  });

  it('records effectiveTier: "community" in plugin metadata for verified community plugins', async () => {
    const pluginDir = path.join(tempPluginsDir, 'safe-community-plugin');
    const backendSrc = path.join(pluginDir, 'backend', 'src');
    fs.mkdirSync(backendSrc, { recursive: true });

    const manifest = {
      name: 'safe-community-plugin',
      version: '1.0.0',
      description: 'Safe community plugin',
      tier: 'community'
    };

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest)
    );

    fs.writeFileSync(
      path.join(backendSrc, 'index.js'),
      'export function init(app, registry) { app.ran = true; }'
    );

    await loadPlugins(mockApp, mockRegistry, {
      pluginsDir: tempPluginsDir,
      failFast: true
    });

    expect(mockApp.ran).toBe(true);
    expect(mockRegistry.registerPluginMetadata).toHaveBeenCalledWith(
      'safe-community-plugin',
      expect.objectContaining({
        name: 'safe-community-plugin',
        effectiveTier: 'community'
      })
    );
  });
});
