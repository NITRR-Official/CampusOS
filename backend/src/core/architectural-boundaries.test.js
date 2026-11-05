import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '../../..');

describe('Architectural Boundary Enforcement (Issue #114)', () => {
  const configPath = path.join(rootDir, '.dependency-cruiser.cjs');

  it('.dependency-cruiser.cjs exists in root directory', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('defines mandatory rules: no-cross-plugin-file-imports and no-plugin-to-backend-internal-imports', async () => {
    // Dynamic import of cjs config
    const { default: config } = await import(configPath);

    const rules = config.forbidden || [];
    const ruleNames = rules.map((r) => r.name);

    expect(ruleNames).toContain('no-cross-plugin-file-imports');
    expect(ruleNames).toContain('no-plugin-to-backend-internal-imports');

    const crossPluginRule = rules.find(
      (r) => r.name === 'no-cross-plugin-file-imports'
    );
    expect(crossPluginRule.severity).toBe('error');
    expect(crossPluginRule.from.path).toBe('^plugins/([^/]+)/');
    expect(crossPluginRule.to.path).toBe('^plugins/([^/]+)/');
    expect(crossPluginRule.to.pathNot).toBe('^plugins/$1/');

    const internalBackendRule = rules.find(
      (r) => r.name === 'no-plugin-to-backend-internal-imports'
    );
    expect(internalBackendRule.severity).toBe('error');
    expect(internalBackendRule.from.path).toBe('^plugins/');
    expect(internalBackendRule.to.path).toBe('^backend/');
  });

  it('root package.json includes lint:arch script', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
    );
    expect(pkg.scripts['lint:arch']).toBeDefined();
    expect(pkg.scripts['lint:arch']).toContain('depcruise');
  });

  it('.husky/pre-commit and .github/workflows/ci.yml execute pnpm lint:arch', () => {
    const preCommit = fs.readFileSync(
      path.join(rootDir, '.husky/pre-commit'),
      'utf8'
    );
    expect(preCommit).toContain('pnpm lint:arch');

    const ciWorkflow = fs.readFileSync(
      path.join(rootDir, '.github/workflows/ci.yml'),
      'utf8'
    );
    expect(ciWorkflow).toContain('pnpm lint:arch');
  });
});
