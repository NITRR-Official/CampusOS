import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import {
  validatePluginDirectory,
  validatePluginZip,
  checkCrossPluginImports,
  validatePlugin
} from '../../../scripts/plugin.js';

describe('Plugin Validator & Secure Package Installer (Issue #115)', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusos-test-plugin-'));
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function createValidPluginStructure(dir, name = 'test-plugin') {
    const pluginDir = path.join(dir, name);
    fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'routes'), {
      recursive: true
    });
    fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'service'), {
      recursive: true
    });
    fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'controller'), {
      recursive: true
    });
    fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'repository'), {
      recursive: true
    });

    const manifest = {
      name,
      version: '1.0.0',
      description: 'A test plugin for validation',
      dependencies: {}
    };
    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(manifest, null, 2)
    );

    const indexContent = `export function init(app, registry) {\n  console.log('init test plugin');\n}\n`;
    fs.writeFileSync(
      path.join(pluginDir, 'backend', 'src', 'index.js'),
      indexContent
    );

    return pluginDir;
  }

  describe('validatePluginDirectory', () => {
    it('should validate a compliant plugin directory successfully', () => {
      const pluginDir = createValidPluginStructure(tempDir, 'sample-plugin');
      const result = validatePluginDirectory(pluginDir);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.name).toBe('sample-plugin');
      expect(result.manifest.version).toBe('1.0.0');
    });

    it('should fail when plugin directory does not exist', () => {
      const nonExistent = path.join(tempDir, 'does-not-exist');
      const result = validatePluginDirectory(nonExistent);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not exist');
    });

    it('should fail when plugin.json is missing', () => {
      const pluginDir = path.join(tempDir, 'no-manifest');
      fs.mkdirSync(pluginDir, { recursive: true });

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("Missing 'plugin.json' manifest");
    });

    it('should fail when plugin.json contains invalid JSON', () => {
      const pluginDir = path.join(tempDir, 'bad-json');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(path.join(pluginDir, 'plugin.json'), '{ not valid json');

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid JSON');
    });

    it('should fail when manifest name is not kebab-case', () => {
      const pluginDir = path.join(tempDir, 'Invalid_Name');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'Invalid_Name',
          version: '1.0.0',
          description: 'Test'
        })
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('kebab-case'))).toBe(true);
    });

    it('should fail when manifest version is not valid SemVer', () => {
      const pluginDir = path.join(tempDir, 'bad-ver');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'bad-ver',
          version: 'v1-beta',
          description: 'Test'
        })
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('SemVer'))).toBe(true);
    });

    it('should fail when folder name does not match manifest name', () => {
      const pluginDir = path.join(tempDir, 'folder-one');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'folder-two',
          version: '1.0.0',
          description: 'Test'
        })
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('does not match manifest name'))
      ).toBe(true);
    });

    it('should fail when backend entrypoint is missing for backend plugin', () => {
      const pluginDir = path.join(tempDir, 'no-backend-entry');
      fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'routes'), {
        recursive: true
      });
      fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'service'), {
        recursive: true
      });
      fs.mkdirSync(path.join(pluginDir, 'backend', 'src', 'controller'), {
        recursive: true
      });
      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'no-backend-entry',
          version: '1.0.0',
          description: 'Test'
        })
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes('Missing backend entrypoint'))
      ).toBe(true);
    });

    it('should fail when backend entrypoint does not export init', () => {
      const pluginDir = createValidPluginStructure(tempDir, 'no-init');
      fs.writeFileSync(
        path.join(pluginDir, 'backend', 'src', 'index.js'),
        'export function notInit() {}\n'
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("must export an 'init' function"))
      ).toBe(true);
    });

    it('should fail when required architectural layers are missing', () => {
      const pluginDir = path.join(tempDir, 'missing-layers');
      fs.mkdirSync(path.join(pluginDir, 'backend', 'src'), {
        recursive: true
      });
      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'missing-layers',
          version: '1.0.0',
          description: 'Test'
        })
      );
      fs.writeFileSync(
        path.join(pluginDir, 'backend', 'src', 'index.js'),
        'export function init() {}\n'
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("backend/src/routes' directory is required")
        )
      ).toBe(true);
      expect(
        result.errors.some((e) =>
          e.includes("backend/src/service' directory is required")
        )
      ).toBe(true);
      expect(
        result.errors.some((e) =>
          e.includes("backend/src/controller' directory is required")
        )
      ).toBe(true);
    });

    it('should skip backend requirements if manifest has backend: false', () => {
      const pluginDir = path.join(tempDir, 'frontend-only');
      fs.mkdirSync(pluginDir, { recursive: true });
      fs.writeFileSync(
        path.join(pluginDir, 'plugin.json'),
        JSON.stringify({
          name: 'frontend-only',
          version: '1.0.0',
          description: 'Frontend only plugin',
          backend: false
        })
      );

      const result = validatePluginDirectory(pluginDir);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should emit a warning if recommended repository layer is missing', () => {
      const pluginDir = createValidPluginStructure(tempDir, 'no-repo');
      fs.rmSync(path.join(pluginDir, 'backend', 'src', 'repository'), {
        recursive: true,
        force: true
      });

      const result = validatePluginDirectory(pluginDir, { strict: false });
      expect(result.valid).toBe(true);
      expect(result.warnings.some((w) => w.includes('repository'))).toBe(true);
    });
  });

  describe('checkCrossPluginImports', () => {
    it('should detect relative imports that escape plugin directory', () => {
      const pluginDir = createValidPluginStructure(tempDir, 'escaping-plugin');
      const serviceFile = path.join(
        pluginDir,
        'backend',
        'src',
        'service',
        'test.service.js'
      );
      fs.writeFileSync(
        serviceFile,
        `import { other } from '../../../../other-plugin/backend/src/service/other.service.js';\n`
      );

      const violations = checkCrossPluginImports(pluginDir);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].reason).toContain(
        'escapes plugin directory boundary'
      );
    });

    it('should detect backend imports referencing other plugins', () => {
      const pluginDir = createValidPluginStructure(
        tempDir,
        'backend-import-plugin'
      );
      const serviceFile = path.join(
        pluginDir,
        'backend',
        'src',
        'service',
        'test.service.js'
      );
      fs.writeFileSync(
        serviceFile,
        `import { other } from '@plugins/club/backend/src/service/club.service.js';\n`
      );

      const violations = checkCrossPluginImports(pluginDir);
      expect(violations.length).toBeGreaterThan(0);
      expect(violations[0].reason).toContain(
        'Backend code must not import from plugins'
      );
    });

    it('should allow internal relative imports within the plugin', () => {
      const pluginDir = createValidPluginStructure(tempDir, 'clean-plugin');
      const serviceFile = path.join(
        pluginDir,
        'backend',
        'src',
        'service',
        'clean.service.js'
      );
      fs.writeFileSync(
        serviceFile,
        `import { repo } from '../repository/clean.repository.js';\n`
      );

      const violations = checkCrossPluginImports(pluginDir);
      expect(violations).toHaveLength(0);
    });
  });

  describe('validatePluginZip', () => {
    it('should validate a valid zip archive successfully', () => {
      const zip = new AdmZip();
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'zip-plugin',
            version: '1.0.0',
            description: 'Zip test plugin'
          })
        )
      );
      zip.addFile(
        'backend/src/index.js',
        Buffer.from('export function init(app, registry) {}\n')
      );

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.name).toBe('zip-plugin');
    });

    it('should validate a zip archive with nested root folder', () => {
      const zip = new AdmZip();
      zip.addFile(
        'zip-plugin/plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'zip-plugin',
            version: '2.1.0',
            description: 'Nested zip plugin'
          })
        )
      );
      zip.addFile(
        'zip-plugin/backend/src/index.js',
        Buffer.from('export function init(app, registry) {}\n')
      );

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.basePath).toBe('zip-plugin/');
    });

    it('should reject zip archive with Zip Slip directory traversal', () => {
      const zip = new AdmZip();
      zip.addFile('evil.txt', Buffer.from('malicious content'));
      zip.getEntries()[0].entryName = '../../etc/passwd';
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'evil-plugin',
            version: '1.0.0',
            description: 'Evil'
          })
        )
      );

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(
          (e) => e.includes('Zip Slip') || e.includes('path traversal')
        )
      ).toBe(true);
    });

    it('should reject zip archive without plugin.json', () => {
      const zip = new AdmZip();
      zip.addFile('dummy.txt', Buffer.from('hello'));

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("no 'plugin.json' manifest found");
    });

    it('should reject zip archive with invalid manifest JSON', () => {
      const zip = new AdmZip();
      zip.addFile('plugin.json', Buffer.from('{ corrupt json'));

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('invalid JSON');
    });

    it('should reject zip archive with invalid manifest schema', () => {
      const zip = new AdmZip();
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'INVALID_CAPS',
            version: 'not-semver',
            description: 'bad'
          })
        )
      );

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('kebab-case'))).toBe(true);
    });

    it('should reject zip archive missing backend entrypoint for backend plugin', () => {
      const zip = new AdmZip();
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'backend-missing-index',
            version: '1.0.0',
            description: 'Test'
          })
        )
      );

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes('missing required backend entrypoint')
        )
      ).toBe(true);
    });

    it('should reject zip archive whose backend entrypoint does not export init', () => {
      const zip = new AdmZip();
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'bad-index-zip',
            version: '1.0.0',
            description: 'Test'
          })
        )
      );
      zip.addFile(
        'backend/src/index.js',
        Buffer.from('console.log("no init export");\n')
      );

      const result = validatePluginZip(zip);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("does not export an 'init' function")
        )
      ).toBe(true);
    });
  });

  describe('validatePlugin CLI helper', () => {
    it('should return true for valid plugin directory with exitOnError: false', () => {
      const pluginDir = createValidPluginStructure(tempDir, 'cli-valid-plugin');
      const pass = validatePlugin(pluginDir, { exitOnError: false });
      expect(pass).toBe(true);
    });

    it('should return false for invalid plugin directory with exitOnError: false', () => {
      const pluginDir = path.join(tempDir, 'cli-invalid-plugin');
      fs.mkdirSync(pluginDir, { recursive: true });
      const pass = validatePlugin(pluginDir, { exitOnError: false });
      expect(pass).toBe(false);
    });
  });
});
