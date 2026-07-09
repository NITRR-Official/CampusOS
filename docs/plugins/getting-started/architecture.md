# Architecture Overview

CampusOS uses a strict **Unified Full-Stack Architecture** for its plugins. This structure enables a 3rd-party developer to ship a complete feature (both backend APIs and frontend UI components) as a single cohesive unit.

## The Monolithic Namespace

When a plugin is installed via the CampusOS CLI Installer, it is placed into the root `plugins/` directory of the server deployment.

A standard plugin structure looks exactly like this:

```text
plugins/
└── recruitment/
    ├── plugin.json         # (Required) Plugin manifest and dependencies
    ├── package.json        # (Optional) Any specific 3rd-party NPM dependencies
    ├── backend/
    │   └── src/
    │       └── index.js    # (Required) Backend Express entry point
    └── frontend/
        └── init.ts         # (Required) Frontend Next.js registry entry point
```

## How the Backend Boots

When the CampusOS backend (`node backend/src/app.js`) starts:

1. The **Plugin Loader** reads the `plugins/` directory.
2. It parses every `plugin.json` to discover dependencies and requested semver versions.
3. It performs a **Topological Sort** to ensure plugins are booted in the exact order of their dependency graph.
4. It dynamically invokes `plugins/<name>/backend/src/index.js`, injecting the `app`, `registry`, and `eventBus`.

## How the Frontend Boots

CampusOS is built on **Next.js**. Because Next.js compiles ahead of time, the Plugin CLI Installer automatically maintains a generated file (`frontend/lib/plugins/init.ts`).

1. The installer discovers your `frontend/init.ts` file.
2. It automatically adds an alias import (`@plugins/<name>/frontend/init`) to the registry.
3. Next.js compiles your UI components directly from the `plugins/` directory alongside the core frontend.
