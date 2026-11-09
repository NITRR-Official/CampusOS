/**
 * Plugin Installer Service (Issue #163)
 * Handles secure extraction, validation, dependency checks,
 * frontend ESM bundling, and registration for uploaded plugin packages.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import {
  validatePluginManifest,
  PluginContractError
} from '@campus-os/shared/plugin-contract';
import {
  buildPluginFrontend,
  DEFAULT_PLUGINS_DIR
} from './plugin-bundler.service.js';

export { DEFAULT_PLUGINS_DIR };

/**
 * Validates a plugin zip archive before extraction.
 * Protects against Zip Slip, validates manifest schema, and verifies backend entrypoint.
 *
 * @param {AdmZip|string} zipOrPath - AdmZip instance or file path to zip
 * @returns {{ valid: boolean, errors: string[], warnings: string[], manifest?: object, basePath?: string, zip?: AdmZip }}
 */
export function validatePluginZip(zipOrPath) {
  const errors = [];
  const warnings = [];

  let zip;
  if (typeof zipOrPath === 'string') {
    if (!fs.existsSync(zipOrPath)) {
      return {
        valid: false,
        errors: [`Zip archive file not found: ${zipOrPath}`],
        warnings: []
      };
    }
    try {
      zip = new AdmZip(zipOrPath);
    } catch (err) {
      return {
        valid: false,
        errors: [`Failed to read zip archive: ${err.message}`],
        warnings: []
      };
    }
  } else {
    zip = zipOrPath;
  }

  const zipEntries = zip.getEntries();
  if (zipEntries.length === 0) {
    return {
      valid: false,
      errors: ['Zip archive is empty'],
      warnings: []
    };
  }

  // 1. Zip Slip / Path Traversal Protection
  for (const entry of zipEntries) {
    const entryName = entry.entryName;
    const parts = entryName.split(/[/\\]/);
    if (
      parts.includes('..') ||
      path.isAbsolute(entryName) ||
      entryName.startsWith('/') ||
      entryName.startsWith('\\') ||
      /^[a-zA-Z]:/.test(entryName)
    ) {
      errors.push(
        `Security violation (Zip Slip): entry '${entryName}' contains dangerous path traversal`
      );
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings, zip };
  }

  // 2. Locate plugin.json
  const manifestEntry = zipEntries.find(
    (e) => e.entryName === 'plugin.json' || e.entryName.endsWith('/plugin.json')
  );

  if (!manifestEntry) {
    errors.push("Invalid plugin archive: no 'plugin.json' manifest found");
    return { valid: false, errors, warnings, zip };
  }

  const basePath = manifestEntry.entryName.replace('plugin.json', '');

  let rawManifest;
  try {
    const manifestContent = zip.readAsText(manifestEntry);
    rawManifest = JSON.parse(manifestContent);
  } catch (err) {
    errors.push(
      `'plugin.json' in archive contains invalid JSON: ${err.message}`
    );
    return { valid: false, errors, warnings, zip };
  }

  let manifest;
  try {
    manifest = validatePluginManifest(rawManifest);
  } catch (err) {
    if (err instanceof PluginContractError && err.details) {
      if (Array.isArray(err.details)) {
        err.details.forEach((d) => {
          errors.push(
            `Manifest schema: [${d.path.join('.') || 'root'}]: ${d.message}`
          );
        });
      } else {
        errors.push(err.message);
      }
    } else {
      errors.push(`Manifest validation failed: ${err.message}`);
    }
    return {
      valid: false,
      errors,
      warnings,
      manifest: rawManifest,
      basePath,
      zip
    };
  }

  // 3. Verify backend entrypoint if backend !== false
  if (manifest.backend !== false) {
    const indexEntryPath = `${basePath}backend/src/index.js`;
    const pluginEntryPath = `${basePath}backend/plugin.js`;

    const backendEntry = zipEntries.find(
      (e) => e.entryName === indexEntryPath || e.entryName === pluginEntryPath
    );

    if (!backendEntry) {
      errors.push(
        "Archive missing required backend entrypoint: 'backend/src/index.js' (or 'backend/plugin.js')"
      );
    } else {
      const backendContent = zip.readAsText(backendEntry);
      const exportsInit =
        /export\s+(async\s+)?function\s+init\b/.test(backendContent) ||
        /export\s+(const|let|var)\s+init\b/.test(backendContent) ||
        /export\s*\{[^}]*\binit\b/.test(backendContent) ||
        /exports\.init\s*=/.test(backendContent) ||
        /module\.exports\s*=\s*\{[^}]*\binit\b/.test(backendContent);

      if (!exportsInit) {
        errors.push(
          `Backend entrypoint in archive ('${backendEntry.entryName}') does not export an 'init' function`
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    manifest,
    basePath,
    zip
  };
}

/**
 * Downloads a package archive from an HTTP(S) URL or GitHub shorthand.
 *
 * @param {string} packageUrl - URL or 'owner/repo' / 'owner/repo@tag'
 * @param {string} destPath - Destination file path
 * @returns {Promise<string>}
 */
export async function downloadPackageFromUrl(packageUrl, destPath) {
  let downloadUrl = packageUrl.trim();

  // If shorthand "owner/repo" or "owner/repo@tag"
  if (/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+(@.+)?$/.test(downloadUrl)) {
    const [repoPart, tag] = downloadUrl.split('@');
    if (tag) {
      downloadUrl = `https://github.com/${repoPart}/archive/refs/tags/${tag}.zip`;
    } else {
      downloadUrl = `https://github.com/${repoPart}/archive/refs/heads/main.zip`;
    }
  } else if (
    downloadUrl.startsWith('https://github.com/') &&
    !downloadUrl.endsWith('.zip') &&
    !downloadUrl.includes('/archive/')
  ) {
    const clean = downloadUrl.replace(/\.git$/, '').replace(/\/$/, '');
    downloadUrl = `${clean}/archive/refs/heads/main.zip`;
  }

  const response = await fetch(downloadUrl, {
    headers: {
      'User-Agent': 'CampusOS-Plugin-Installer/1.0'
    },
    redirect: 'follow'
  });

  if (!response.ok) {
    throw new Error(
      `Failed to download plugin archive from '${downloadUrl}': HTTP ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  return destPath;
}

/**
 * Installs a plugin package from an uploaded zip file or remote URL.
 *
 * @param {object} options
 * @param {{ path?: string, originalname?: string }} [options.file] - Multer uploaded file
 * @param {string} [options.packageUrl] - URL or GitHub release to download
 * @param {boolean} [options.force=false] - Overwrite existing plugin directory if present
 * @param {string} [options.pluginsDir] - Root plugins directory (defaults to DEFAULT_PLUGINS_DIR)
 * @param {object} [options.dbModel] - Mongoose Plugin model
 * @param {object} [options.eventBus] - EventBus instance
 * @param {boolean} [options.buildFrontend=true] - Whether to compile frontend if missing pre-built bundle
 * @returns {Promise<{ success: boolean, statusCode?: number, message?: string, plugin?: object, error?: string, details?: any }>}
 */
export async function installPluginPackage({
  file,
  packageUrl,
  force = false,
  pluginsDir = DEFAULT_PLUGINS_DIR,
  dbModel,
  eventBus,
  buildFrontend = true
}) {
  let tempZipPath = null;
  let shouldDeleteTemp = false;

  try {
    if (file?.path) {
      tempZipPath = file.path;
      shouldDeleteTemp = true;
    } else if (packageUrl) {
      tempZipPath = path.join(
        os.tmpdir(),
        `campusos-plugin-download-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`
      );
      shouldDeleteTemp = true;
      try {
        await downloadPackageFromUrl(packageUrl, tempZipPath);
      } catch (dlErr) {
        return {
          success: false,
          statusCode: 400,
          error: dlErr.message
        };
      }
    } else {
      return {
        success: false,
        statusCode: 400,
        error: 'Either a plugin .zip file or packageUrl must be provided'
      };
    }

    // 1. Validate Archive
    const validation = validatePluginZip(tempZipPath);
    if (!validation.valid) {
      return {
        success: false,
        statusCode: 400,
        error: `Plugin validation failed: ${validation.errors.join('; ')}`,
        details: validation.errors
      };
    }

    const manifest = validation.manifest;
    const pluginName = manifest.name;
    const basePath = validation.basePath || '';
    const zip = validation.zip;

    // 2. Resolve target directory & Collision Check
    const targetDir = path.resolve(pluginsDir, pluginName);

    if (!targetDir.startsWith(path.resolve(pluginsDir))) {
      return {
        success: false,
        statusCode: 400,
        error: `Invalid plugin name '${pluginName}': path escapes plugins directory`
      };
    }

    if (fs.existsSync(targetDir)) {
      if (!force) {
        return {
          success: false,
          statusCode: 409,
          error: `Plugin '${pluginName}' is already installed. Use force: true to overwrite.`
        };
      }
      fs.rmSync(targetDir, { recursive: true, force: true });
    }

    // 3. Safe Extraction
    fs.mkdirSync(targetDir, { recursive: true });

    const zipEntries = zip.getEntries();
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith(basePath) && !entry.isDirectory) {
        const relPath = entry.entryName.substring(basePath.length);
        if (!relPath) continue;

        const destPath = path.resolve(targetDir, relPath);
        if (!destPath.startsWith(path.resolve(targetDir))) {
          fs.rmSync(targetDir, { recursive: true, force: true });
          return {
            success: false,
            statusCode: 400,
            error: `Security violation (Zip Slip): entry '${entry.entryName}' escapes target directory`
          };
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, entry.getData());
      }
    }

    // 4. Automatic Frontend ESM Bundling (Issue #160 / ADR-014)
    const frontendDir = path.join(targetDir, 'frontend');
    const hasFrontend = fs.existsSync(frontendDir);
    const bundleExists =
      fs.existsSync(path.join(targetDir, 'dist', 'bundle.esm.js')) ||
      fs.existsSync(path.join(targetDir, 'dist', 'bundle.js')) ||
      fs.existsSync(path.join(frontendDir, 'dist', 'bundle.esm.js')) ||
      fs.existsSync(path.join(frontendDir, 'dist', 'bundle.js'));

    if (hasFrontend && !bundleExists && buildFrontend) {
      try {
        await buildPluginFrontend(pluginName, {
          pluginsDir,
          minify: process.env.NODE_ENV === 'production'
        });
      } catch (buildErr) {
        console.warn(
          `[PluginInstaller] Notice: automatic frontend compilation for '${pluginName}':`,
          buildErr.message
        );
      }
    }

    // 5. Database Persistence
    if (dbModel) {
      try {
        await dbModel.findOneAndUpdate(
          { name: pluginName },
          {
            name: pluginName,
            version: manifest.version || '1.0.0',
            enabled: manifest.defaultEnabled !== false,
            tier: manifest.tier || 'community',
            trusted: false,
            requestedCapabilities: manifest.capabilities || [],
            grantedCapabilities: []
          },
          { upsert: true, returnDocument: 'after' }
        );
      } catch (dbErr) {
        console.warn(
          `[PluginInstaller] Database record sync notice for '${pluginName}':`,
          dbErr.message
        );
      }
    }

    // 6. Domain Event Dispatch
    if (eventBus) {
      try {
        const eventPayload = {
          pluginName,
          version: manifest.version,
          manifest,
          timestamp: new Date().toISOString()
        };

        if (typeof eventBus.emitAsync === 'function') {
          await eventBus.emitAsync('plugin:installed', eventPayload);
        } else if (typeof eventBus.emit === 'function') {
          eventBus.emit('plugin:installed', eventPayload);
        }
      } catch (evtErr) {
        console.warn(
          `[PluginInstaller] Event dispatch notice for '${pluginName}':`,
          evtErr.message
        );
      }
    }

    return {
      success: true,
      statusCode: 201,
      message: `Plugin '${pluginName}' installed successfully`,
      plugin: manifest
    };
  } finally {
    if (shouldDeleteTemp && tempZipPath && fs.existsSync(tempZipPath)) {
      try {
        fs.unlinkSync(tempZipPath);
      } catch (cleanupErr) {
        console.warn(
          `[PluginInstaller] Failed to cleanup temp file '${tempZipPath}':`,
          cleanupErr.message
        );
      }
    }
  }
}
