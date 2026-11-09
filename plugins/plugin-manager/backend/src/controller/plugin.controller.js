import { PluginService } from '../service/plugin.service.js';
import {
  togglePluginSchema,
  updateSettingsSchema
} from '../schema/plugin.schema.js';

let service = new PluginService();

export function setPluginsDir(dir) {
  service.setPluginsDir(dir);
}

export async function getPlugins(req, res, next) {
  try {
    const result = await service.getPlugins();
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function togglePlugin(req, res, next) {
  try {
    const { name } = req.params;
    const { enabled } = togglePluginSchema.parse(req.body);

    const result = await service.togglePlugin(name, enabled);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const { name } = req.params;
    const { settings } = updateSettingsSchema.parse(req.body);

    const result = await service.updateSettings(name, settings);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function restartServer(req, res, next) {
  try {
    const result = service.restartServer();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function installPlugin(req, res, next) {
  try {
    const file = req.file;
    const { packageUrl, url, githubUrl, force, overwrite } = req.body || {};
    const targetUrl = packageUrl || url || githubUrl;

    if (!file && !targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'Either a plugin .zip file or packageUrl must be provided'
      });
    }

    const isForce =
      force === true ||
      force === 'true' ||
      overwrite === true ||
      overwrite === 'true';

    const result = await service.installPlugin({
      file,
      packageUrl: targetUrl,
      force: isForce
    });

    if (!result.success) {
      return res.status(result.statusCode || 400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
