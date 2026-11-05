import { describe, it, expect } from 'vitest';
import { requestContextMiddleware } from './request-context.middleware.js';
import { RequestContext } from '../core/request-context.js';

describe('requestContextMiddleware', () => {
  it('initializes req.contextCache and activates RequestContext throughout downstream handler', async () => {
    const req = {
      id: 'req-abc-123',
      path: '/api/v1/tasks/123',
      method: 'GET'
    };
    const res = {};

    let executed = false;
    await requestContextMiddleware(req, res, () => {
      executed = true;
      expect(req.contextCache).toBeInstanceOf(Map);
      expect(RequestContext.isActive()).toBe(true);
      expect(RequestContext.getStore()).toBe(req.contextCache);
      expect(req.contextCache.get('req:id')).toBe('req-abc-123');

      // Set value via RequestContext, verify visible on req.contextCache
      RequestContext.set('custom', 'val');
      expect(req.contextCache.get('custom')).toBe('val');
    });

    expect(executed).toBe(true);
    // After request finishes, context is inactive
    expect(RequestContext.isActive()).toBe(false);
  });
});
