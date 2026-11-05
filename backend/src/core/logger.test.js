import { describe, it, expect, vi } from 'vitest';
import { Logger, rootLogger } from './logger.js';
import { loggerMiddleware } from '../middleware/logger.js';

describe('Central Scoped Logger & Plugin-Level Logging (Issue #117)', () => {
  describe('Logger class', () => {
    it('should format logs with standard fields (timestamp, level, message, context)', () => {
      const logs = [];
      const logger = new Logger({
        context: { service: 'core-test' },
        level: 'debug',
        outputFn: (entry) => logs.push(entry)
      });

      logger.info('System initialized', { port: 3000 });

      expect(logs).toHaveLength(1);
      const entry = logs[0];
      expect(entry.level).toBe('info');
      expect(entry.message).toBe('System initialized');
      expect(entry.service).toBe('core-test');
      expect(entry.port).toBe(3000);
      expect(entry.timestamp).toBeDefined();
      expect(new Date(entry.timestamp).toISOString()).toBe(entry.timestamp);
    });

    it('should filter log messages based on configured log level', () => {
      const logs = [];
      const logger = new Logger({
        level: 'warn',
        outputFn: (entry) => logs.push(entry)
      });

      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');

      expect(logs).toHaveLength(2);
      expect(logs[0].level).toBe('warn');
      expect(logs[0].message).toBe('Warning message');
      expect(logs[1].level).toBe('error');
      expect(logs[1].message).toBe('Error message');
    });

    it('should allow dynamically updating the log level via setLevel()', () => {
      const logs = [];
      const logger = new Logger({
        level: 'error',
        outputFn: (entry) => logs.push(entry)
      });

      logger.info('Ignored info');
      expect(logs).toHaveLength(0);

      logger.setLevel('info');
      logger.info('Recorded info');
      expect(logs).toHaveLength(1);
      expect(logs[0].message).toBe('Recorded info');
    });

    it('should create scoped child loggers with inherited and extended context', () => {
      const logs = [];
      const parent = new Logger({
        context: { app: 'campus-os', environment: 'test' },
        level: 'debug',
        outputFn: (entry) => logs.push(entry)
      });

      const pluginLogger = parent.child({ plugin: 'recruitment' });
      const requestLogger = pluginLogger.child({ requestId: 'REQ-123' });

      requestLogger.info('Candidate application submitted', {
        candidateId: 'c-456'
      });

      expect(logs).toHaveLength(1);
      const entry = logs[0];
      expect(entry.app).toBe('campus-os');
      expect(entry.environment).toBe('test');
      expect(entry.plugin).toBe('recruitment');
      expect(entry.requestId).toBe('REQ-123');
      expect(entry.candidateId).toBe('c-456');
      expect(entry.message).toBe('Candidate application submitted');
    });

    it('should properly serialize Error objects in error logs', () => {
      const logs = [];
      const logger = new Logger({
        outputFn: (entry) => logs.push(entry)
      });

      const testError = new Error('Database connection failed');
      testError.code = 'ECONNREFUSED';
      testError.statusCode = 503;

      logger.error('Failed to connect to primary DB', testError);

      expect(logs).toHaveLength(1);
      const entry = logs[0];
      expect(entry.level).toBe('error');
      expect(entry.message).toBe('Failed to connect to primary DB');
      expect(entry.error).toBeDefined();
      expect(entry.error.name).toBe('Error');
      expect(entry.error.message).toBe('Database connection failed');
      expect(entry.error.code).toBe('ECONNREFUSED');
      expect(entry.error.statusCode).toBe(503);
      expect(entry.error.stack).toBeDefined();
    });

    it('should properly serialize error property inside a metadata object', () => {
      const logs = [];
      const logger = new Logger({
        outputFn: (entry) => logs.push(entry)
      });

      const testError = new Error('Token expired');
      logger.error('Auth verification failed', {
        error: testError,
        tokenPrefix: 'ey...'
      });

      expect(logs).toHaveLength(1);
      const entry = logs[0];
      expect(entry.error.message).toBe('Token expired');
      expect(entry.tokenPrefix).toBe('ey...');
    });
  });

  describe('loggerMiddleware', () => {
    it('should attach unique requestId and scoped req.logger to the request', () => {
      const req = {
        headers: {},
        method: 'GET',
        path: '/api/v1/clubs',
        ip: '127.0.0.1'
      };
      const res = {
        statusCode: 200,
        on: vi.fn()
      };
      const next = vi.fn();

      loggerMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.id).toMatch(/^REQ-\d+-[a-z0-9]+$/);
      expect(req.logger).toBeInstanceOf(Logger);
      expect(req.logger.context.requestId).toBe(req.id);
    });

    it('should respect x-request-id header when supplied', () => {
      const req = {
        headers: { 'x-request-id': 'custom-req-id-999' },
        method: 'POST',
        path: '/api/v1/auth/login'
      };
      const res = {
        statusCode: 200,
        on: vi.fn()
      };
      const next = vi.fn();

      loggerMiddleware(req, res, next);

      expect(req.id).toBe('custom-req-id-999');
      expect(req.logger.context.requestId).toBe('custom-req-id-999');
    });

    it('should emit structured log on res finish event', () => {
      const callbacks = {};
      const req = {
        headers: { 'x-request-id': 'req-finish-test' },
        method: 'GET',
        path: '/api/v1/events',
        ip: '192.168.1.1',
        user: { id: 'usr-123' }
      };
      const res = {
        statusCode: 200,
        on: vi.fn((event, cb) => {
          callbacks[event] = cb;
        })
      };
      const next = vi.fn();

      loggerMiddleware(req, res, next);

      const logs = [];
      req.logger = req.logger.child({});
      // Intercept output
      const originalInfo = req.logger.info;
      req.logger.info = vi.fn((msg, meta) => {
        logs.push({ msg, meta });
        originalInfo.call(req.logger, msg, meta);
      });

      expect(callbacks['finish']).toBeDefined();
      callbacks['finish']();

      expect(logs).toHaveLength(1);
      expect(logs[0].msg).toContain('HTTP GET /api/v1/events 200');
      expect(logs[0].meta.userId).toBe('usr-123');
      expect(logs[0].meta.ip).toBe('192.168.1.1');
    });
  });

  describe('rootLogger export', () => {
    it('should have system: campus-os default context', () => {
      expect(rootLogger).toBeInstanceOf(Logger);
      expect(rootLogger.context.system).toBe('campus-os');
    });
  });
});
