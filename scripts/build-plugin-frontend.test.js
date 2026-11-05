import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { buildPluginFrontend } from './build-plugin-frontend.js';

describe('Standalone Plugin Frontend Bundler (Issue #118)', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'campusos-frontend-build-test-')
    );
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // best effort cleanup
    }
  });

  it('compiles TypeScript/JSX entrypoint into a standalone ESM bundle', async () => {
    const pluginDir = path.join(tempDir, 'sample-plugin');
    const frontendDir = path.join(pluginDir, 'frontend');
    fs.mkdirSync(frontendDir, { recursive: true });

    fs.writeFileSync(
      path.join(frontendDir, 'App.tsx'),
      `
      import React from 'react';
      export default function App() {
        return <div className="test">Hello World</div>;
      }
      export function initFrontend() {
        console.log("Initialized");
      }
      `
    );

    const result = await buildPluginFrontend('sample-plugin', {
      pluginsDir: tempDir,
      sourcemap: true
    });

    expect(fs.existsSync(result.outfile)).toBe(true);
    expect(result.sizeBytes).toBeGreaterThan(0);

    const bundleContent = fs.readFileSync(result.outfile, 'utf8');
    expect(bundleContent).toContain('window.React');
    expect(bundleContent).toContain('initFrontend');
    expect(bundleContent).toContain('export {');
  });

  it('throws an error if plugin directory does not exist', async () => {
    await expect(
      buildPluginFrontend('non-existent', { pluginsDir: tempDir })
    ).rejects.toThrow(/Plugin directory not found/);
  });

  it('throws an error if no frontend entrypoint is present', async () => {
    const pluginDir = path.join(tempDir, 'empty-plugin');
    fs.mkdirSync(path.join(pluginDir, 'frontend'), { recursive: true });

    await expect(
      buildPluginFrontend('empty-plugin', { pluginsDir: tempDir })
    ).rejects.toThrow(/No frontend entrypoint found/);
  });
});
