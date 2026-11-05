import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { registerPluginBundleRoutes } from './plugin-bundle.routes.js';

describe('Plugin Frontend Bundle Routes (ADR-014 / Issue #118)', () => {
  let app;
  let tempPluginsDir;

  beforeEach(() => {
    tempPluginsDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'campusos-bundle-test-')
    );
    app = express();
    registerPluginBundleRoutes(app, { pluginsDir: tempPluginsDir });
  });

  afterEach(() => {
    try {
      fs.rmSync(tempPluginsDir, { recursive: true, force: true });
    } catch {
      // cleanup best effort
    }
  });

  it('serves bundle.esm.js with application/javascript Content-Type and cache headers', async () => {
    const pluginDir = path.join(tempPluginsDir, 'test-plugin');
    const distDir = path.join(pluginDir, 'frontend', 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    const bundleContent =
      'export default function Component() { return "hello"; }';
    fs.writeFileSync(path.join(distDir, 'bundle.esm.js'), bundleContent);

    const res = await request(app).get('/api/v1/plugins/test-plugin/bundle.js');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/javascript/);
    expect(res.headers['cache-control']).toBeDefined();
    expect(res.text).toBe(bundleContent);
  });

  it('serves bundle.css with text/css Content-Type when present', async () => {
    const pluginDir = path.join(tempPluginsDir, 'styled-plugin');
    const distDir = path.join(pluginDir, 'frontend', 'dist');
    fs.mkdirSync(distDir, { recursive: true });

    const cssContent = '.widget { color: blue; }';
    fs.writeFileSync(path.join(distDir, 'bundle.css'), cssContent);

    const res = await request(app).get(
      '/api/v1/plugins/styled-plugin/bundle.css'
    );

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/css/);
    expect(res.text).toBe(cssContent);
  });

  it('returns 404 with JSON error when bundle.js does not exist', async () => {
    const pluginDir = path.join(tempPluginsDir, 'empty-plugin');
    fs.mkdirSync(pluginDir, { recursive: true });

    const res = await request(app).get(
      '/api/v1/plugins/empty-plugin/bundle.js'
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Frontend bundle not found/);
  });

  it('returns 404 with JSON error when plugin folder does not exist', async () => {
    const res = await request(app).get(
      '/api/v1/plugins/non-existent/bundle.js'
    );

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('serves plugin.json via /manifest endpoint', async () => {
    const pluginDir = path.join(tempPluginsDir, 'meta-plugin');
    fs.mkdirSync(pluginDir, { recursive: true });

    const manifestData = {
      name: 'meta-plugin',
      version: '1.2.0',
      description: 'Meta plugin for testing'
    };
    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifestData)
    );

    const res = await request(app).get('/api/v1/plugins/meta-plugin/manifest');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.manifest.name).toBe('meta-plugin');
    expect(res.body.manifest.version).toBe('1.2.0');
  });

  it('blocks path traversal attempts on bundle.js and returns 404', async () => {
    // Attempt directory traversal
    const res = await request(app).get(
      '/api/v1/plugins/..%2f..%2fsecrets/bundle.js'
    );
    expect(res.status).toBe(404);
  });
});
