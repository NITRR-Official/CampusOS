/**
 * Plugin Frontend Bundle Serving Routes
 * Serves standalone pre-built ESM bundles and assets for dynamic runtime frontend injection (ADR-014).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Router } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_PLUGINS_DIR = path.resolve(__dirname, '../../../plugins');

/**
 * Creates and mounts plugin bundle routes on the express app.
 *
 * @param {import('express').Application} app
 * @param {object} [options]
 * @param {string} [options.pluginsDir]
 * @param {object} [options.registry]
 */
export function registerPluginBundleRoutes(app, options = {}) {
  const pluginsDir = options.pluginsDir || DEFAULT_PLUGINS_DIR;
  const router = Router();

  /**
   * Safe path resolver with path-traversal protection.
   */
  function resolveSafePath(pluginName, subPath) {
    // Validate plugin name contains only safe characters
    if (!/^[a-zA-Z0-9_-]+$/.test(pluginName)) {
      return null;
    }

    const pluginRoot = path.resolve(pluginsDir, pluginName);
    const resolvedPath = path.resolve(pluginRoot, subPath);

    // Verify resolved path is strictly within the plugin directory
    if (!resolvedPath.startsWith(pluginRoot)) {
      return null;
    }

    return resolvedPath;
  }

  /**
   * GET /api/v1/plugins/:name/bundle.js
   * Serves the compiled ES module for runtime dynamic browser import.
   */
  router.get('/:name/bundle.js', (req, res) => {
    const { name } = req.params;

    const candidates = [
      'frontend/dist/bundle.esm.js',
      'frontend/dist/bundle.js',
      'dist/bundle.esm.js',
      'dist/bundle.js'
    ];

    let targetFilePath = null;
    for (const candidate of candidates) {
      const resolved = resolveSafePath(name, candidate);
      if (
        resolved &&
        fs.existsSync(resolved) &&
        fs.statSync(resolved).isFile()
      ) {
        targetFilePath = resolved;
        break;
      }
    }

    if (!targetFilePath) {
      return res.status(404).json({
        success: false,
        error: `Frontend bundle not found for plugin '${name}'`
      });
    }

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=60'
    );
    return res.sendFile(targetFilePath);
  });

  /**
   * GET /api/v1/plugins/:name/bundle.css
   * Serves optional CSS styling bundle.
   */
  router.get('/:name/bundle.css', (req, res) => {
    const { name } = req.params;

    const candidates = [
      'frontend/dist/bundle.css',
      'frontend/dist/style.css',
      'dist/bundle.css',
      'dist/style.css'
    ];

    let targetFilePath = null;
    for (const candidate of candidates) {
      const resolved = resolveSafePath(name, candidate);
      if (
        resolved &&
        fs.existsSync(resolved) &&
        fs.statSync(resolved).isFile()
      ) {
        targetFilePath = resolved;
        break;
      }
    }

    if (!targetFilePath) {
      return res.status(404).json({
        success: false,
        error: `Frontend stylesheet not found for plugin '${name}'`
      });
    }

    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.setHeader(
      'Cache-Control',
      'public, max-age=300, stale-while-revalidate=60'
    );
    return res.sendFile(targetFilePath);
  });

  /**
   * GET /api/v1/plugins/:name/manifest
   * Exposes public metadata for frontend discovery.
   */
  router.get('/:name/manifest', (req, res) => {
    const { name } = req.params;
    const manifestPath = resolveSafePath(name, 'plugin.json');

    if (!manifestPath || !fs.existsSync(manifestPath)) {
      return res.status(404).json({
        success: false,
        error: `Manifest not found for plugin '${name}'`
      });
    }

    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const manifest = JSON.parse(content);
      return res.status(200).json({ success: true, manifest });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: `Malformed manifest in plugin '${name}': ${err.message}`
      });
    }
  });

  // Mount at /api/v1/plugins
  app.use('/api/v1/plugins', router);

  // If registry provided, register public route pattern
  if (
    options.registry &&
    typeof options.registry.registerPublicRoute === 'function'
  ) {
    options.registry.registerPublicRoute(
      /^\/api\/v1\/plugins\/[^/]+\/(bundle\.(js|css)|manifest)$/
    );
  }
}

export default registerPluginBundleRoutes;
