import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampusEventBus } from './event-bus.js';

describe('CampusEventBus', () => {
  let bus;

  beforeEach(() => {
    bus = new CampusEventBus();
  });

  describe('Basic Subscription and Emission', () => {
    it('executes synchronous listeners when an event is emitted', async () => {
      let received = null;
      bus.on('test:event', (payload) => {
        received = payload;
      });

      bus.emit('test:event', { message: 'hello' });

      // Wait for setImmediate to resolve
      await new Promise((resolve) => setImmediate(resolve));
      expect(received).toEqual({ message: 'hello' });
    });

    it('executes async listeners when an event is emitted', async () => {
      let received = null;
      bus.on('test:async', async (payload) => {
        await new Promise((res) => setTimeout(res, 10));
        received = payload;
      });

      bus.emit('test:async', { status: 'ok' });

      await new Promise((res) => setTimeout(res, 30));
      expect(received).toEqual({ status: 'ok' });
    });

    it('executes once listeners only on the first emission', async () => {
      let count = 0;
      bus.once('test:once', () => {
        count++;
      });

      await bus.emitAsync('test:once', {});
      await bus.emitAsync('test:once', {});

      expect(count).toBe(1);
    });

    it('unsubscribes listeners using off()', async () => {
      let count = 0;
      const listener = () => count++;

      bus.on('test:off', listener);
      expect(bus.listenerCount('test:off')).toBe(1);

      await bus.emitAsync('test:off', {});
      expect(count).toBe(1);

      bus.off('test:off', listener);
      expect(bus.listenerCount('test:off')).toBe(0);

      await bus.emitAsync('test:off', {});
      expect(count).toBe(1);
    });

    it('removes all listeners using removeAllListeners()', () => {
      bus.on('event:1', () => {});
      bus.on('event:1', () => {});
      bus.on('event:2', () => {});

      expect(bus.listenerCount('event:1')).toBe(2);
      expect(bus.listenerCount('event:2')).toBe(1);

      bus.removeAllListeners('event:1');
      expect(bus.listenerCount('event:1')).toBe(0);
      expect(bus.listenerCount('event:2')).toBe(1);

      bus.removeAllListeners();
      expect(bus.listenerCount('event:2')).toBe(0);
    });
  });

  describe('Error Isolation & Unhandled Rejection Prevention', () => {
    it('isolates errors so a failing sync listener does not prevent other listeners from running', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      let secondListenerRan = false;

      bus.on('test:error_isolation', () => {
        throw new Error('Sync error in listener 1');
      });

      bus.on('test:error_isolation', () => {
        secondListenerRan = true;
      });

      const { success, errors } = await bus.emitAsync(
        'test:error_isolation',
        {}
      );

      expect(secondListenerRan).toBe(true);
      expect(success).toBe(false);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Sync error in listener 1');

      consoleErrorSpy.mockRestore();
    });

    it('catches async listener rejections without triggering unhandledRejection', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let unhandledTriggered = false;

      const unhandledHandler = () => {
        unhandledTriggered = true;
      };
      process.on('unhandledRejection', unhandledHandler);

      bus.on('test:async_rejection', async () => {
        await new Promise((res) => setTimeout(res, 5));
        throw new Error('Async rejection in listener');
      });

      bus.emit('test:async_rejection', { test: true });

      // Wait for setImmediate and async execution
      await new Promise((res) => setTimeout(res, 50));

      process.removeListener('unhandledRejection', unhandledHandler);
      consoleErrorSpy.mockRestore();

      expect(unhandledTriggered).toBe(false);
    });

    it('invokes onError hook when a listener fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let errorReport = null;

      const unsubscribe = bus.onError((errInfo) => {
        errorReport = errInfo;
      });

      bus.on('test:hook', async () => {
        throw new Error('Hook test failure');
      });

      await bus.emitAsync('test:hook', { foo: 'bar' });

      expect(errorReport).not.toBeNull();
      expect(errorReport.eventName).toBe('test:hook');
      expect(errorReport.error.message).toBe('Hook test failure');
      expect(errorReport.payload).toEqual({ foo: 'bar' });
      expect(errorReport.timestamp).toBeDefined();

      // Test unsubscribe
      errorReport = null;
      unsubscribe();
      await bus.emitAsync('test:hook', { foo: 'bar' });
      expect(errorReport).toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Payload Immutability (The Reference Trap)', () => {
    it('deeply clones the payload to prevent listeners from mutating the original object', async () => {
      const originalPayload = {
        clubId: 'club-123',
        meta: { tags: ['tech', 'robotics'] }
      };

      bus.on('test:mutate', (payload) => {
        payload.clubId = 'mutated';
        payload.meta.tags.push('hacked');
      });

      await bus.emitAsync('test:mutate', originalPayload);

      expect(originalPayload.clubId).toBe('club-123');
      expect(originalPayload.meta.tags).toEqual(['tech', 'robotics']);
    });
  });

  describe('Awaitable emitAsync()', () => {
    it('returns success: true and allSettled results when all listeners succeed', async () => {
      bus.on('test:async_success', async (payload) => {
        return `Hello ${payload.name}`;
      });

      const { success, results, errors } = await bus.emitAsync(
        'test:async_success',
        { name: 'CampusOS' }
      );

      expect(success).toBe(true);
      expect(errors).toHaveLength(0);
      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('fulfilled');
      expect(results[0].value).toBe('Hello CampusOS');
    });

    it('returns empty array when no listeners are registered', async () => {
      const { success, results, errors } = await bus.emitAsync('empty:event', {
        id: 1
      });

      expect(success).toBe(true);
      expect(results).toHaveLength(0);
      expect(errors).toHaveLength(0);
    });
  });
});
