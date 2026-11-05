# ADR-017: Two-Tier Plugin Architecture and Capability-Based Sandboxing

## Status

Proposed (Accepted for Implementation)

## Context

CampusOS was architected to be extensible through community and third-party plugins. However, the initial bootloader implementation (`backend/src/plugin-loader.js`) operated on an implicit "flat-trust" model:

- The unrestricted global `registry`, Express `app`, and `eventBus` singletons were passed directly to every plugin's `init()` function.

In an open-source campus ecosystem, this presents severe operational and security risks:

1. **Unrestricted Raw Database Access:** Any third-party plugin could execute `registry.getService('db:mongo')`, `registry.getService('db:sql')`, or `registry.getService('core:models')`, gaining direct read/write access to sensitive student records, password hashes, and core collections without validation.
2. **Untracked Mutating Service Abuse:** Rogue or buggy plugins could invoke destructive service methods (e.g., `clubService.deleteClub()`, `authService.generateToken()`) without administrative visibility.
3. **No Capability Manifest:** Plugins did not declare what data or services they required in their `plugin.json` manifest.
4. **Event Hijacking:** Without namespace isolation, community plugins could intercept sensitive system events (auth tokens, user passwords) or emit fraudulent administrative events across the shared `eventBus`.

Conversely, **locking community plugins into purely read-only resolvers would severely handicap the platform**:

- Developers would be unable to build advanced integrations (e.g., Biometric Attendance hardware sync, Institute ERP bridges, Custom Payment Gateways).
- The core team would become a bottleneck, forced to write custom resolvers for every developer request.

## Decision

We adopt a **Capability-Based Permission Model with Administrative Consent** (inspired by Android, Shopify, and VS Code extension systems):

### 1. Philosophy: "Business Services Allowed, Raw Database Forbidden"

- **Raw Database Connections (`db:mongo`, `db:sql`, `core:models`):** Strictly forbidden for community tier plugins. No third-party code may run direct queries against database drivers.
- **Service Layer Access:** Allowed for community plugins, provided the required service capabilities are **declared in the manifest** and **explicitly approved by the Institute Administrator**.
- **Rationale:** First-party services (e.g., `eventService.registerAttendance()`) encapsulate schema validation, atomic state transitions, RBAC enforcement, and domain event publishing. Routing operations through services protects data integrity while giving developers rich mutation capabilities.

### 2. Manifest Capability Declaration (`plugin.json`)

Plugins must declare their tier, requested service capabilities, and consumed event channels:

```json
{
  "name": "biometric-attendance",
  "version": "1.0.0",
  "tier": "community",
  "capabilities": [
    "service:event:read",
    "service:event:write",
    "service:club:read"
  ],
  "consumes": {
    "resolvers": ["club:summary", "event:basicInfo"],
    "events": ["event:created", "event:updated"]
  }
}
```

### 3. Provenance Verification & Anti-Spoofing (Preventing Privilege Escalation)

**Rule: "Manifest proposes, Host enforces."**

- Trust cannot rely solely on a user-editable JSON file. A third-party developer cannot gain core privileges simply by writing `"tier": "core"` in `plugin.json`.
- **Immutable Core Whitelist:** CampusOS Core maintains an immutable set of verified first-party plugins (`auth`, `club`, `event`, `budget`, `calendar`, `task`, `vendor`, `resource`, `scheduling`, `forms`, `institute`, `plugin-manager`, `activity`, `recruitment`).
- **Enforcement Rule:** If an unverified plugin declares `"tier": "core"`, the bootloader detects the spoofing attempt, logs a critical security alert, and either:
  - Refuses to load the plugin (`InvalidTierClaimError`), or
  - Forcibly demotes the runtime context to `"tier": "community"`.
- **Physical Directory Segregation:** Community plugins installed at runtime are placed into a segregated directory (e.g., `plugins/community/`), ensuring physical filesystem boundaries dictate default trust tiers.

### 4. Administrative Consent at Installation

- When an administrator installs a community plugin via the Admin UI or CLI, the host renders an explicit permission consent prompt:
  > ⚠️ **"Biometric Attendance" is requesting permissions:**
  >
  > - Read Club Members (`service:club:read`)
  > - Modify Event Attendance Records (`service:event:write`)
  >
  > **[Approve & Install]** &nbsp;&nbsp;&nbsp;&nbsp; **[Cancel]**
- Granted permissions are stored in the database (`Plugin.grantedCapabilities`).
- At boot time, the plugin loader only injects services that match the administrator's approved list.

### 5. Capability-Based Registry Proxy (`backend/src/core/sandbox-registry.js`)

When loading a community plugin, `plugin-loader.js` wraps the registry in a dynamic security proxy:

- **Forbidden Services:** Calls to `registry.getService('db:*')` or `registry.getService('core:models')` throw an immediate `AccessDeniedError`.
- **Capability Check on Services:** Calls to `registry.getService('service:event')` verify that `service:event:read` (or `write`) is present in `grantedCapabilities`. If not, an `AccessDeniedError` is thrown.
- **Read-Only Resolvers:** Clean data views are made available via `registry.getResolver(name)`.

### 6. Scoped Event Bus (`backend/src/core/sandbox-event-bus.js`)

The injected `eventBus` for community plugins:

- Enforces namespace prefixes (e.g., `plugin:attendance:*`) for event publication.
- Restricts event subscriptions strictly to channels declared in `consumes.events`.

### 7. Trusted / Developer Mode for Institute IT Teams

- Institute IT administrators developing custom in-house enterprise plugins can toggle a "Trusted Internal Plugin" flag in the Admin Dashboard, granting full core access with immutable audit logging.

## Consequences

### Positive

- **High Developer Extensibility:** Developers can build powerful, mutating integrations (ERP sync, biometric attendance, custom certificates) using official service APIs.
- **Strict Database Integrity:** Core collections (`User`, `Club`, `Event`) cannot be corrupted via raw driver operations; all mutations go through validated service pipelines.
- **Administrative Transparency:** Campus administrators have complete visibility and consent control over what each plugin can read or modify.
- **Zero Regressions for Core Plugins:** Shipped first-party plugins retain full, unrestricted access.

### Negative

- Requires implementing the capability proxy wrapper (`sandbox-registry.js`) and admin consent UI flow.
- Services exposed to community plugins must ensure robust parameter validation.

## Related ADRs

- [ADR-006: Plugin Manager Config & Restart Pattern](./ADR-006-PLUGIN_MANAGER_RESTART.md)
- [ADR-013: Factory Pattern Services & Dependency Inversion](./ADR-013-FACTORY_PATTERN_SERVICES.md)
- [ADR-016: Polyglot Database Architecture & Adapters](./ADR-016-POLYGLOT_DATABASE_ADAPTER.md)
