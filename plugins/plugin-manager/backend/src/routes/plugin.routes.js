import { Router } from 'express';
import * as controller from '../controller/plugin.controller.js';

export function registerPluginRoutes(app, requireRoles) {
  const router = Router();

  // All plugin manager routes require super-admin
  router.use(requireRoles('super-admin'));

  router.get('/', controller.getPlugins);
  router.put('/:name/toggle', controller.togglePlugin);
  router.post('/restart', controller.restartServer);

  app.use('/api/v1/plugins', router);
}
