import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  validatePluginManifest,
  PluginContractError
} from '../shared/src/plugin-contract.js';
import { buildPluginFrontend } from './build-plugin-frontend.js';
import {
  validatePluginZip,
  installPluginPackage
} from '../backend/src/services/plugin-installer.service.js';

export { validatePluginZip, installPluginPackage };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PLUGINS_DIR = path.join(__dirname, '../plugins');
export const REGISTRY_FILE = path.join(
  __dirname,
  '../frontend/lib/plugins/init.ts'
);
export const FRONTEND_APP_DIR = path.join(
  __dirname,
  '../frontend/app/(dashboard)'
);

export const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Scans a plugin directory for forbidden cross-plugin relative imports or path escapes.
 * @param {string} pluginDir - Root directory of the plugin
 * @returns {Array<{ file: string, specifier: string, reason: string }>}
 */
export function checkCrossPluginImports(pluginDir) {
  const violations = [];
  const validExtensions = new Set([
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.mjs',
    '.cjs'
  ]);
  const resolvedPluginDir = path.resolve(pluginDir);

  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (
        [
          'node_modules',
          '.git',
          '.next',
          'dist',
          'coverage',
          '.turbo'
        ].includes(entry.name)
      ) {
        continue;
      }
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (
        entry.isFile() &&
        validExtensions.has(path.extname(entry.name))
      ) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const importRegex =
          /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"]([^'"]+)['"]/g;
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;

        const checkSpecifier = (specifier) => {
          if (specifier.startsWith('.')) {
            const resolved = path.resolve(path.dirname(fullPath), specifier);
            const relToPlugin = path.relative(resolvedPluginDir, resolved);
            if (relToPlugin.startsWith('..') || path.isAbsolute(relToPlugin)) {
              violations.push({
                file: path
                  .relative(resolvedPluginDir, fullPath)
                  .replace(/\\/g, '/'),
                specifier,
                reason: `Direct relative cross-plugin import '${specifier}' escapes plugin directory boundary to '${relToPlugin.replace(/\\/g, '/')}'`
              });
            }
          } else if (
            fullPath.includes(`${path.sep}backend${path.sep}`) &&
            (specifier.startsWith('@plugins/') ||
              specifier.startsWith('plugins/'))
          ) {
            violations.push({
              file: path
                .relative(resolvedPluginDir, fullPath)
                .replace(/\\/g, '/'),
              specifier,
              reason: `Backend code must not import from plugins ('${specifier}'). Use EventBus or ServiceRegistry instead.`
            });
          }
        };

        let match;
        while ((match = importRegex.exec(content)) !== null) {
          checkSpecifier(match[1]);
        }
        while ((match = requireRegex.exec(content)) !== null) {
          checkSpecifier(match[1]);
        }
      }
    }
  }

  scan(resolvedPluginDir);
  return violations;
}

/**
 * Validates a plugin directory against the CampusOS architecture contract.
 * @param {string} pluginDir - Absolute or relative path to the plugin directory
 * @param {object} [options]
 * @param {boolean} [options.strict=false] - Treat missing recommended layers as errors
 * @returns {{ valid: boolean, errors: string[], warnings: string[], manifest?: object }}
 */
