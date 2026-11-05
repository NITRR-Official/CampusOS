# ADR-014: Runtime ESM Bundle Injection for Zero-Rebuild Frontend Plugins

## Status

Accepted

## Context

In ADR-007, CampusOS adopted a build-time frontend integration architecture where plugin frontends were registered into the Next.js monorepo using `transpilePackages` in `next.config.ts`, and statically wired into the Next.js App Router via code-generated wrappers (`frontend/lib/plugins/init.ts` and `frontend/app/...`).

While this provided quick initial prototyping, it introduced critical architectural bottlenecks as the platform scaled toward a community-driven, extensible ecosystem:

1. **Mandatory Full Rebuilds:** Installing, enabling, or updating any third-party or community plugin required a full Next.js rebuild (`next build`) and production container redeploy.
2. **Monorepo Coupling:** The core Next.js shell was forced to know about and bundle every plugin at compile-time, resulting in growing bundle sizes, slower builds, and risk of one malformed plugin breaking the entire application build.
3. **Friction for Plugin Developers:** Third-party plugin authors could not build, test, version, or distribute self-contained frontend packages independently of the host monorepo.
4. **Zero-Downtime Plugin Lifecycle:** Administrators could not install or activate community plugins dynamically through the Admin UI without restarting or redeploying the web frontend.

## Decision

CampusOS adopts **Runtime ES Module (ESM) Bundle Injection** for frontend plugins alongside the existing core plugins:

### 1. Standalone Plugin Frontend ESM Bundles

- Each plugin frontend can be built into a standalone, browser-executable ES module: `plugins/<plugin-name>/frontend/dist/bundle.esm.js` (and optional `bundle.css`).
- Common shared host dependencies (`react`, `react-dom`, `@campus-os/shared/plugin-registry`, `@campus-os/shared/extension-point`) are treated as **externals** and are not duplicated inside individual plugin bundles.
- A standardized build command (`pnpm plugin:build-frontend <name>` powered by `esbuild`) compiles plugin TypeScript/JSX into an optimized ESM bundle in milliseconds.

### 2. Backend Bundle Serving Route

- The Express backend exposes a public static route:
  - `GET /api/v1/plugins/:name/bundle.js` — Serves `plugins/<name>/frontend/dist/bundle.esm.js` with `Content-Type: application/javascript; charset=utf-8` and caching headers.
  - `GET /api/v1/plugins/:name/bundle.css` — Serves `plugins/<name>/frontend/dist/bundle.css` with `Content-Type: text/css; charset=utf-8` if present.
- The route includes strict path sanitization to prevent directory traversal attacks and returns structured JSON errors if a plugin bundle is missing or disabled.

### 3. Dynamic Host Component (`DynamicPluginHost`)

- The Next.js frontend hosts a dynamic client component: `DynamicPluginHost.tsx`.
- In the browser environment, it uses native ECMAScript dynamic imports with Webpack/Turbopack ignore annotations:
  ```tsx
  const pluginModule = await import(
    /* webpackIgnore: true */
    `${apiUrl}/api/v1/plugins/${pluginName}/bundle.js`
  );
  ```
- It automatically mounts the exported component, provides Suspense loading states, and encapsulates render errors within an error boundary to prevent plugin crashes from affecting the parent shell.

### 4. Shared Host Runtime Bridge

- The host window registers a global runtime bridge (`window.__CampusOS_Runtime__` / window-level React sharing or Import Map resolution).
- When a runtime plugin calls `registry.registerSidebarLink()` or `registry.registerWidget()`, it registers directly into the host's singleton `plugin-registry`, enabling live injection into `<ExtensionPoint id="..." />`.

### 5. Backward Compatibility & Dual-Mode

- First-party core plugins continue to be supported via direct App Router routes.
- Community and newly installed plugins default to runtime ESM injection, achieving zero-rebuild installation.

## Consequences

### Positive

- **Zero-Rebuild Plugin Installation:** New plugins can be added, updated, or removed in real time without running `next build` or restarting the frontend service.
- **Independent Plugin Packaging:** Developers can distribute pre-compiled `.zip` packages containing `bundle.esm.js` and `plugin.json`.
- **Fault Isolation:** A syntax or runtime crash in a dynamically injected plugin is isolated by `DynamicPluginHost`'s error boundary without bringing down the host application.
- **Smaller Host Bundle:** Next.js only downloads plugin code on-demand when a user navigates to the plugin's views or renders its widgets.

### Negative / Trade-Offs

- **Shared Dependency Alignment:** Plugin frontends must target compatible React versions (React 19) provided by the host runtime.
- **CSS Isolation:** Community plugin CSS must be namespaced or scoped to avoid clashing with host utility classes.

## Alternatives Considered

1. **Webpack 5 Module Federation:** Tight coupling to Webpack internals; difficult to maintain across Next.js Turbopack migrations and SSR boundaries.
2. **Iframe Sandboxing:** Strong isolation, but creates severe UX degradations (disjoint modals, navigation history issues, cross-origin styling disconnects, and heavy memory overhead).
3. **Build-Time TranspilePackages (ADR-007):** Retained for core first-party plugins, but superseded for dynamic/community plugins due to mandatory full rebuilds.
