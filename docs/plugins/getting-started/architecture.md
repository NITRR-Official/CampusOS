# Architecture Overview

CampusOS uses a strict **Unified Full-Stack Architecture** for its plugins. This structure enables a 3rd-party developer to ship a complete feature (both backend APIs and frontend UI components) as a single cohesive unit.

## The Monolithic Namespace

When a plugin is created or installed, it is placed into the root `plugins/` directory of the CampusOS workspace.

A standard plugin structure looks like this:

```text
plugins/
└── recruitment/
    ├── plugin.json         # (Required) Plugin manifest, tier, capabilities & dependencies
    ├── package.json        # (Optional) Any specific 3rd-party NPM dependencies
    ├── backend/
    │   ├── migrations/     # (Optional) Database schema migrations (001_initial.js, etc.)
    │   └── src/
    │       └── index.js    # (Required if backend: true) Backend entry point exporting init()
    └── frontend/
        └── init.ts         # (Required if frontend: true) Frontend UI entry point
```

## How the Backend Boots

When the CampusOS backend (`node backend/src/index.js` or `pnpm dev`) starts:

1. The **Plugin Loader** (`backend/src/plugin-loader.js`) scans the `plugins/` directory.
2. It parses and validates every `plugin.json` against the strict Zod `PluginManifestSchema`.
3. It performs **Provenance Verification** (`backend/src/core/plugin-provenance.js`) to determine whether the plugin runs as unrestricted `core` or sandboxed `community` tier.
4. It performs a **Topological Sort** to ensure plugins are booted in the exact order of their dependency graph, detecting any circular dependencies.
5. It runs any pending schema migrations in `backend/migrations/` sequentially, tracking checksums in `_plugin_migrations`.
6. It dynamically imports `backend/src/index.js` and invokes `init(app, registry, eventBus, logger)` with scoped or unrestricted sandboxed proxies based on the plugin's tier.

## How the Frontend Boots

CampusOS frontend is built on **Next.js 16 (App Router)** and **React 19**:

1. **Ahead-of-Time Monorepo Registration**: In local monorepo development, `scripts/plugin.js generate-registry` automatically registers each plugin's `frontend/init.ts` into `frontend/lib/plugins/init.ts`, enabling direct compilation and hot reload.
2. **Runtime ESM Micro-Bundling (ADR-014)**: In production and modular deployments, the backend serves pre-compiled ESM bundles via `GET /api/v1/plugins/:name/bundle.js`. The host app dynamically loads bundles into `window.CampusOS.ui`, resolving React and core dependencies without rebuilding the host.
3. **Slot-Fill Extension Points (ADR-020)**: Plugins register widgets into typed slots (`dashboard-top`, `dashboard-stats`, `club-header-actions`, etc.) using `@campus-os/shared/plugin-registry`.
