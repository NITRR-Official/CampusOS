import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { execSync } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PLUGINS_DIR = path.join(__dirname, '../plugins');
const REGISTRY_FILE = path.join(__dirname, '../frontend/lib/plugins/init.ts');
const FRONTEND_APP_DIR = path.join(__dirname, '../frontend/app/(dashboard)');

function generateNextjsWrapper(pluginName) {
  const pluginFrontendPagesDir = path.join(
    PLUGINS_DIR,
    pluginName,
    'frontend',
    'pages'
  );
  if (!fs.existsSync(pluginFrontendPagesDir)) {
    return;
  }

  const files = fs.readdirSync(pluginFrontendPagesDir);
  const mainPageFile = files.find(
    (f) => f.endsWith('Page.tsx') || f === 'index.tsx' || f === 'page.tsx'
  );

  if (mainPageFile) {
    const componentNameMatch = mainPageFile.match(/^([a-zA-Z0-9]+)\.tsx$/);
    let componentName = componentNameMatch
      ? componentNameMatch[1]
      : 'PluginPage';
    if (componentName === 'index' || componentName === 'page') {
      componentName = 'PluginPage';
    }
    const importName = mainPageFile.replace('.tsx', '');
    const routeDir = path.join(FRONTEND_APP_DIR, pluginName);

    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    const wrapperContent = `import ${componentName} from '@plugins/${pluginName}/frontend/pages/${importName}';\n\nexport default function Page() {\n  return <${componentName} />;\n}\n`;

    const wrapperFile = path.join(routeDir, 'page.tsx');
    fs.writeFileSync(wrapperFile, wrapperContent, 'utf8');
    console.log(`✅ Generated Next.js wrapper route at /${pluginName}`);
  }
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
        // Capitalize and format for safe variable name
        varName: `init${plugin.charAt(0).toUpperCase() + plugin.slice(1).replace(/[^a-zA-Z0-9]/g, '')}`
      });
    }
  }

  const imports = activePlugins
    .map(
      (p) =>
        `import { initFrontend as ${p.varName} } from '@plugins/${p.name}/frontend/init';`
    )
    .join('\n');
  const initializers = activePlugins.map((p) => `  ${p.varName}();`).join('\n');

  const registryContent = `// AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
// This file is generated by the CampusOS Plugin CLI Installer.

${imports}

export function initializePlugins() {
  if (typeof window !== 'undefined') {
    // Prevent double initialization in React strict mode / fast refresh
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).__pluginsInitialized) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__pluginsInitialized = true;
  }

  // Initialize all known frontend plugin UI components
${initializers}
}
`;

  fs.writeFileSync(REGISTRY_FILE, registryContent, 'utf8');
  console.log(
    `✅ Registry updated successfully. Wired up ${activePlugins.length} frontend plugin(s).`
  );
}

function installFromDirectory(absoluteSource) {
  console.log(`📦 Copying plugin directory: ${absoluteSource}...`);
  const manifestPath = path.join(absoluteSource, 'plugin.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Error: Invalid plugin directory. No plugin.json found.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const pluginName = manifest.name;

  if (!pluginName) {
    console.error('❌ Error: plugin.json must have a "name" field.');
    process.exit(1);
  }

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

function installPlugin(sourcePath) {
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
    const repoUrl = sourcePath.startsWith('http')
      ? sourcePath
      : `https://github.com/${sourcePath}.git`;
    console.log(`🌐 Fetching plugin from GitHub: ${repoUrl}`);

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusos-plugin-'));
    try {
      execSync(`git clone --depth 1 ${repoUrl} ${tempDir}`, {
        stdio: 'inherit'
      });
      fs.rmSync(path.join(tempDir, '.git'), { recursive: true, force: true });

      pluginName = installFromDirectory(tempDir);
    } catch (error) {
      console.error(`❌ Error cloning repository: ${error.message}`);
      process.exit(1);
    } finally {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
  } else {
    const absoluteSource = path.resolve(sourcePath);
    if (!fs.existsSync(absoluteSource)) {
      console.error(`❌ Error: Source path not found: ${absoluteSource}`);
      process.exit(1);
    }

    const stat = fs.statSync(absoluteSource);

    if (stat.isFile() && absoluteSource.endsWith('.zip')) {
      console.log(`📦 Extracting zip archive: ${sourcePath}...`);
      const zip = new AdmZip(absoluteSource);
      const zipEntries = zip.getEntries();

      let manifestEntry = zipEntries.find(
        (e) =>
          e.entryName === 'plugin.json' || e.entryName.endsWith('/plugin.json')
      );
      if (!manifestEntry) {
        console.error(
          '❌ Error: Invalid plugin. No plugin.json found in the zip archive.'
        );
        process.exit(1);
      }

      const manifestContent = zip.readAsText(manifestEntry);
      try {
        const manifest = JSON.parse(manifestContent);
        pluginName = manifest.name;
      } catch (e) {
        console.error('❌ Error: plugin.json is invalid JSON.');
        process.exit(1);
      }

      if (!pluginName) {
        console.error('❌ Error: plugin.json must have a "name" field.');
        process.exit(1);
      }

      const targetDir = path.join(PLUGINS_DIR, pluginName);
      if (fs.existsSync(targetDir)) {
        console.error(
          `❌ Error: Plugin directory already exists at ${targetDir}. Please uninstall it first.`
        );
        process.exit(1);
      }

      const basePath = manifestEntry.entryName.replace('plugin.json', '');
      fs.mkdirSync(targetDir, { recursive: true });

      zipEntries.forEach((entry) => {
        if (entry.entryName.startsWith(basePath) && !entry.isDirectory) {
          const relativePath = entry.entryName.substring(basePath.length);
          const destPath = path.join(targetDir, relativePath);
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, entry.getData());
        }
      });
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

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'create':
    createPlugin(args[1]);
    break;
  case 'install':
    installPlugin(args[1]);
    break;
  case 'uninstall':
    uninstallPlugin(args[1]);
    break;
  case 'generate-registry':
    generateRegistry();
    break;
  default:
    console.log(`
CampusOS Plugin CLI
-------------------
Usage:
  node scripts/plugin.js create <plugin-name>
  node scripts/plugin.js install <path-to-folder-zip-or-github-repo>
  node scripts/plugin.js uninstall <plugin-name>
  node scripts/plugin.js generate-registry
`);
    process.exit(1);
}
