import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  verifyPluginProvenance,
  OFFICIAL_CORE_PLUGINS
} from './plugin-provenance.js';
import { createScopedRegistry } from './sandbox-registry.js';
import { createScopedEventBus } from './sandbox-event-bus.js';
import {
  InvalidTierClaimError,
  AccessDeniedError,
  PluginSecurityError
} from '@campus-os/shared/plugin-contract';

describe('Two-Tier Plugin Architecture and Sandboxed Capability Isolation (Issue #119)', () => {
  describe('1. Plugin Provenance & Anti-Spoofing Verification', () => {
    it('recognizes official core plugins and verifies them as core tier', () => {
      for (const name of ['event', 'club', 'auth', 'forms', 'budget']) {
        expect(OFFICIAL_CORE_PLUGINS.has(name)).toBe(true);
        const result = verifyPluginProvenance({ name, tier: 'core' });
        expect(result.verifiedTier).toBe('core');
        expect(result.demoted).toBe(false);
      }
    });

    it('defaults official plugins to core tier even if tier field is omitted in manifest', () => {
      const result = verifyPluginProvenance({ name: 'activity' });
      expect(result.verifiedTier).toBe('core');
      expect(result.demoted).toBe(false);
    });

    it('verifies community plugins declaring community tier', () => {
      const result = verifyPluginProvenance({
        name: 'community-calendar-sync',
        tier: 'community'
      });
      expect(result.verifiedTier).toBe('community');
      expect(result.demoted).toBe(false);
    });

    it('prevents privilege escalation: throws InvalidTierClaimError in strict mode when 3rd-party claims core', () => {
      expect(() => {
        verifyPluginProvenance(
          {
            name: 'malicious-hacker-tool',
            tier: 'core'
          },
          { isProd: true }
        );
      }).toThrow(InvalidTierClaimError);
    });

    it('demotes unverified plugin claiming core tier to community when non-strict', () => {
      const result = verifyPluginProvenance({
        name: 'third-party-widget',
        tier: 'core'
      });
      expect(result.verifiedTier).toBe('community');
      expect(result.demoted).toBe(true);
    });

    it('allows 3rd-party plugin to run as core tier if explicitly trusted in database by admin', () => {
      const result = verifyPluginProvenance(
        {
          name: 'internal-enterprise-sso',
          tier: 'core'
        },
        { trusted: true }
      );
      expect(result.verifiedTier).toBe('core');
      expect(result.demoted).toBe(false);
    });
  });

  describe('2. Capability-Sandboxed Registry (createScopedRegistry)', () => {
    let mockGlobalRegistry;
    let registeredPerms;

    beforeEach(() => {
      registeredPerms = [];
      mockGlobalRegistry = {
        getService: vi.fn((name) => ({ name, mockService: true })),
        registerService: vi.fn(),
        getResolver: vi.fn((name) => ({ name, mockResolver: true })),
        registerResolver: vi.fn(),
        registerContextResolver: vi.fn(),
        registerPublicRoute: vi.fn(),
        registerStatProvider: vi.fn(),
        registerSettingsConfig: vi.fn(),
        registerPluginMetadata: vi.fn(),
        getAllModules: vi.fn(() => ['auth', 'event']),
        getAllServices: vi.fn(() => ['service:event', 'db:mongo']),
        getSettingsConfig: vi.fn(),
        getPluginMetadata: vi.fn(),
        getPublicRoutes: vi.fn(() => []),
        getAllStatProviders: vi.fn(() => []),
        getAllSettingsConfigs: vi.fn(() => ({})),
        resolveContext: vi.fn(),
        getAuthenticator: vi.fn(),
        permissions: {
          register: vi.fn((p) => registeredPerms.push(p)),
          has: vi.fn(),
          get: vi.fn(),
          getAll: vi.fn(() => registeredPerms),
          getAllGrouped: vi.fn(() => ({}))
        }
      };
    });

    it('strictly forbids community plugins from accessing raw database services', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      const forbiddenServices = [
        'db:mongo',
        'db:sql',
        'db:manager',
        'core:models',
        'db:custom_replica'
      ];

      for (const service of forbiddenServices) {
        expect(() => scoped.getService(service)).toThrow(AccessDeniedError);
      }
    });

    it('allows safe utility services without requiring capabilities', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      expect(scoped.getService('core:logger')).toBeDefined();
      expect(scoped.getService('core:request_context')).toBeDefined();
      expect(mockGlobalRegistry.getService).toHaveBeenCalledWith(
        'core:logger',
        true
      );
    });

    it('denies access to domain services when capability was not granted', () => {
      const scoped = createScopedRegistry(
        {
          name: 'student-polls',
          capabilities: []
        },
        mockGlobalRegistry,
        { grantedCapabilities: [] }
      );

      expect(() => scoped.getService('service:event')).toThrow(
        AccessDeniedError
      );
      expect(() => scoped.getService('club:service')).toThrow(
        AccessDeniedError
      );
    });

    it('grants access to domain services matching granted capabilities', () => {
      const scoped = createScopedRegistry(
        {
          name: 'student-polls',
          capabilities: ['service:event', 'club:read']
        },
        mockGlobalRegistry,
        { grantedCapabilities: ['service:event', 'club:read'] }
      );

      const eventService = scoped.getService('service:event');
      expect(eventService).toBeDefined();
      expect(eventService.name).toBe('service:event');
    });

    it('prevents service name squatting on registerService', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      // Attempt to register outside own namespace
      expect(() => {
        scoped.registerService('auth:hijack', {});
      }).toThrow(PluginSecurityError);

      expect(() => {
        scoped.registerService('global-helper', {});
      }).toThrow(PluginSecurityError);

      // Scoped service succeeds
      scoped.registerService('student-polls:survey', { run: () => {} });
      expect(mockGlobalRegistry.registerService).toHaveBeenCalledWith(
        'student-polls:survey',
        expect.any(Object)
      );
    });

    it('enforces consumes.resolvers whitelisting on getResolver', () => {
      const scoped = createScopedRegistry(
        {
          name: 'student-polls',
          consumes: {
            resolvers: ['club:summary']
          }
        },
        mockGlobalRegistry
      );

      // Declared resolver succeeds
      expect(scoped.getResolver('club:summary')).toBeDefined();

      // Undeclared resolver is denied
      expect(() => scoped.getResolver('auth:token_info')).toThrow(
        AccessDeniedError
      );
    });

    it('prevents resolver squatting on registerResolver', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      expect(() => {
        scoped.registerResolver('auth:resolver', {});
      }).toThrow(PluginSecurityError);

      scoped.registerResolver('student-polls:stats', {});
      expect(mockGlobalRegistry.registerResolver).toHaveBeenCalledWith(
        'student-polls:stats',
        expect.any(Object)
      );
    });

    it('restricts context resolver registration to own API namespace', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      // Attempting to hijack /api/v1/clubs or /api/v1/auth
      expect(() => {
        scoped.registerContextResolver('/api/v1/clubs', () => {});
      }).toThrow(PluginSecurityError);

      // Own namespace succeeds
      scoped.registerContextResolver('/api/v1/student-polls', () => ({}));
      expect(mockGlobalRegistry.registerContextResolver).toHaveBeenCalledWith(
        '/api/v1/student-polls',
        expect.any(Function)
      );
    });

    it('prevents broad public route registration', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      // Trying to open all /api/v1 routes to unauthenticated access
      expect(() => {
        scoped.registerPublicRoute(/^\/api\/v1\/.*/);
      }).toThrow(PluginSecurityError);

      // Scoped public route succeeds
      scoped.registerPublicRoute(/^\/api\/v1\/student-polls\/public/);
      expect(mockGlobalRegistry.registerPublicRoute).toHaveBeenCalled();
    });

    it('prevents permission squatting on permissions.register', () => {
      const scoped = createScopedRegistry(
        { name: 'student-polls' },
        mockGlobalRegistry
      );

      // Attempting to register root admin permission
      expect(() => {
        scoped.permissions.register({ name: 'admin:super_user' });
      }).toThrow(PluginSecurityError);

      // Scoped permission succeeds
      scoped.permissions.register({
        name: 'student-polls:vote',
        description: 'Cast a poll vote'
      });
      expect(mockGlobalRegistry.permissions.register).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'student-polls:vote' })
      );
    });
  });

  describe('3. Sandboxed Event Bus (createScopedEventBus)', () => {
    let mockGlobalBus;
    let globalListeners;

    beforeEach(() => {
      globalListeners = new Map();
      mockGlobalBus = {
        emit: vi.fn(async (event, payload) => {
          const fns = globalListeners.get(event) || [];
          for (const fn of fns) await fn(payload);
          return true;
        }),
        on: vi.fn((event, fn) => {
          if (!globalListeners.has(event)) globalListeners.set(event, []);
          globalListeners.get(event).push(fn);
        }),
        once: vi.fn((event, fn) => {
          if (!globalListeners.has(event)) globalListeners.set(event, []);
          globalListeners.get(event).push(fn);
        }),
        off: vi.fn((event, fn) => {
          const fns = globalListeners.get(event) || [];
          globalListeners.set(
            event,
            fns.filter((f) => f !== fn)
          );
        })
      };
    });

    it('restricts event emission to plugin own namespace', async () => {
      const scoped = createScopedEventBus(
        { name: 'student-polls' },
        mockGlobalBus
      );

      // Attempting to emit fake core authentication event
      await expect(
        scoped.emit('auth:user_deleted', { userId: '123' })
      ).rejects.toThrow(PluginSecurityError);

      // Emitting in own namespace succeeds
      await scoped.emit('student-polls:poll_created', { pollId: 'p1' });
      expect(mockGlobalBus.emit).toHaveBeenCalledWith(
        'student-polls:poll_created',
        { pollId: 'p1' }
      );
    });

    it('restricts event subscriptions to consumes.events and own namespace', () => {
      const scoped = createScopedEventBus(
        {
          name: 'student-polls',
          consumes: {
            events: ['club:member_joined']
          }
        },
        mockGlobalBus
      );

      // Subscribing to declared event succeeds
      expect(() => {
        scoped.on('club:member_joined', () => {});
      }).not.toThrow();

      // Subscribing to own event succeeds
      expect(() => {
        scoped.on('student-polls:poll_ended', () => {});
      }).not.toThrow();

      // Subscribing to undeclared event throws PluginSecurityError
      expect(() => {
        scoped.on('auth:password_reset', () => {});
      }).toThrow(PluginSecurityError);
    });

    it('isolates removeAllListeners() so community plugins cannot wipe global listeners', () => {
      // Global core listener
      const coreListener = vi.fn();
      mockGlobalBus.on('club:member_joined', coreListener);

      const scoped = createScopedEventBus(
        {
          name: 'student-polls',
          consumes: {
            events: ['club:member_joined']
          }
        },
        mockGlobalBus
      );

      const pollListener = vi.fn();
      scoped.on('club:member_joined', pollListener);

      // Community plugin calls removeAllListeners()
      scoped.removeAllListeners('club:member_joined');

      // Scoped listener is removed via off
      expect(mockGlobalBus.off).toHaveBeenCalledWith(
        'club:member_joined',
        pollListener
      );
      // Core listener was never removed
      expect(mockGlobalBus.off).not.toHaveBeenCalledWith(
        'club:member_joined',
        coreListener
      );
    });
  });
});
