import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  connectDB,
  disconnectDB
} from '@campusos/backend-core/database/connection.js';
import { Plugin } from '@campusos/backend-core/database/schemas/plugin.schema.js';
import { PluginService, initPluginService } from './plugin.service.js';

describe('PluginService', () => {
  let service;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
  }, 120000);

  afterAll(async () => {
    await disconnectDB();
    if (mongoServer) await mongoServer.stop();
  }, 120000);

  beforeEach(async () => {
    await Plugin.deleteMany({});

    // Mock registry
    const mockRegistry = {
      getService: (name) => {
        if (name === 'core:models') {
          return { Plugin };
        }
        return null;
      },
      getSettingsConfig: (name) => ({})
    };

    initPluginService(mockRegistry);
    service = new PluginService();
  });

  describe('getPlugins', () => {
    it('should list all plugins', async () => {
      await Plugin.create({ name: 'pluginA', enabled: true, version: '1.0.0' });
      await Plugin.create({
        name: 'pluginB',
        enabled: false,
        version: '2.0.0'
      });

      const result = await service.getPlugins();
      expect(result.success).toBe(true);
      expect(result.plugins).toHaveLength(2);
      expect(result.plugins.find((p) => p.name === 'pluginA').enabled).toBe(
        true
      );
      expect(result.plugins.find((p) => p.name === 'pluginB').enabled).toBe(
        false
      );
    });
  });

  describe('togglePlugin', () => {
    it('should toggle a plugin status', async () => {
      await Plugin.create({ name: 'pluginA', enabled: true, version: '1.0.0' });

      const result = await service.togglePlugin('pluginA', false);
      expect(result.success).toBe(true);
      expect(result.message).toContain('disabled');

      const updated = await Plugin.findOne({ name: 'pluginA' });
      expect(updated.enabled).toBe(false);
    });

    it('should fail if plugin does not exist', async () => {
      const result = await service.togglePlugin('missing', true);
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('restartServer', () => {
    it('should trigger server restart', () => {
      vi.useFakeTimers();
      const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => {});

      const result = service.restartServer();
      expect(result.success).toBe(true);
      expect(result.message).toContain('restarting');

      vi.advanceTimersByTime(1500);
      expect(killSpy).toHaveBeenCalledWith(process.pid, 'SIGTERM');

      killSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});
