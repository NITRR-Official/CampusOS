# ADR 007: Frontend Plugin Architecture (Build-Time Integration)

## Status

Accepted

## Context

CampusOS is an open-source platform designed to be extensible. While the backend has a dynamic plugin loader (ADR-006), the frontend is a statically compiled Next.js (React) application. 

A critical architectural question arose: **How does a compiled frontend know how to display UI for a backend plugin that was installed by the community?**

We evaluated three primary architectures:
1. **Module Federation (Micro-frontends)**: Dynamic runtime loading of React components. Extremely complex to maintain and configure, especially for open-source contributors.
2. **Feature Flags (Monolithic)**: Shipping the frontend with all possible plugins pre-compiled and toggling them via API responses. This fails for an open-source ecosystem because it only works for first-party plugins; it cannot support 3rd-party community plugins.
3. **Build-Time Integration**: The plugin contains its UI components. Upon installation, the components are injected into the frontend directory, and the platform triggers a Next.js rebuild (`pnpm build`).

## Decision

**Adopt the "Build-Time Plugin Integration" pattern paired with a React "ExtensionPoint Registry" for the frontend.**

When an institute or organization installs CampusOS and wishes to add a plugin (first-party or 3rd-party):
1. The plugin package (containing both backend logic and frontend React components) is downloaded/cloned into the platform.
2. An automated scaffolding script injects the frontend components into a designated plugin directory (e.g., `frontend/plugins/[plugin-name]`).
3. The plugin exports an `initFrontend()` function that registers its Sidebar Links and Widgets into the global `PluginRegistry` (e.g., `registry.registerWidget('dashboard-stats', 'club', ClubStatsWidget)`).
4. Core UI components (like the Dashboard) use `<ExtensionPoint id="dashboard-stats" activePlugins={activePlugins} />` to dynamically render these widgets if the backend API reports the plugin as active.
5. The system triggers a frontend rebuild (`pnpm --filter frontend run build`).
6. The server undergoes a rolling restart (as per ADR-006) to serve the newly compiled frontend and load the backend module.

## Rationale

1. **Open-Source Extensibility**: It allows anyone in the community to build and share plugins without bloating the core CampusOS repository.
2. **Native Performance & Stability**: Because the plugin's UI is compiled alongside the core app, there are no runtime injection penalties. The Next.js compiler will catch type errors or missing dependencies at build time.
3. **UI Consistency**: Plugins can directly import core `shadcn/ui` components and Tailwind classes, ensuring they perfectly inherit the host's dark mode and design system.
4. **Platform Precedent**: This is the exact pattern used by industry-leading open-source React platforms like **Spotify's Backstage**, which relies heavily on build-time plugin composition.

## Consequences

### Positive
- Zero runtime overhead for the frontend.
- Perfect TypeScript support and IDE intelligence across core and plugin boundaries.
- Low barrier to entry for open-source contributors (they just write standard React/Next.js pages).

### Negative
- Installing a plugin is not "instant" — it requires a compilation step that may take 1-2 minutes.
- Requires the production environment to have Node.js and build tools available, or requires the CI/CD pipeline to handle the build and deployment when the configuration changes.

## Related ADRs

- ADR-006: Plugin Manager Config & Restart Pattern
- ADR-003: System Layers
