import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';
import { registerPluginRoutes } from './plugin.routes.js';
import { initPluginService } from '../service/plugin.service.js';

describe('Plugin Installation API (POST /api/v1/plugins/install - Issue #163)', () => {
  let app;
  let tempDir;
  let testPluginsDir;
  let mockPluginModel;
  let mockEventBus;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'campusos-api-test-'));
    testPluginsDir = path.join(tempDir, 'plugins');
    fs.mkdirSync(testPluginsDir, { recursive: true });

    mockPluginModel = {
      find: vi.fn().mockReturnValue({ lean: () => [] }),
      findOne: vi.fn(),
      findOneAndUpdate: vi
        .fn()
        .mockImplementation((query, update) =>
          Promise.resolve({ ...update, ...query })
        )
    };

    mockEventBus = {
      emit: vi.fn(),
      emitAsync: vi.fn()
    };

    const mockRegistry = {
      getService: (name) => {
        if (name === 'core:models') return { Plugin: mockPluginModel };
        if (name === 'eventBus') return mockEventBus;
        return null;
      },
      getSettingsConfig: () => ({})
    };

    initPluginService(mockRegistry, mockEventBus);

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Mock requireRoles middleware that grants super-admin
    const mockRequireRoles = () => (req, res, next) => {
      if (req.headers['x-test-role'] === 'user') {
        return res.status(403).json({
          success: false,
          error: 'Access forbidden: super-admin required'
        });
      }
      req.user = { role: 'super-admin' };
      next();
    };

    registerPluginRoutes(app, mockRequireRoles, { pluginsDir: testPluginsDir });
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    vi.restoreAllMocks();
  });

  function createTestZip(name = 'test-plugin') {
    const zip = new AdmZip();
    zip.addFile(
      'plugin.json',
      Buffer.from(
        JSON.stringify({
          name,
          version: '1.0.0',
          description: 'A test plugin for route tests',
          backend: true
        })
      )
    );
    zip.addFile(
      'backend/src/index.js',
      Buffer.from('export function init(app, registry) {}\n')
    );
    zip.addFile(
      'dist/bundle.esm.js',
      Buffer.from('console.log("dist bundle");\n')
    );

    const zipPath = path.join(tempDir, `${name}.zip`);
    zip.writeZip(zipPath);
    return { zip, zipPath };
  }

  it('rejects installation when user lacks super-admin role', async () => {
    const res = await request(app)
      .post('/api/v1/plugins/install')
      .set('x-test-role', 'user')
      .send({ packageUrl: 'https://example.com/plugin.zip' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('installs a plugin successfully via multipart/form-data zip upload', async () => {
    const { zipPath } = createTestZip('upload-success-plugin');

    const res = await request(app)
      .post('/api/v1/plugins/install')
      .attach('file', zipPath);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.plugin.name).toBe('upload-success-plugin');
  });

  it('rejects non-zip file uploads with 400 Bad Request', async () => {
    const badFilePath = path.join(tempDir, 'invalid.txt');
    fs.writeFileSync(badFilePath, 'not a zip');

    const res = await request(app)
      .post('/api/v1/plugins/install')
      .attach('file', badFilePath);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Only .zip archive files are allowed');
  });

  it('installs a plugin via JSON packageUrl payload', async () => {
    const { zip } = createTestZip('url-plugin');
    const zipBuffer = zip.toBuffer();

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: async () =>
        zipBuffer.buffer.slice(
          zipBuffer.byteOffset,
          zipBuffer.byteOffset + zipBuffer.byteLength
        )
    });

    const res = await request(app)
      .post('/api/v1/plugins/install')
      .send({ packageUrl: 'https://github.com/example/url-plugin.zip' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.plugin.name).toBe('url-plugin');
  });

  it('rejects request with 400 when neither file nor packageUrl is provided', async () => {
    const res = await request(app).post('/api/v1/plugins/install').send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain(
      'Either a plugin .zip file or packageUrl must be provided'
    );
  });

  it('rejects malicious zip upload containing path traversal with 400 Bad Request', async () => {
    const zip = new AdmZip();
    zip.addFile('normal.txt', Buffer.from('hello'));
    zip.getEntries()[0].entryName = '../../evil.txt';
    zip.addFile(
      'plugin.json',
      Buffer.from(JSON.stringify({ name: 'evil-plugin', version: '1.0.0' }))
    );
    const evilZipPath = path.join(tempDir, 'evil.zip');
    zip.writeZip(evilZipPath);

    const res = await request(app)
      .post('/api/v1/plugins/install')
      .attach('file', evilZipPath);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Zip Slip');
  });
});
