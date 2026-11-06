---
title: 'The Plugin Manifest (plugin.json)'
description: 'Authoritative specification, schema reference, and field validation rules for the CampusOS plugin.json manifest.'
---

# The Plugin Manifest (`plugin.json`)

Every plugin in CampusOS **must** contain a `plugin.json` manifest located at the root of its directory:

```
plugins/<plugin-name>/plugin.json
```

The manifest is the **Single Source of Truth** for the CampusOS Plugin Loader. It dictates the plugin's identity, provenance security tier, required capabilities, dependency graph, database requirement, and full-stack enablement flags.

During server startup, the Plugin Loader strictly validates every manifest against `@campus-os/shared/plugin-contract` using Zod before loading any code.

---

## Complete Manifest Schema

Below is an annotated, comprehensive example displaying all supported fields:

```json
{
  "$schema": "https://campusos.dev/schemas/plugin.schema.json",
  "name": "recruitment",
  "version": "1.2.0",
  "description": "Handles club member applications, applicant evaluation pipelines, and interview scheduling.",
  "tier": "community",
  "defaultEnabled": true,
  "backend": true,
  "frontend": true,
  "database": {
    "type": "mongodb"
  },
  "dependencies": {
    "club": "^1.0.0",
    "auth": "^1.0.0"
  },
  "capabilities": ["service:club", "event:bus:emit", "storage:write"],
  "consumes": {
    "resolvers": ["club:getMemberRoles"],
    "events": ["club.member.resigned", "event.session.completed"]
  },
  "themeColor": "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800",
  "minCampusOSVersion": ">=0.1.0",
  "author": "NITRR Open Source Club",
  "license": "MIT"
}
```

---

## Comprehensive Field Reference

