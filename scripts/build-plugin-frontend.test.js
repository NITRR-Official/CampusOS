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

  it('shims @campusos/design-system and @campus-os/shared to host runtime without bundling dependencies (Issue #131)', async () => {
    const pluginDir = path.join(tempDir, 'ui-plugin');
    const frontendDir = path.join(pluginDir, 'frontend');
    fs.mkdirSync(frontendDir, { recursive: true });

    fs.writeFileSync(
      path.join(frontendDir, 'index.tsx'),
      `
      import React from 'react';
      import { Button, Card } from '@campusos/design-system';
      import { registry, ExtensionPoint } from '@campus-os/shared';

      export default function Widget() {
        return (
          <Card>
            <Button>Click me</Button>
          </Card>
        );
      }
      `
    );

    const result = await buildPluginFrontend('ui-plugin', {
      pluginsDir: tempDir
    });

    expect(fs.existsSync(result.outfile)).toBe(true);
    const bundleContent = fs.readFileSync(result.outfile, 'utf8');

    // Should NOT have bare specifier imports for design-system or shared
    expect(bundleContent).not.toMatch(
      /from\s+['"]@campusos\/design-system['"]/
    );
    expect(bundleContent).not.toMatch(/from\s+['"]@campus-os\/shared['"]/);

    // Should resolve to host runtime shims
    expect(bundleContent).toContain('window.CampusOS');
    expect(bundleContent).toContain('window.__CampusOS_Runtime__');
    expect(bundleContent).toContain('window.__CampusOS_DesignSystem__');

    // Bundle should remain lightweight (typically < 15KB)
    expect(result.sizeBytes).toBeLessThan(15000);
  });

  it('shims lucide-react and apiClient to host runtime environment (Issue #160)', async () => {
    const pluginDir = path.join(tempDir, 'icons-plugin');
    const frontendDir = path.join(pluginDir, 'frontend');
    fs.mkdirSync(frontendDir, { recursive: true });

    fs.writeFileSync(
      path.join(frontendDir, 'index.tsx'),
      `
      import React from 'react';
      import { Calendar, Users, Plus } from 'lucide-react';
      import { apiClient } from '@campus-os/shared';

      export default function EventsWidget() {
        if (apiClient) {
          console.log('Using apiClient');
        }
        return (
          <div>
            <Calendar />
            <Users />
            <Plus />
          </div>
        );
      }
      `
    );

    const result = await buildPluginFrontend('icons-plugin', {
      pluginsDir: tempDir
    });

    expect(fs.existsSync(result.outfile)).toBe(true);
    const bundleContent = fs.readFileSync(result.outfile, 'utf8');

    // Should NOT have bare specifier imports for lucide-react or shared
    expect(bundleContent).not.toMatch(/from\s+['"]lucide-react['"]/);
    expect(bundleContent).not.toMatch(/from\s+['"]@campus-os\/shared['"]/);

    // Should resolve to host runtime icons and apiClient
    expect(bundleContent).toContain('window.__CampusOS_Icons__');
    expect(bundleContent).toContain('apiClient');

    // Bundle should remain lightweight (< 15KB) because lucide-react was not packed
    expect(result.sizeBytes).toBeLessThan(15000);
  });

  it('dynamically discovers and shims arbitrary Lucide icons and UI primitives without hardcoding (Issue #162)', async () => {
    const pluginDir = path.join(tempDir, 'dynamic-arbitrary-plugin');
    const frontendDir = path.join(pluginDir, 'frontend');
    fs.mkdirSync(frontendDir, { recursive: true });

    fs.writeFileSync(
      path.join(frontendDir, 'index.tsx'),
      `
      import React from 'react';
      import { Flame, Zap, Trophy, TrendingUp } from 'lucide-react';
      import { CardSkeleton, AvatarGroup } from '@campusos/design-system';

      export default function ArbitraryComponent() {
        return (
          <div>
            <Flame />
            <Zap />
            <Trophy />
            <TrendingUp />
            <CardSkeleton />
            <AvatarGroup />
          </div>
        );
      }
      `
    );

    const result = await buildPluginFrontend('dynamic-arbitrary-plugin', {
      pluginsDir: tempDir
    });

    expect(fs.existsSync(result.outfile)).toBe(true);
    const bundleContent = fs.readFileSync(result.outfile, 'utf8');

    // Should NOT have bare specifiers
    expect(bundleContent).not.toMatch(/from\s+['"]lucide-react['"]/);
    expect(bundleContent).not.toMatch(
      /from\s+['"]@campusos\/design-system['"]/
    );

    // Should contain references to the dynamic icons and UI primitives
    expect(bundleContent).toContain('Flame');
    expect(bundleContent).toContain('Zap');
    expect(bundleContent).toContain('Trophy');
    expect(bundleContent).toContain('TrendingUp');
    expect(result.sizeBytes).toBeLessThan(15000);
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
