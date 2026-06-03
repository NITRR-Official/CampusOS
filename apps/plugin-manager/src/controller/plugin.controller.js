import { PluginService } from '../service/plugin.service.js';

const service = new PluginService();

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
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled must be a boolean' });
    }

    const result = await service.togglePlugin(name, enabled);
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
