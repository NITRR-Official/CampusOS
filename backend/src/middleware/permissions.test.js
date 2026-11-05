import { describe, it, expect, beforeEach, vi } from 'vitest';
import { requirePermissions, requireSuperAdmin } from './permissions.js';
import registry from '../utils/registry.js';

describe('Permissions Middleware (Decoupled RBAC)', () => {
  beforeEach(() => {
    // Reset registry in test environment
    registry.reset();
  });

  describe('requirePermissions', () => {
    it('returns 401 if req.user is missing', async () => {
      const guard = requirePermissions('event:manage');
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('bypasses permission check for super admin', async () => {
      const guard = requirePermissions('event:manage');
      const req = {
        user: { id: 'admin-1', isSuperAdmin: true }
      };
      const res = {};
      const next = vi.fn();

      await guard(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('resolves explicit req.resolvedContext and grants access when permission matches', async () => {
      const mockService = {
        getUserPermissions: vi.fn().mockResolvedValue(['event:manage'])
      };
      registry.registerService('custom:service', mockService);

      const guard = requirePermissions('event:manage');
      const req = {
        user: { id: 'user-1' },
        resolvedContext: { type: 'custom:service', id: 'entity-123' }
      };
      const res = {};
      const next = vi.fn();

      await guard(req, res, next);

      expect(mockService.getUserPermissions).toHaveBeenCalledWith(
        'user-1',
        'entity-123'
      );
      expect(next).toHaveBeenCalled();
    });

    it('resolves context dynamically via registered registry.resolveContext', async () => {
      const mockMemberService = {
        getUserPermissions: vi.fn().mockResolvedValue(['club:manage'])
      };
      registry.registerService('club:member_service', mockMemberService);

      registry.registerContextResolver('/api/v1/clubs', async (req) => {
        return { type: 'club:member_service', id: req.params.clubId };
      });

      const guard = requirePermissions('club:manage');
      const req = {
        path: '/api/v1/clubs/club-abc/members',
        params: { clubId: 'club-abc' },
        user: { id: 'user-2' }
      };
      const res = {};
      const next = vi.fn();

      await guard(req, res, next);

      expect(mockMemberService.getUserPermissions).toHaveBeenCalledWith(
        'user-2',
        'club-abc'
      );
      expect(next).toHaveBeenCalled();
    });

    it('grants access if user has administrator permission in context', async () => {
      const mockService = {
        getUserPermissions: vi.fn().mockResolvedValue(['administrator'])
      };
      registry.registerService('hostel:service', mockService);

      const guard = requirePermissions('room:assign');
      const req = {
        user: { id: 'user-3' },
        resolvedContext: { type: 'hostel:service', id: 'hostel-1' }
      };
      const res = {};
      const next = vi.fn();

      await guard(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 403 Forbidden if user lacks required permission', async () => {
      const mockService = {
        getUserPermissions: vi.fn().mockResolvedValue(['event:view'])
      };
      registry.registerService('custom:service', mockService);

      const guard = requirePermissions('event:manage');
      const req = {
        user: { id: 'user-4' },
        resolvedContext: { type: 'custom:service', id: 'entity-1' }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Forbidden' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 500 if context service is not registered in registry', async () => {
      const guard = requirePermissions('event:manage');
      const req = {
        user: { id: 'user-5' },
        resolvedContext: { type: 'missing:service', id: 'entity-2' }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await guard(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('does NOT hardcode club context fallback when no resolver matches', async () => {
      const guard = requirePermissions('club:manage');
      // Request has params.clubId, but path does not match any registered resolver!
      const req = {
        path: '/api/v1/unregistered/route',
        params: { clubId: 'club-test' },
        user: { id: 'user-6' }
      };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await guard(req, res, next);

      // Without a matching context resolver, it should deny access (403), proving no hardcoded fallback exists
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('passes through if allowedPermissions is empty and authenticated', async () => {
      const guard = requirePermissions();
      const req = {
        path: '/api/v1/profile',
        user: { id: 'user-7' }
      };
      const res = {};
      const next = vi.fn();

      await guard(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireSuperAdmin', () => {
    it('returns 401 if user is missing', async () => {
      const req = {};
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await requireSuperAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('returns 403 if user is not super admin', async () => {
      const req = { user: { id: 'u1', isSuperAdmin: false } };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await requireSuperAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('calls next if user is super admin', async () => {
      const req = { user: { id: 'u2', isSuperAdmin: true } };
      const res = {};
      const next = vi.fn();

      await requireSuperAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
