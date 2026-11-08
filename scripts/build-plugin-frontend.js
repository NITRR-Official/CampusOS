#!/usr/bin/env node
/**
 * Standalone Plugin Frontend ESM Bundler CLI (ADR-014 / Issue #118)
 * CLI entrypoint that delegates to backend/src/services/plugin-bundler.service.js
 */

import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildPluginFrontend,
  hostVirtualModulesPlugin,
  findFrontendEntrypoint,
  DEFAULT_PLUGINS_DIR
} from '../backend/src/services/plugin-bundler.service.js';

export {
  buildPluginFrontend,
  hostVirtualModulesPlugin,
  findFrontendEntrypoint,
  DEFAULT_PLUGINS_DIR as PLUGINS_DIR
};

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const pluginName = process.argv[2];
  const isMinify = process.argv.includes('--minify');

  if (!pluginName || pluginName.startsWith('--')) {
    console.error(
      'Usage: node scripts/build-plugin-frontend.js <plugin-name> [--minify]'
    );
    process.exit(1);
  }

  console.log(
    `\n📦 Building standalone frontend ESM bundle for: ${pluginName}...`
  );
  buildPluginFrontend(pluginName, { minify: isMinify })
    .then(({ outfile, sizeBytes }) => {
      const kb = (sizeBytes / 1024).toFixed(2);
      console.log(`✓ Bundle built successfully: ${outfile} (${kb} KB)\n`);
    })
    .catch((err) => {
      console.error(`✗ Frontend build failed:`, err.message);
      process.exit(1);
    });
}

export default buildPluginFrontend;
