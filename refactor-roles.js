import fs from 'fs';
import path from 'path';

const APPS_DIR = path.join(process.cwd(), 'apps');

const plugins = fs
  .readdirSync(APPS_DIR)
  .filter((p) => fs.statSync(path.join(APPS_DIR, p)).isDirectory());

for (const plugin of plugins) {
  const indexFile = path.join(APPS_DIR, plugin, 'src', 'index.js');
  const routesDir = path.join(APPS_DIR, plugin, 'src', 'routes');
  const routesFile = path.join(routesDir, `${plugin}.routes.js`);

  // Update index.js
  if (fs.existsSync(indexFile)) {
    let content = fs.readFileSync(indexFile, 'utf8');
    content = content.replace(
      /const requireRoles = registry\.getService\('requireRoles'\);/g,
      "const requirePermissions = registry.getService('requirePermissions');"
    );
    content = content.replace(/requireRoles/g, 'requirePermissions');
    fs.writeFileSync(indexFile, content);
    console.log(`Updated ${indexFile}`);
  }

  // Update routes.js
  if (fs.existsSync(routesFile)) {
    let content = fs.readFileSync(routesFile, 'utf8');
    // Replace function parameter
    content = content.replace(/, requireRoles\)/g, ', requirePermissions)');

    // Replace variable assignment: const manageEvents = requireRoles('admin', 'coordinator');
    // We will replace `requireRoles(...)` with `requirePermissions('${plugin}:manage')`
    content = content.replace(
      /requireRoles\([^)]*\)/g,
      `requirePermissions('${plugin}:manage')`
    );

    fs.writeFileSync(routesFile, content);
    console.log(`Updated ${routesFile}`);
  }
}
