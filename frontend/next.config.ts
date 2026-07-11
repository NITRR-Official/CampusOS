import fs from 'fs';
import path from 'path';
import type { NextConfig } from 'next';

const pluginsPath = path.resolve(__dirname, '../plugins');
const pluginPackages: string[] = [];

try {
  const plugins = fs.readdirSync(pluginsPath);
  for (const plugin of plugins) {
    const pkgJsonPath = path.join(pluginsPath, plugin, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
      if (pkg.name) {
        pluginPackages.push(pkg.name);
      }
    }
  }
} catch (e) {
  console.warn('Could not load plugins for transpilePackages', e);
}

const nextConfig: NextConfig = {
  transpilePackages: pluginPackages,
  experimental: {
    externalDir: true
  }
};

export default nextConfig;