export function validatePluginDirectory(pluginDir, options = {}) {
  const errors = [];
  const warnings = [];
  const resolvedDir = path.resolve(pluginDir);

  if (!fs.existsSync(resolvedDir)) {
    return {
      valid: false,
      errors: [`Plugin directory does not exist: ${resolvedDir}`],
      warnings: []
    };
  }

  const folderName = path.basename(resolvedDir);
  const manifestPath = path.join(resolvedDir, 'plugin.json');

  if (!fs.existsSync(manifestPath)) {
    return {
      valid: false,
      errors: [`Missing 'plugin.json' manifest in ${folderName}`],
      warnings: []
    };
  }

  let rawManifest;
  try {
    const rawContent = fs.readFileSync(manifestPath, 'utf8');
    rawManifest = JSON.parse(rawContent);
  } catch (err) {
    return {
      valid: false,
      errors: [`'plugin.json' contains invalid JSON: ${err.message}`],
      warnings: []
    };
  }

  let manifest;
  try {
    manifest = validatePluginManifest(rawManifest, folderName);
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
      manifest: rawManifest
    };
  }

  // Backend verification if plugin has backend
  if (manifest.backend !== false) {
    const backendSrcDir = path.join(resolvedDir, 'backend', 'src');
    const indexPath = path.join(backendSrcDir, 'index.js');
    const legacyPluginPath = path.join(resolvedDir, 'backend', 'plugin.js');

    const entrypointPath = fs.existsSync(indexPath)
      ? indexPath
      : fs.existsSync(legacyPluginPath)
        ? legacyPluginPath
        : null;

    if (!entrypointPath) {
      errors.push(
        "Missing backend entrypoint: 'backend/src/index.js' (or 'backend/plugin.js') is required"
      );
    } else {
      const indexContent = fs.readFileSync(entrypointPath, 'utf8');
      const exportsInit =
        /export\s+(async\s+)?function\s+init\b/.test(indexContent) ||
        /export\s+(const|let|var)\s+init\b/.test(indexContent) ||
        /export\s*\{[^}]*\binit\b/.test(indexContent) ||
        /exports\.init\s*=/.test(indexContent) ||
        /module\.exports\s*=\s*\{[^}]*\binit\b/.test(indexContent);

      if (!exportsInit) {
        errors.push(
          `Backend entrypoint '${path.relative(resolvedDir, entrypointPath).replace(/\\/g, '/')}' must export an 'init' function`
        );
      }
    }

    // Check backend architecture layers
    const requiredLayers = ['routes', 'service', 'controller'];
    for (const layer of requiredLayers) {
      const layerDir = path.join(backendSrcDir, layer);
      const layerFile = path.join(backendSrcDir, `${layer}.js`);
      if (!fs.existsSync(layerDir) && !fs.existsSync(layerFile)) {
        errors.push(
          `Missing required backend layer: 'backend/src/${layer}' directory is required`
        );
      }
    }

    // Recommended layer: repository
    const repoDir = path.join(backendSrcDir, 'repository');
    const repoFile = path.join(backendSrcDir, 'repository.js');
    if (!fs.existsSync(repoDir) && !fs.existsSync(repoFile)) {
      const msg =
        "Recommended backend layer 'backend/src/repository' is missing. Data access decoupling via repositories is recommended.";
      if (options.strict) {
        errors.push(msg);
      } else {
        warnings.push(msg);
      }
    }
  }

  // Boundary isolation check
  const boundaryViolations = checkCrossPluginImports(resolvedDir);
  for (const v of boundaryViolations) {
    errors.push(`[Boundary Violation] ${v.file}: ${v.reason}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    manifest
  };
}

/**
 * Validates a target (name in plugins/, directory path, or zip path).
 * Formats results with colors and icons.
 * @param {string} [target] - Plugin name, folder path, zip path, or undefined (validates all)
 * @param {object} [options]
 * @param {boolean} [options.strict=false]
 * @param {boolean} [options.exitOnError=true]
 * @returns {boolean}
 */
export function validatePlugin(target, options = {}) {
  const strict = Boolean(options.strict);
  const exitOnError = options.exitOnError !== false;

  console.log(
    `${colors.bold}${colors.cyan}============================================================${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.cyan} CampusOS Plugin Validator${colors.reset}`
  );
  console.log(
    `${colors.bold}${colors.cyan}============================================================${colors.reset}\n`
  );

  let targetsToValidate = [];

  if (!target || target === 'all') {
    if (!fs.existsSync(PLUGINS_DIR)) {
      console.warn(
        `${colors.yellow}⚠️  No plugins directory found at ${PLUGINS_DIR}.${colors.reset}`
      );
      return true;
    }
    targetsToValidate = fs
      .readdirSync(PLUGINS_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({
        type: 'directory',
        name: d.name,
        path: path.join(PLUGINS_DIR, d.name)
      }));
  } else {
    const resolved = path.resolve(target);
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved);
      if (stat.isFile() && resolved.endsWith('.zip')) {
        targetsToValidate.push({
          type: 'zip',
          name: path.basename(resolved),
          path: resolved
        });
      } else if (stat.isDirectory()) {
        targetsToValidate.push({
          type: 'directory',
          name: path.basename(resolved),
          path: resolved
        });
      } else {
        console.error(
          `${colors.red}❌ Target must be a directory or .zip file: ${target}${colors.reset}`
        );
        if (exitOnError) process.exit(1);
        return false;
      }
    } else {
      const inPlugins = path.join(PLUGINS_DIR, target);
      if (fs.existsSync(inPlugins)) {
        targetsToValidate.push({
          type: 'directory',
          name: target,
          path: inPlugins
        });
      } else {
        console.error(
          `${colors.red}❌ Plugin "${target}" not found in plugins/ or as a file path.${colors.reset}`
        );
        if (exitOnError) process.exit(1);
        return false;
      }
    }
  }

  let passedCount = 0;
  let failedCount = 0;

  for (const item of targetsToValidate) {
    console.log(
      `${colors.bold}🔍 Validating plugin: ${colors.cyan}${item.name}${colors.reset} ${colors.gray}(${item.path})${colors.reset}`
    );

    const result =
      item.type === 'zip'
        ? validatePluginZip(item.path)
        : validatePluginDirectory(item.path, { strict });

    if (result.valid) {
      console.log(
        `  ${colors.green}✓${colors.reset} Manifest schema (plugin.json) ${colors.gray}[v${result.manifest?.version || '?'}]${colors.reset}`
      );
      if (result.manifest?.backend !== false) {
        console.log(
          `  ${colors.green}✓${colors.reset} Backend entrypoint exports init()`
        );
        console.log(
          `  ${colors.green}✓${colors.reset} Required architectural layers (routes, service, controller)`
        );
        if (result.warnings.length === 0) {
          console.log(
            `  ${colors.green}✓${colors.reset} Recommended architectural layers (repository)`
          );
        }
      }
      console.log(
        `  ${colors.green}✓${colors.reset} Architectural boundaries (no forbidden cross-plugin imports)`
      );

      for (const w of result.warnings) {
        console.log(
          `  ${colors.yellow}⚠${colors.reset} ${colors.yellow}${w}${colors.reset}`
        );
      }

      if (result.warnings.length > 0) {
        console.log(
          `  ${colors.yellow}Result: PASSED (with warnings)${colors.reset}\n`
        );
      } else {
        console.log(`  ${colors.green}Result: PASSED${colors.reset}\n`);
      }
      passedCount++;
    } else {
      for (const err of result.errors) {
        console.log(`  ${colors.red}✗${colors.reset} ${err}`);
      }
      for (const w of result.warnings) {
        console.log(`  ${colors.yellow}⚠${colors.reset} ${w}`);
      }

      console.log(
        `\n  ${colors.bold}💡 Actionable Suggestions:${colors.reset}`
      );
      if (
        result.errors.some(
          (e) => e.includes('Manifest') || e.includes('plugin.json')
        )
      ) {
        console.log(
          `     - Ensure 'plugin.json' exists, has kebab-case 'name', semver 'version' (e.g. "1.0.0"), and valid 'description'.`
        );
      }
      if (
        result.errors.some(
          (e) => e.includes('backend entrypoint') || e.includes('init')
        )
      ) {
        console.log(
          `     - Create 'backend/src/index.js' exporting 'export function init(app, registry) { ... }'.`
        );
      }
      if (result.errors.some((e) => e.includes('required backend layer'))) {
        console.log(
          `     - Organize your backend code into 'backend/src/routes', 'backend/src/service', and 'backend/src/controller'.`
        );
      }
      if (result.errors.some((e) => e.includes('Boundary Violation'))) {
        console.log(
          `     - Remove direct file imports across plugins. Use the global EventBus or ServiceRegistry instead.`
        );
      }
      if (result.errors.some((e) => e.includes('Zip Slip'))) {
        console.log(
          `     - Remove directory traversal ('..') entries from the archive.`
        );
      }

      console.log(
        `  ${colors.red}${colors.bold}Result: FAILED${colors.reset}\n`
      );
      failedCount++;
    }
  }

  console.log(
    `${colors.cyan}------------------------------------------------------------${colors.reset}`
  );
  console.log(
    `${colors.bold}Summary: ${targetsToValidate.length} plugin(s) checked. ${colors.green}${passedCount} passed${colors.reset}, ${failedCount > 0 ? colors.red : colors.gray}${failedCount} failed${colors.reset}.`
  );
  console.log(
    `${colors.cyan}============================================================${colors.reset}\n`
  );

  if (failedCount > 0) {
    if (exitOnError) process.exit(1);
    return false;
  }
  return true;
}

function generateNextjsWrapper() {
  // Deprecated in favor of generic catch-all routes (ADR-018 / Issue #159):
  // - Global plugins mount dynamically at /plugins/[pluginId]/[[...path]]
  // - Workspace plugins mount dynamically at /workspace/[slug]/plugins/[pluginId]/[[...path]]
  // No build-time wrapper files are generated inside frontend/app/.
  return;
}

function removeNextjsWrapper(pluginName) {
  const routeDir = path.join(FRONTEND_APP_DIR, pluginName);
  if (fs.existsSync(routeDir)) {
    fs.rmSync(routeDir, { recursive: true, force: true });
    console.log(`🗑️  Removed Next.js wrapper route at /${pluginName}`);
  }
}

function createPlugin(pluginName) {
  if (!pluginName) {
    console.error('❌ Error: Please provide a name for the new plugin.');
    process.exit(1);
  }

  if (pluginName.startsWith('--')) {
    console.error('❌ Error: Invalid plugin name. Cannot start with "--".');
    process.exit(1);
  }

  const targetDir = path.join(PLUGINS_DIR, pluginName);
  if (fs.existsSync(targetDir)) {
    console.error(`❌ Error: Plugin directory already exists at ${targetDir}.`);
    process.exit(1);
  }

  console.log(`🚀 Scaffolding new plugin "${pluginName}"...`);

  fs.mkdirSync(path.join(targetDir, 'backend', 'src', 'controller'), {
    recursive: true
  });
  fs.mkdirSync(path.join(targetDir, 'backend', 'src', 'routes'), {
    recursive: true
  });
  fs.mkdirSync(path.join(targetDir, 'backend', 'src', 'schema'), {
    recursive: true
  });
  fs.mkdirSync(path.join(targetDir, 'backend', 'src', 'service'), {
    recursive: true
  });
  fs.mkdirSync(path.join(targetDir, 'backend', 'src', 'repository'), {
    recursive: true
  });
  fs.mkdirSync(path.join(targetDir, 'frontend', 'pages'), { recursive: true });

  const pluginJson = {
    name: pluginName,
    version: '1.0.0',
    description: `The ${pluginName} plugin.`,
    dependencies: {}
  };
  fs.writeFileSync(
    path.join(targetDir, 'plugin.json'),
    JSON.stringify(pluginJson, null, 2)
  );

  const pkgJson = {
    name: `@campus-os/${pluginName}`,
    version: '1.0.0',
    private: true,
    main: 'backend/src/index.js',
    scripts: {
      test: 'vitest run'
    },
    peerDependencies: {
      react: '^18.2.0 || ^19.0.0',
      'react-dom': '^18.2.0 || ^19.0.0',
      '@tanstack/react-query': '^5.0.0',
      'lucide-react': '*'
    },
    dependencies: {
      '@campusos/design-system': 'workspace:*'
    }
  };
  fs.writeFileSync(
    path.join(targetDir, 'package.json'),
    JSON.stringify(pkgJson, null, 2)
  );

  const backendIndex = `export function init(app, registry) {\n  console.log('✓ Loaded plugin: ${pluginName}');\n}\n`;
  fs.writeFileSync(
    path.join(targetDir, 'backend', 'src', 'index.js'),
    backendIndex
  );

  const safeName = pluginName.replace(/[^a-zA-Z0-9]/g, '');
  const componentName =
    safeName.charAt(0).toUpperCase() + safeName.slice(1) + 'Page';
  const frontendPage = `import React from 'react';
import { Card, Button } from '@campusos/design-system';

export default function ${componentName}() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">${componentName}</h1>
        <p className="mt-4 text-slate-300">Welcome to the newly scaffolded ${pluginName} plugin!</p>
        <Button className="mt-6 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold">
          Get Started
        </Button>
      </Card>
    </div>
  );
}
`;
  fs.writeFileSync(
    path.join(targetDir, 'frontend', 'pages', 'index.tsx'),
    frontendPage
  );

  const frontendInit = `export function initFrontend() {\n  // Register widgets or sidebar links here\n}\n`;
  fs.writeFileSync(path.join(targetDir, 'frontend', 'init.ts'), frontendInit);

  console.log(`✅ Scaffolding complete for "${pluginName}".`);

  generateRegistry();
  generateNextjsWrapper(pluginName);
}

