import { Router } from 'express';
import os from 'os';
import path from 'path';
import multer from 'multer';
import * as controller from '../controller/plugin.controller.js';

export function registerPluginRoutes(app, requireRoles, options = {}) {
  const router = Router();

  if (options.pluginsDir) {
    controller.setPluginsDir(options.pluginsDir);
  }

  // All plugin manager routes require super-admin
  router.use(requireRoles('super-admin'));

  const uploadDir = path.join(os.tmpdir(), 'campusos-uploads');
  const upload = multer({
    dest: uploadDir,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB max file size
    },
    fileFilter: (req, file, cb) => {
      if (
        file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.mimetype === 'application/octet-stream' ||
        file.originalname.toLowerCase().endsWith('.zip')
      ) {
        cb(null, true);
      } else {
        cb(
          new Error(
            'Only .zip archive files are allowed for plugin installation'
          )
        );
      }
    }
  });

  // Safe wrapper for multer to catch and return 400 for upload errors
  const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  };

  router.get('/', controller.getPlugins);
  router.put('/:name/toggle', controller.togglePlugin);
  router.patch('/:name/settings', controller.updateSettings);
  router.post('/restart', controller.restartServer);
  router.post('/install', handleUpload, controller.installPlugin);

  app.use('/api/v1/plugins', router);
}
