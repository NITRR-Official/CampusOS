/**
 * Express App Configuration
 * Sets up middleware in correct order and mounts routes
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { loggerMiddleware } from './middleware/logger.js';
import { requestContextMiddleware } from './middleware/request-context.middleware.js';
import { RequestContext } from './core/request-context.js';
import { authMiddleware } from './middleware/auth.js';
import {
  requirePermissions,
  requireSuperAdmin
} from './middleware/permissions.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.js';
import { registerJwtAuthenticator } from './auth/jwt-authenticator.js';
import { loadPlugins } from './plugin-loader.js';
import { registerPluginBundleRoutes } from './routes/plugin-bundle.routes.js';
import { User, Plugin } from './database/schemas/index.js';
import { databaseManager, healthCheck } from './database/connection.js';
import { rootLogger } from './core/logger.js';

export async function createApp(registry) {
  const app = express();
  app.disable('x-powered-by');
  app.locals.registry = registry;

  // Register Core Database Services & Models
  databaseManager.registerServices(registry);
  registry.registerService('core:models', { User, Plugin });
  registry.registerService('core:request_context', RequestContext);
  registry.registerService('core:logger', rootLogger);

  // Environment config
  const isDev = process.env.NODE_ENV !== 'production';
  const allowedOrigins = (
    process.env.FRONTEND_URLS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // ============== MIDDLEWARE CHAIN (Order matters!) ==============

  // 0. Request Context (Request-scoped cache & AsyncLocalStorage)
  app.use(requestContextMiddleware);

  // 1. Security Headers
  app.use(helmet());

  // 1. Body parsing
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  // 2. CORS - Allow cross-origin requests from frontend
  app.use(
    cors({
      origin(origin, callback) {
        // Allow requests with no origin (curl, server-to-server)
        if (!origin) {
          callback(null, true);
          return;
        }

        // Exact match against configured origins
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // In non-production, allow Vercel preview URLs (*.vercel.app)
        // This is safe because preview environments use separate databases
        if (isDev || process.env.ALLOW_PREVIEW_CORS === 'true') {
          if (/^https:\/\/campus-os-[\w-]+\.vercel\.app$/.test(origin)) {
            callback(null, true);
            return;
          }
        }

        callback(new Error('CORS policy does not allow this origin'));
      },
      credentials: true
    })
  );

  // 3. Rate Limiting - Global default limiter
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per `window`
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Too many requests, please try again later.'
    }
  });
  app.use('/api', globalLimiter);

  // 4. Logging - Log all requests
  app.use(loggerMiddleware);

  // 5. Health check endpoint (no auth required)
  app.get('/health', async (req, res) => {
    const health = await healthCheck();
    const isHealthy = health?.healthy === true;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: isHealthy ? 'connected' : 'disconnected',
      databases: health?.databases,
      timestamp: new Date().toISOString()
    });
  });

  // Public endpoint for frontend to discover active modules (no auth required)
  app.get('/api/v1/system/modules', (req, res) => {
    const activeModules = registry.getAllModules();
    res.json({ success: true, modules: activeModules });
  });

  // Public endpoint for frontend to discover all registered permissions
  app.get('/api/v1/system/permissions', (req, res) => {
    const permissions = registry.permissions.getAllGrouped();
    res.json({ success: true, permissions });
  });

  // Public endpoints for plugin frontend ESM bundles and manifests (ADR-014)
  registerPluginBundleRoutes(app, { registry });

  // 6. Authentication - Verify JWT before protected routes
  registerJwtAuthenticator(registry);
  registry.registerService('requirePermissions', requirePermissions);
  registry.registerService('requireSuperAdmin', requireSuperAdmin);
  app.use(authMiddleware);

  // Protected endpoint for frontend to fetch aggregated dashboard stats
  app.get('/api/v1/system/stats', async (req, res) => {
    try {
      const providers = registry.getAllStatProviders();
      const statsData = {};

      for (const [pluginId, fetcher] of providers) {
        try {
          statsData[pluginId] = await fetcher(req.user);
        } catch (err) {
          console.error(`Failed to fetch stats for plugin ${pluginId}:`, err);
          statsData[pluginId] = { error: 'Failed to load stats' };
        }
      }

      res.json({ success: true, data: statsData });
    } catch (err) {
      console.error('Failed to aggregate system stats:', err);
      res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
  });

  // ============== PLUGIN LOADING ==============
  // Load all modules from /plugins/ and let them register routes
  try {
    await loadPlugins(app, registry);
  } catch (error) {
    console.error('Plugin loading failed:', error.message);
    if (!isDev) throw error; // Fail hard in production
  }

  // ============== GLOBAL ERROR HANDLING ==============
  // 404 handler - for routes that don't exist
  app.use(notFoundMiddleware);

  // Error handler - catches all errors
  app.use(errorMiddleware);

  return app;
}

export default createApp;