function generateRegistry() {
  console.log('🔄 Generating frontend plugin registry...');

  if (!fs.existsSync(PLUGINS_DIR)) {
    console.warn('⚠️  No plugins directory found.');
    return;
  }

  const plugins = fs
    .readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const activePlugins = [];

  for (const plugin of plugins) {
    const initTsPath = path.join(PLUGINS_DIR, plugin, 'frontend', 'init.ts');
    const initTsxPath = path.join(PLUGINS_DIR, plugin, 'frontend', 'init.tsx');
    const initJsPath = path.join(PLUGINS_DIR, plugin, 'frontend', 'init.js');

    if (
      fs.existsSync(initTsPath) ||
      fs.existsSync(initTsxPath) ||
      fs.existsSync(initJsPath)
    ) {
      activePlugins.push({
        name: plugin,
        varName: `init${plugin.charAt(0).toUpperCase() + plugin.slice(1).replace(/[^a-zA-Z0-9]/g, '')}`
      });
    }
    generateNextjsWrapper(plugin);
  }

  const pluginList = activePlugins.map((p) => `  '${p.name}'`).join(',\n');

  const registryContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// This file is generated by the CampusOS Plugin CLI Installer (Issue #158 / #162).

import { setupPluginRuntime } from './runtime-env';

const ACTIVE_PLUGINS = [
${pluginList}
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

  // Fault-tolerant dynamic bootstrap: missing or uninstalled plugins do not crash build
  for (const name of ACTIVE_PLUGINS) {
    try {
      const mod = await import(
        /* webpackIgnore: true */ \`@plugins/\${name}/frontend/init\`
      );
      if (typeof mod.initFrontend === 'function') {
        mod.initFrontend();
      }
    } catch {
      // Dynamic runtime ESM bundle will be loaded via PluginRuntimeProvider
    }
  }
}

export default initializePlugins;
`;

  fs.writeFileSync(REGISTRY_FILE, registryContent, 'utf8');
  console.log(
    `✅ Registry updated successfully. Wired up ${activePlugins.length} frontend plugin(s).`
  );
}

function installFromDirectory(absoluteSource) {
  console.log(`📦 Validating plugin directory: ${absoluteSource}...`);
  const validation = validatePluginDirectory(absoluteSource);
  if (!validation.valid) {
    console.error('❌ Cannot install plugin: directory validation failed.');
    validation.errors.forEach((err) => console.error(`   ✗ ${err}`));
    process.exit(1);
  }

  const pluginName = validation.manifest.name;
  const targetDir = path.join(PLUGINS_DIR, pluginName);
  if (fs.existsSync(targetDir)) {
    console.error(
      `❌ Error: Plugin directory already exists at ${targetDir}. Please uninstall it first.`
    );
    process.exit(1);
  }

  fs.cpSync(absoluteSource, targetDir, { recursive: true });
  return pluginName;
}

async function installPlugin(sourcePath) {
  if (!sourcePath) {
    console.error(
      '❌ Error: Please provide a source path (.zip, folder, or GitHub repo).'
    );
    process.exit(1);
  }

  if (sourcePath.startsWith('--')) {
    console.error('❌ Error: Invalid source path. Cannot start with "--".');
    process.exit(1);
  }

  if (!fs.existsSync(PLUGINS_DIR)) {
    fs.mkdirSync(PLUGINS_DIR, { recursive: true });
  }

  let pluginName = '';

  const isGithubUrl =
    sourcePath.startsWith('https://github.com/') ||
    /^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(sourcePath);

  if (isGithubUrl) {
    console.log(`🌐 Fetching plugin from GitHub/URL: ${sourcePath}`);
    const result = await installPluginPackage({
      packageUrl: sourcePath,
      pluginsDir: PLUGINS_DIR
    });
    if (!result.success) {
      console.error(`❌ Cannot install plugin: ${result.error}`);
      process.exit(1);
    }
    pluginName = result.plugin.name;
  } else {
    const absoluteSource = path.resolve(sourcePath);
    if (!fs.existsSync(absoluteSource)) {
      console.error(`❌ Error: Source path not found: ${absoluteSource}`);
      process.exit(1);
    }

    const stat = fs.statSync(absoluteSource);

    if (stat.isFile() && absoluteSource.endsWith('.zip')) {
      console.log(`📦 Installing zip archive: ${sourcePath}...`);
      const result = await installPluginPackage({
        file: { path: absoluteSource },
        pluginsDir: PLUGINS_DIR
      });
      if (!result.success) {
        console.error(`❌ Cannot install plugin: ${result.error}`);
        process.exit(1);
      }
      pluginName = result.plugin.name;
    } else if (stat.isDirectory()) {
      pluginName = installFromDirectory(absoluteSource);
    } else {
      console.error(
        '❌ Error: Source path must be a directory or a .zip file.'
      );
      process.exit(1);
    }
  }

  console.log(`✅ Plugin "${pluginName}" installed successfully!`);
  generateRegistry();
  generateNextjsWrapper(pluginName);
}

function uninstallPlugin(pluginName) {
  if (!pluginName) {
    console.error(
      '❌ Error: Please provide the name of the plugin to uninstall.'
    );
    process.exit(1);
  }

  if (pluginName.startsWith('--')) {
    console.error('❌ Error: Invalid plugin name. Cannot start with "--".');
    process.exit(1);
  }

  const targetDir = path.join(PLUGINS_DIR, pluginName);
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Error: Plugin "${pluginName}" is not installed.`);
    process.exit(1);
  }

  console.log(`🗑️  Uninstalling plugin "${pluginName}"...`);
  fs.rmSync(targetDir, { recursive: true, force: true });

  console.log(`✅ Plugin "${pluginName}" uninstalled successfully!`);
  generateRegistry();
  removeNextjsWrapper(pluginName);
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
      createPlugin(args[1]);
      break;
    case 'install':
      await installPlugin(args[1]);
      break;
    case 'uninstall':
      uninstallPlugin(args[1]);
      break;
    case 'generate-registry':
      generateRegistry();
      break;
    case 'validate': {
      const isStrict = args.includes('--strict');
      const targetArg = args.slice(1).find((a) => !a.startsWith('--'));
      validatePlugin(targetArg, { strict: isStrict });
      break;
    }
    case 'build-frontend': {
      const pluginName = args[1];
      const isMinify = args.includes('--minify');
      if (!pluginName) {
        console.error(
          '❌ Error: Please specify the plugin name to build frontend for.'
        );
        process.exit(1);
      }
      buildPluginFrontend(pluginName, { minify: isMinify })
        .then(({ outfile, sizeBytes }) => {
          console.log(
            `✅ Frontend bundle built: ${outfile} (${(sizeBytes / 1024).toFixed(2)} KB)`
          );
        })
        .catch((err) => {
          console.error(`❌ Build failed:`, err.message);
          process.exit(1);
        });
      break;
    }
    default:
      console.log(`
CampusOS Plugin CLI
-------------------
Usage:
  node scripts/plugin.js create <plugin-name>
  node scripts/plugin.js install <path-to-folder-zip-or-github-repo>
  node scripts/plugin.js uninstall <plugin-name>
  node scripts/plugin.js validate [plugin-name-or-path] [--strict]
  node scripts/plugin.js build-frontend <plugin-name> [--minify]
  node scripts/plugin.js generate-registry
`);
      process.exit(1);
  }
}
