/**
 * CampusOS Community Marketplace Routes (Issue #165)
 * Exposes catalog discovery and 1-click installation endpoints.
 */

import { Router } from 'express';
import { MarketplaceService } from '../services/marketplace.service.js';

export function registerMarketplaceRoutes(app, options = {}) {
  const router = Router();
  const service = new MarketplaceService({
    registry: options.registry,
    catalogUrl: options.catalogUrl
  });

  const requireSuperAdmin =
    options.requireSuperAdmin ||
    options.registry?.getService('requireSuperAdmin', false) ||
    ((req, res, next) => {
      if (req.user?.role !== 'super-admin') {
        return res.status(403).json({
          success: false,
          error: 'Super-admin role required'
        });
      }
      next();
    });

  /**
   * GET /api/v1/marketplace/plugins
   * Public endpoint to browse the verified community catalog.
   */
  router.get('/plugins', async (req, res, next) => {
    try {
      const { q, category, refresh } = req.query;
      const result = await service.getCatalog({
        q: typeof q === 'string' ? q : undefined,
        category: typeof category === 'string' ? category : undefined,
        forceRefresh: refresh === 'true'
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * GET /api/v1/marketplace/plugins/:id
   * Public endpoint to fetch details of a specific plugin.
   */
  router.get('/plugins/:id', async (req, res, next) => {
    try {
      const result = await service.getPluginById(req.params.id);
      if (!result.success) {
        return res.status(404).json(result);
      }
      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  /**
   * POST /api/v1/marketplace/install/:id
   * Admin-only endpoint to install a plugin directly from the catalog.
   */
  router.post('/install/:id', requireSuperAdmin, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { force } = req.body || {};

      const result = await service.installPlugin(id, {
        force: force === true || force === 'true'
      });

      if (!result.success) {
        return res.status(result.statusCode || 400).json(result);
      }

      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  });

  app.use('/api/v1/marketplace', router);
  return router;
}

export default registerMarketplaceRoutes;
