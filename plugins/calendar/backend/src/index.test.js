import { vi, describe, it, expect } from 'vitest';

// Mock the requirePermissions dependency
vi.mock('./index.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    init: async function mockInit(app, registry, eventBus) {
      // Avoid the `requirePermissions` check throwing
      global.requirePermissions = vi.fn();
      return actual.init(app, registry, eventBus);
    }
  };
});

import { PermissionRegistry } from '../../../backend/src/core/permission-registry.js';
import { init } from './index.js';

/**
 * Tests for the calendar plugin entry point wiring into the core systems the
 * platform provides: the service registry, the dynamic PermissionRegistry, and
 * the event bus (ADR-008).
 */

function makeRegistry() {
  return {
    permissions: new PermissionRegistry(),
    registerModule: vi.fn(),
    getService: (name) =>
      name === 'requireRoles' ? () => (req, res, next) => next() : undefined
  };
}

// Express-like stub that records nothing but accepts route registration.
function makeApp() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  };
}

describe('calendar plugin init() core wiring', () => {
  it('registers the four calendar atomic permissions in the PermissionRegistry', async () => {
    const registry = makeRegistry();

    await init(makeApp(), registry, { emit: vi.fn() });

    const ids = registry.permissions.getAll().map((p) => p.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'calendar:create',
        'calendar:read',
        'calendar:update',
        'calendar:delete'
      ])
    );

    // All registered under the 'calendar' module group.
    const grouped = registry.permissions.getAllGrouped();
    expect(grouped.calendar).toHaveLength(4);
    for (const perm of grouped.calendar) {
      expect(perm.module).toBe('calendar');
      expect(perm.description.length).toBeGreaterThan(0);
    }
  });

  it('registers the calendar module with its routes', async () => {
    const registry = makeRegistry();

    await init(makeApp(), registry, { emit: vi.fn() });

    expect(registry.registerModule).toHaveBeenCalledWith(
      'calendar',
      expect.objectContaining({ routes: expect.any(Array) })
    );
  });

  it('throws when the requireRoles service is not configured', async () => {
    const registry = makeRegistry();
    registry.getService = () => undefined;

    await expect(init(makeApp(), registry, { emit: vi.fn() })).rejects.toThrow(
      /Permission middleware service is not configured/
    );
  });

  it('does not fail when the registry has no permission registry', async () => {
    const registry = makeRegistry();
    delete registry.permissions;

    await expect(
      init(makeApp(), registry, { emit: vi.fn() })
    ).resolves.toBeUndefined();
    expect(registry.registerModule).toHaveBeenCalled();
  });
});
