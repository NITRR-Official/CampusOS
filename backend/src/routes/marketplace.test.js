import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { registerMarketplaceRoutes } from './marketplace.routes.js';
import { DEFAULT_MARKETPLACE_CATALOG } from '../services/marketplace.service.js';

describe('Marketplace API (Issue #165)', () => {
  let app;
  let mockInstaller;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockInstaller = {
      installPluginPackage: vi.fn().mockResolvedValue({
        success: true,
        statusCode: 201,
        message: 'Installed test plugin',
        plugin: { name: 'hackathon-portal', version: '2.0.1' }
      })
    };

    const mockRegistry = {
      getService: (name) => {
        if (name === 'core:plugin_installer') return mockInstaller;
        return null;
      }
    };

    const mockRequireSuperAdmin = (req, res, next) => {
      if (req.headers['x-role'] !== 'super-admin') {
        return res
          .status(403)
          .json({ success: false, error: 'Super-admin role required' });
      }
      req.user = { role: 'super-admin' };
      next();
    };

    registerMarketplaceRoutes(app, {
      registry: mockRegistry,
      requireSuperAdmin: mockRequireSuperAdmin
    });
  });

  describe('GET /api/v1/marketplace/plugins', () => {
    it('returns the list of marketplace plugins', async () => {
      const res = await request(app).get('/api/v1/marketplace/plugins');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(DEFAULT_MARKETPLACE_CATALOG.length);
      expect(Array.isArray(res.body.plugins)).toBe(true);
    });

    it('filters plugins by search query', async () => {
      const res = await request(app).get(
        '/api/v1/marketplace/plugins?q=hackathon'
      );

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(1);
      expect(res.body.plugins[0].id).toBe('hackathon-portal');
    });

    it('filters plugins by category', async () => {
      const res = await request(app).get(
        '/api/v1/marketplace/plugins?category=Utilities'
      );

      expect(res.status).toBe(200);
      expect(res.body.plugins.length).toBeGreaterThan(0);
      expect(res.body.plugins.every((p) => p.category === 'Utilities')).toBe(
        true
      );
    });
  });

  describe('GET /api/v1/marketplace/plugins/:id', () => {
    it('returns details for a specific plugin', async () => {
      const res = await request(app).get(
        '/api/v1/marketplace/plugins/alumni-tracker'
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plugin.name).toBe('Alumni Network');
      expect(res.body.plugin.capabilities).toContain('db:rw');
    });

    it('returns 404 for an unknown plugin id', async () => {
      const res = await request(app).get(
        '/api/v1/marketplace/plugins/unknown-plugin'
      );

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/marketplace/install/:id', () => {
    it('rejects installation when user lacks super-admin role', async () => {
      const res = await request(app)
        .post('/api/v1/marketplace/install/hackathon-portal')
        .set('x-role', 'student');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(mockInstaller.installPluginPackage).not.toHaveBeenCalled();
    });

    it('installs plugin from catalog when authorized as super-admin', async () => {
      const res = await request(app)
        .post('/api/v1/marketplace/install/hackathon-portal')
        .set('x-role', 'super-admin')
        .send({ force: true });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockInstaller.installPluginPackage).toHaveBeenCalledWith(
        expect.objectContaining({
          packageUrl: expect.stringContaining('hackathon-portal.zip'),
          force: true
        })
      );
    });

    it('returns 404 when attempting to install non-existent plugin', async () => {
      const res = await request(app)
        .post('/api/v1/marketplace/install/ghost-plugin')
        .set('x-role', 'super-admin');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