| Field                    | Type                    | Required |    Default    | Description                                                                                                                                                                                         |
| :----------------------- | :---------------------- | :------: | :-----------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`name`**               | `string`                | **Yes**  |       —       | Unique plugin identifier. Must be lowercase alphanumeric with hyphens (`^[a-z0-9-]+$`). Must **strictly match** the folder name in `/plugins/`.                                                     |
| **`version`**            | `string`                | **Yes**  |       —       | Semantic version of the plugin adhering to [SemVer 2.0.0](https://semver.org) (e.g., `"1.0.0"`, `"2.4.1-beta.1"`).                                                                                  |
| **`description`**        | `string`                | **Yes**  |       —       | Clear, concise human-readable description of the plugin's functional purpose.                                                                                                                       |
| **`tier`**               | `'core' \| 'community'` |    No    | `"community"` | Provenance security tier ([ADR-017](/docs/architecture/decisions/ADR-017-TWO_TIER_PLUGIN_SANDBOXING)). Determines whether the plugin gets raw database access or capability-sandboxed proxy access. |
| **`dependencies`**       | `object \| string[]`    |    No    |     `{}`      | Upstream plugins required by this plugin. Accepts a map of plugin names to SemVer ranges (e.g. `{"club": "^1.0.0"}`) or an array of strings (e.g. `["club"]`).                                      |
| **`capabilities`**       | `string[]`              |    No    |     `[]`      | Granular permission tokens requested by a community plugin (e.g., `"service:event"`, `"storage:write"`). Must be granted by an administrator in the database.                                       |
| **`consumes`**           | `object`                |    No    |     `{}`      | Declares external cross-plugin interfaces consumed by this plugin. Contains `resolvers` and `events`.                                                                                               |
| **`consumes.resolvers`** | `string[]`              |    No    |     `[]`      | Array of cross-plugin resolver identifiers required by this plugin (e.g. `["club:getRoles"]`).                                                                                                      |
| **`consumes.events`**    | `string[]`              |    No    |     `[]`      | Domain event topics that this plugin intends to listen to via the EventBus (e.g. `["club.member.added"]`).                                                                                          |
| **`defaultEnabled`**     | `boolean`               |    No    |    `true`     | When `true`, automatically enables the plugin in the MongoDB `_plugins` collection upon first discovery.                                                                                            |
| **`database`**           | `object`                |    No    |  `undefined`  | Declares database engine requirements ([ADR-016](/docs/architecture/decisions/ADR-016-POLYGLOT_DATABASE_ADAPTER)). Contains `type: "mongodb" \| "sql"`.                                             |
| **`frontend`**           | `boolean`               |    No    |    `true`     | When `true`, the plugin build toolchain compiles client assets from `frontend/` and serves the runtime bundle via `/api/v1/plugin-bundles/<name>`.                                                  |
| **`backend`**            | `boolean`               |    No    |    `true`     | When `true`, the Plugin Loader expects an entrypoint at `backend/src/index.js` exporting an `init` lifecycle function.                                                                              |
| **`themeColor`**         | `string`                |    No    |  `undefined`  | Tailwind CSS color utility classes used by the Host UI to render badge tags, dashboard widgets, and navigation chips.                                                                               |
| **`minCampusOSVersion`** | `string`                |    No    |  `undefined`  | SemVer constraint range indicating host engine compatibility (e.g., `">=0.1.0"`).                                                                                                                   |

---

## Detailed Field Specifications

### 1. `name`

- **Validation Rule**: Lowercase alphanumeric characters and dashes only (`/^[a-z0-9-]+$/`).
- **Folder Name Contract**: The manifest `name` **must exactly match** the parent directory name inside `/plugins/`. If `/plugins/event-management/plugin.json` specifies `"name": "event"`, the loader will throw a `PluginContractError` and halt boot in production.
- **Bad**: `"Event_Manager"`, `"eventManager"`, `"event/management"`
- **Good**: `"event"`, `"recruitment"`, `"vendor-portal"`

### 2. `tier` & Provenance Sandboxing (ADR-017)

CampusOS implements a two-tier provenance security model:

- **`"core"`**: Reserved exclusively for first-party plugins maintained in the official repository (such as `auth`, `admin`, `activity`, `club`, `event`, `budget`, etc.). Core plugins receive full system access with wildcard capability (`*`).
- **`"community"`**: Third-party or untrusted plugins. Community plugins run in a **capability-sandboxed proxy environment**:
  - Direct access to raw database singletons (`db:mongo`, `db:sql`, `core:models`) is **forbidden** and throws `AccessDeniedError`.
  - Can only consume services explicitly declared in `capabilities` and approved by an administrator in the database.
  - Can only register services and permissions prefixed with their own namespace (e.g., `recruitment:*`).

> [!CAUTION] Privilege Escalation Guard
> If an unverified community plugin sets `"tier": "core"` in its manifest, the Plugin Loader throws an `InvalidTierClaimError` and halts loading immediately.

### 3. `dependencies` & Topological Order

CampusOS resolves dependencies using a **Directed Acyclic Graph (DAG)** with topological sorting:

```json
"dependencies": {
  "club": "^1.0.0",
  "auth": ">=1.0.0"
}
```

- **Boot Guarantee**: The loader guarantees that all declared dependencies are fully initialized (`init()`) and their migrations are executed _before_ your plugin's `init()` is called.
- **Version Satisfaction**: If a required plugin is disabled in the database or does not satisfy the SemVer range constraint, your plugin is skipped gracefully with an informative log warning.
- **Circular Dependency Prevention**: If Plugin A requires Plugin B and Plugin B requires Plugin A, the loader aborts startup with a detailed cycle path traceback.

### 4. `capabilities`

Community plugins must request specific capabilities to access cross-plugin features:

```json
"capabilities": [
  "service:club",
  "service:event",
  "event:bus:emit",
  "storage:write"
]
```

During runtime, when a plugin calls `registry.getService('clubService')`, the sandboxed registry verifies that `service:club` is present in the plugin's `grantedCapabilities` array in the database.

### 5. `database` (ADR-016 Polyglot Adapter)

CampusOS supports polyglot persistence. Declare your storage engine:

```json
"database": {
  "type": "mongodb"
}
```

- `"mongodb"`: The plugin will use Mongoose models and automated migrations inside `backend/migrations/` tracked in `_plugin_migrations`.
- `"sql"`: The plugin utilizes SQLite/PostgreSQL relational storage via the SQL adapter layer.

### 6. `frontend` & `backend` Flags

Plugins can be full-stack, backend-only (headless microservices), or frontend-only (pure UI extensions):

- **Full-stack plugin** (`frontend: true, backend: true`): Typical plugin with both API routes and UI components.
- **Headless plugin** (`frontend: false, backend: true`): Background workers, analytics listeners, or webhooks without UI pages.
- **Pure UI plugin** (`frontend: true, backend: false`): Dashboard view customizations, custom themes, or external embedded viewers.

---

## Production Manifest Examples

### Core Official Plugin (`plugins/club/plugin.json`)

```json
{
  "name": "club",
  "version": "1.0.0",
  "description": "Club Lifecycle and Membership Management Module",
  "tier": "core",
  "defaultEnabled": true,
  "backend": true,
  "frontend": true,
  "dependencies": {
    "auth": "^1.0.0"
  },
  "database": {
    "type": "mongodb"
  },
  "themeColor": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
}
```

### Community Sandboxed Plugin (`plugins/alumni-network/plugin.json`)

```json
{
  "name": "alumni-network",
  "version": "0.4.0",
  "description": "Connects graduating students with registered alumni mentors.",
  "tier": "community",
  "defaultEnabled": false,
  "backend": true,
  "frontend": true,
  "dependencies": {
    "auth": "^1.0.0",
    "club": "^1.0.0"
  },
  "capabilities": ["service:club", "event:bus:emit"],
  "consumes": {
    "resolvers": ["club:getMemberProfile"],
    "events": ["club.member.graduated"]
  },
  "database": {
    "type": "mongodb"
  },
  "themeColor": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800"
}
```

---

## Validation Engine & Error Handling

Manifest validation is enforced programmatically by `@campus-os/shared/plugin-contract` via Zod.

If a manifest violates contract rules, the loader throws typed errors:

| Error Class             | Trigger Scenario                                                                     | Resolution                                                               |
| :---------------------- | :----------------------------------------------------------------------------------- | :----------------------------------------------------------------------- |
| `PluginContractError`   | Missing mandatory field, invalid SemVer, or directory name mismatch.                 | Correct the field in `plugin.json` or rename folder to match `name`.     |
| `InvalidTierClaimError` | Community plugin declared `"tier": "core"` without being in `OFFICIAL_CORE_PLUGINS`. | Set `"tier": "community"` or contribute plugin to the core repository.   |
| `PluginSecurityError`   | Community plugin attempting to register permissions without `pluginName:` prefix.    | Prefix all registered permissions with `<plugin-name>:`.                 |
| `PluginMigrationError`  | Checksum mismatch or unhandled exception in `backend/migrations/`.                   | Verify migration file integrity against `_plugin_migrations` collection. |

---

## Related Documentation

- [Backend Architecture & Startup Sequence](/docs/architecture/BACKEND)
- [Plugin System Architecture](/docs/architecture/PLUGIN_SYSTEM)
- [Backend Services & Service Registry Reference](/docs/plugins/backend/services-and-events)
- [Lifecycle & Teardown Hooks](/docs/plugins/backend/lifecycle-and-hooks)
- [Automated Database Schema Migrations](/docs/plugins/backend/database-migrations)
