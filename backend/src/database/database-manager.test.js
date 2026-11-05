import { describe, it, expect, beforeEach } from 'vitest';
import { DatabaseAdapter } from './adapters/base.adapter.js';
import { MongoAdapter } from './adapters/mongo.adapter.js';
import { SqlAdapter } from './adapters/sql.adapter.js';
import { DatabaseManager } from './database-manager.js';
import {
  connectDB,
  disconnectDB,
  healthCheck,
  isDBConnected,
  databaseManager
} from './connection.js';

describe('Database Architecture & Polyglot Adapter System', () => {
  describe('Base DatabaseAdapter Contract', () => {
    it('throws error when attempting to instantiate DatabaseAdapter directly', () => {
      expect(() => new DatabaseAdapter('test')).toThrow(
        /Cannot construct DatabaseAdapter instances directly/
      );
    });

    it('throws error when derived adapter does not implement abstract methods', async () => {
      class IncompleteAdapter extends DatabaseAdapter {
        constructor() {
          super('incomplete');
        }
      }

      const adapter = new IncompleteAdapter();
      await expect(adapter.connect()).rejects.toThrow(
        /Method connect\(\) must be implemented/
      );
      await expect(adapter.disconnect()).rejects.toThrow(
        /Method disconnect\(\) must be implemented/
      );
      expect(() => adapter.isConnected()).toThrow(
        /Method isConnected\(\) must be implemented/
      );
      await expect(adapter.healthCheck()).rejects.toThrow(
        /Method healthCheck\(\) must be implemented/
      );
      expect(() => adapter.getClient()).toThrow(
        /Method getClient\(\) must be implemented/
      );
    });
  });

  describe('MongoAdapter', () => {
    let mongoAdapter;

    beforeEach(() => {
      mongoAdapter = new MongoAdapter();
    });

    it('implements the DatabaseAdapter contract with name mongodb', () => {
      expect(mongoAdapter).toBeInstanceOf(DatabaseAdapter);
      expect(mongoAdapter.name).toBe('mongodb');
    });

    it('returns mongoose client via getClient()', () => {
      const client = mongoAdapter.getClient();
      expect(client).toBeDefined();
      expect(typeof client.connect).toBe('function');
    });

    it('reports health check status correctly', async () => {
      const health = await mongoAdapter.healthCheck();
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('latencyMs');
    });
  });

  describe('SqlAdapter', () => {
    let sqlAdapter;

    beforeEach(() => {
      sqlAdapter = new SqlAdapter();
    });

    it('implements the DatabaseAdapter contract with name sql', () => {
      expect(sqlAdapter).toBeInstanceOf(DatabaseAdapter);
      expect(sqlAdapter.name).toBe('sql');
    });

    it('reports disabled gracefully when no SQL connection string is configured', async () => {
      expect(sqlAdapter.isConnected()).toBe(false);
      const health = await sqlAdapter.healthCheck();
      expect(health.healthy).toBe(true);
      expect(health.status).toBe('disabled');
    });
  });

  describe('DatabaseManager', () => {
    let manager;

    beforeEach(() => {
      manager = new DatabaseManager();
    });

    it('initializes with default mongo and sql adapters', () => {
      expect(manager.getAdapter('mongo')).toBeDefined();
      expect(manager.getAdapter('sql')).toBeDefined();
    });

    it('allows registering and retrieving custom adapters', () => {
      class MockAdapter extends DatabaseAdapter {
        constructor() {
          super('mock');
        }
        isConnected() {
          return true;
        }
        async healthCheck() {
          return { healthy: true, status: 'mocked' };
        }
      }

      manager.registerAdapter('mock', new MockAdapter());
      const retrieved = manager.getAdapter('mock');
      expect(retrieved).toBeDefined();
      expect(retrieved.isConnected()).toBe(true);
    });

    it('aggregates health check across all registered adapters', async () => {
      const health = await manager.getHealth();
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('databases');
      expect(health.databases).toHaveProperty('mongo');
      expect(health.databases).toHaveProperty('sql');
      expect(health).toHaveProperty('timestamp');
    });

    it('registers db:mongo, db:sql, and db:manager into ModuleRegistry', () => {
      const registered = new Map();
      const mockRegistry = {
        registerService(name, service) {
          registered.set(name, service);
        }
      };

      manager.registerServices(mockRegistry);
      expect(registered.has('db:mongo')).toBe(true);
      expect(registered.has('db:sql')).toBe(true);
      expect(registered.has('db:manager')).toBe(true);
    });
  });

  describe('Backward-Compatible connection.js Facade', () => {
    it('exports all expected lifecycle and status functions', () => {
      expect(typeof connectDB).toBe('function');
      expect(typeof disconnectDB).toBe('function');
      expect(typeof healthCheck).toBe('function');
      expect(typeof isDBConnected).toBe('function');
      expect(databaseManager).toBeDefined();
    });

    it('delegates healthCheck and returns aggregated status', async () => {
      const health = await healthCheck();
      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('databases');
    });

    it('delegates isDBConnected properly', () => {
      const connected = isDBConnected();
      expect(typeof connected).toBe('boolean');
    });
  });
});
