import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import {
  validatePluginZip,
  installPluginPackage
} from './plugin-installer.service.js';

describe('PluginInstallerService (Issue #163)', () => {
  let tempDir;
  let testPluginsDir;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'campusos-installer-test-')
    );
    testPluginsDir = path.join(tempDir, 'plugins');
    fs.mkdirSync(testPluginsDir, { recursive: true });
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  function createSampleZip(manifestOverrides = {}, options = {}) {
    const zip = new AdmZip();
    const manifest = {
      name: 'sample-addon',
      version: '1.0.0',
      description: 'A sample addon plugin for testing',
      ...manifestOverrides
    };

    const prefix = options.prefix || '';

    zip.addFile(
      `${prefix}plugin.json`,
      Buffer.from(JSON.stringify(manifest, null, 2))
    );

    if (manifest.backend !== false) {
      zip.addFile(
        `${prefix}backend/src/index.js`,
        Buffer.from('export function init(app, registry) {}\n')
      );
      zip.addFile(
        `${prefix}backend/src/routes/addon.routes.js`,
        Buffer.from('export const routes = [];\n')
      );
      zip.addFile(
        `${prefix}backend/src/service/addon.service.js`,
        Buffer.from('export class AddonService {}\n')
      );
      zip.addFile(
        `${prefix}backend/src/controller/addon.controller.js`,
        Buffer.from('export const controller = {};\n')
      );
    }

    if (options.includeFrontend) {
      zip.addFile(
        `${prefix}frontend/pages/index.tsx`,
        Buffer.from('export default function Page() { return null; }\n')
      );
    }

    if (options.includePrebuiltBundle) {
      zip.addFile(
        `${prefix}dist/bundle.esm.js`,
        Buffer.from('console.log("prebuilt bundle");\n')
      );
    }

    const zipPath = path.join(tempDir, `${manifest.name || 'test'}.zip`);
    zip.writeZip(zipPath);
    return { zip, zipPath, manifest };
  }

  describe('validatePluginZip', () => {
    it('should validate a compliant plugin zip archive', () => {
      const { zipPath, manifest } = createSampleZip();
      const result = validatePluginZip(zipPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.name).toBe(manifest.name);
      expect(result.manifest.version).toBe('1.0.0');
    });

    it('should validate a GitHub release zip with a nested root directory', () => {
      const { zipPath } = createSampleZip(
        { name: 'github-plugin', version: '2.0.0' },
        { prefix: 'campusos-github-plugin-main/' }
      );
      const result = validatePluginZip(zipPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest.name).toBe('github-plugin');
      expect(result.basePath).toBe('campusos-github-plugin-main/');
    });

    it('should reject an archive with Zip Slip directory traversal', () => {
      const zip = new AdmZip();
      zip.addFile('normal.txt', Buffer.from('hello'));
      zip.getEntries()[0].entryName = '../../evil.txt';
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
      const zipPath = path.join(tempDir, 'evil.zip');
      zip.writeZip(zipPath);

      const result = validatePluginZip(zipPath);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(
          (e) => e.includes('Zip Slip') || e.includes('path traversal')
        )
      ).toBe(true);
    });

    it('should reject an archive without plugin.json', () => {
      const zip = new AdmZip();
      zip.addFile('dummy.txt', Buffer.from('hello'));
      const zipPath = path.join(tempDir, 'no-manifest.zip');
      zip.writeZip(zipPath);

      const result = validatePluginZip(zipPath);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("no 'plugin.json' manifest found"))
      ).toBe(true);
    });

    it('should reject an archive with missing backend entrypoint for backend plugin', () => {
      const zip = new AdmZip();
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'missing-backend-plugin',
            version: '1.0.0',
            description: 'Missing backend entry'
          })
        )
      );
      const zipPath = path.join(tempDir, 'no-backend.zip');
      zip.writeZip(zipPath);

      const result = validatePluginZip(zipPath);
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.toLowerCase().includes('missing required backend entrypoint')
        )
      ).toBe(true);
    });
  });

  describe('installPluginPackage', () => {
    it('should install a valid plugin from an uploaded zip file', async () => {
      const { zipPath, manifest } = createSampleZip(
        { name: 'valid-upload-plugin' },
        { includePrebuiltBundle: true }
      );

      const mockDbModel = {
        findOneAndUpdate: vi.fn().mockResolvedValue({ name: manifest.name })
      };
      const mockEventBus = {
        emit: vi.fn()
      };

      const result = await installPluginPackage({
        file: { path: zipPath, originalname: 'valid-upload-plugin.zip' },
        pluginsDir: testPluginsDir,
        dbModel: mockDbModel,
        eventBus: mockEventBus
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.plugin.name).toBe('valid-upload-plugin');

      // Check files extracted to pluginsDir/valid-upload-plugin
      const installedDir = path.join(testPluginsDir, 'valid-upload-plugin');
      expect(fs.existsSync(installedDir)).toBe(true);
      expect(fs.existsSync(path.join(installedDir, 'plugin.json'))).toBe(true);
      expect(
        fs.existsSync(path.join(installedDir, 'backend', 'src', 'index.js'))
      ).toBe(true);
      expect(
        fs.existsSync(path.join(installedDir, 'dist', 'bundle.esm.js'))
      ).toBe(true);

      // Verify DB registration
      expect(mockDbModel.findOneAndUpdate).toHaveBeenCalledWith(
        { name: 'valid-upload-plugin' },
        expect.objectContaining({
          name: 'valid-upload-plugin',
          version: '1.0.0'
        }),
        expect.any(Object)
      );

      // Verify event emission
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'plugin:installed',
        expect.objectContaining({ pluginName: 'valid-upload-plugin' })
      );
    });

    it('should reject installation when plugin already exists and force is false', async () => {
      const { zipPath } = createSampleZip({ name: 'existing-plugin' });

      // Pre-create the directory
      fs.mkdirSync(path.join(testPluginsDir, 'existing-plugin'), {
        recursive: true
      });

      const result = await installPluginPackage({
        file: { path: zipPath, originalname: 'existing.zip' },
        pluginsDir: testPluginsDir,
        force: false
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(409);
      expect(result.error).toContain('already installed');
    });

    it('should overwrite existing plugin when force is true', async () => {
      const { zipPath } = createSampleZip(
        { name: 'overwritten-plugin', version: '2.0.0' },
        { includePrebuiltBundle: true }
      );

      const existingDir = path.join(testPluginsDir, 'overwritten-plugin');
      fs.mkdirSync(existingDir, { recursive: true });
      fs.writeFileSync(path.join(existingDir, 'old-file.txt'), 'old data');

      const result = await installPluginPackage({
        file: { path: zipPath, originalname: 'overwrite.zip' },
        pluginsDir: testPluginsDir,
        force: true
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(fs.existsSync(path.join(existingDir, 'old-file.txt'))).toBe(false);
      expect(
        fs.existsSync(path.join(existingDir, 'dist', 'bundle.esm.js'))
      ).toBe(true);
    });

    it('should reject malicious zip with Zip Slip and clean up temporary files', async () => {
      const zip = new AdmZip();
      zip.addFile('safe.txt', Buffer.from('hello'));
      zip.getEntries()[0].entryName = '../../../etc/cron.d/evil';
      zip.addFile(
        'plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'slip-plugin',
            version: '1.0.0',
            description: 'Zip Slip'
          })
        )
      );
      const zipPath = path.join(tempDir, 'slip.zip');
      zip.writeZip(zipPath);

      const result = await installPluginPackage({
        file: { path: zipPath, originalname: 'slip.zip' },
        pluginsDir: testPluginsDir
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain('Zip Slip');

      // Ensure temp file was deleted
      expect(fs.existsSync(zipPath)).toBe(false);

      // Ensure no destination directory was created
      expect(fs.existsSync(path.join(testPluginsDir, 'slip-plugin'))).toBe(
        false
      );
    });

    it('should download and install a plugin package from a remote URL', async () => {
      const { zip } = createSampleZip(
        { name: 'remote-url-plugin' },
        { includePrebuiltBundle: true }
      );
      const zipBuffer = zip.toBuffer();

      // Mock global.fetch
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: async () =>
          zipBuffer.buffer.slice(
            zipBuffer.byteOffset,
            zipBuffer.byteOffset + zipBuffer.byteLength
          )
      });
      global.fetch = fetchMock;

      const result = await installPluginPackage({
        packageUrl:
          'https://github.com/NITRR-Official/CampusOS-Remote-Plugin/releases/download/v1.0.0/release.zip',
        pluginsDir: testPluginsDir
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.plugin.name).toBe('remote-url-plugin');

      const installedDir = path.join(testPluginsDir, 'remote-url-plugin');
      expect(fs.existsSync(path.join(installedDir, 'plugin.json'))).toBe(true);
    });

    it('should reject with 400 when remote package download fails', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
      global.fetch = fetchMock;

      const result = await installPluginPackage({
        packageUrl: 'https://github.com/NITRR-Official/NonExistentPlugin',
        pluginsDir: testPluginsDir
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain('Failed to download plugin archive');
    });

    it('should return 400 when neither file nor packageUrl is provided', async () => {
      const result = await installPluginPackage({
        pluginsDir: testPluginsDir
      });

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.error).toContain(
        'Either a plugin .zip file or packageUrl must be provided'
      );
    });
  });
});
