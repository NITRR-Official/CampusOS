import { PluginService } from '../service/plugin.service.js';
import { togglePluginSchema } from '../schema/plugin.schema.js';

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

export async function restartServer(req, res, next) {
  try {
    const result = service.restartServer();
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
