import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestContext, RequestContextManager } from './request-context.js';

describe('RequestContext (AsyncLocalStorage & Request-Scoped Cache)', () => {
  beforeEach(() => {
    if (RequestContext.isActive()) {
      RequestContext.clear();
    }
  });

  it('reports inactive when outside RequestContext.run', () => {
    expect(RequestContext.isActive()).toBe(false);
    expect(RequestContext.getStore()).toBeUndefined();
    expect(RequestContext.get('anyKey')).toBeUndefined();
    expect(RequestContext.has('anyKey')).toBe(false);
    expect(RequestContext.delete('anyKey')).toBe(false);

    const customManager = new RequestContextManager();
    expect(customManager.isActive()).toBe(false);
  });

  it('runs within active context and provides basic get/set/has/delete/clear operations', async () => {
    const store = new Map();

    await RequestContext.run(store, async () => {
      expect(RequestContext.isActive()).toBe(true);
      expect(RequestContext.getStore()).toBe(store);

      RequestContext.set('user', { id: 'user-1' });
      expect(RequestContext.has('user')).toBe(true);
      expect(RequestContext.get('user')).toEqual({ id: 'user-1' });

      RequestContext.delete('user');
      expect(RequestContext.has('user')).toBe(false);
      expect(RequestContext.get('user')).toBeUndefined();

      RequestContext.set('a', 1);
      RequestContext.set('b', 2);
      expect(RequestContext.has('a')).toBe(true);
      RequestContext.clear();
      expect(RequestContext.has('a')).toBe(false);
      expect(RequestContext.has('b')).toBe(false);
    });

    expect(RequestContext.isActive()).toBe(false);
  });

  it('isolates cache between concurrent asynchronous executions (no cross-request pollution)', async () => {
    const req1Store = new Map();
    const req2Store = new Map();

    const task1 = RequestContext.run(req1Store, async () => {
      RequestContext.set('reqId', 'req-111');
      await new Promise((r) => setTimeout(r, 15));
      expect(RequestContext.get('reqId')).toBe('req-111');
      return RequestContext.get('reqId');
    });

    const task2 = RequestContext.run(req2Store, async () => {
      RequestContext.set('reqId', 'req-222');
      await new Promise((r) => setTimeout(r, 10));
      expect(RequestContext.get('reqId')).toBe('req-222');
      return RequestContext.get('reqId');
    });

    const [res1, res2] = await Promise.all([task1, task2]);
    expect(res1).toBe('req-111');
    expect(res2).toBe('req-222');
  });

  describe('computeIfAbsent', () => {
    it('calls producer function on cache miss and memoizes result', async () => {
      const producer = vi
        .fn()
        .mockResolvedValue({ id: 'doc-123', name: 'Test' });

      await RequestContext.run(new Map(), async () => {
        const first = await RequestContext.computeIfAbsent('doc:123', producer);
        expect(first).toEqual({ id: 'doc-123', name: 'Test' });
        expect(producer).toHaveBeenCalledTimes(1);

        const second = await RequestContext.computeIfAbsent(
          'doc:123',
          producer
        );
        expect(second).toEqual({ id: 'doc-123', name: 'Test' });
        expect(producer).toHaveBeenCalledTimes(1); // Cached! Not called again
      });
    });

    it('falls back gracefully to executing producer when context is inactive', async () => {
      const producer = vi.fn().mockResolvedValue('computed-value');

      const result = await RequestContext.computeIfAbsent('key', producer);
      expect(result).toBe('computed-value');
      expect(producer).toHaveBeenCalledTimes(1);
    });

    it('supports custom plain object stores', async () => {
      const customStore = {};
      const producer = vi.fn().mockResolvedValue(42);

      await RequestContext.run(customStore, async () => {
        const val1 = await RequestContext.computeIfAbsent('answer', producer);
        expect(val1).toBe(42);
        expect(customStore.answer).toBe(42);

        const val2 = await RequestContext.computeIfAbsent('answer', producer);
        expect(val2).toBe(42);
        expect(producer).toHaveBeenCalledTimes(1);
      });
    });
  });
});
