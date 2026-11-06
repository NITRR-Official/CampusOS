# ADR-020: Frontend Runtime Slot-Fill & ExtensionPoint Micro-UI Architecture

## Status

Accepted

## Context

In ADR-007 and ADR-014, CampusOS established frontend plugin integration using Next.js App Router and runtime ESM bundle injection. However, as CampusOS evolved from full-page plugins to micro-UI extensions, several critical architectural gaps emerged:

1. **Host Page Fragility:** If a third-party plugin injected into `<ExtensionPoint id="dashboard-stats" />` encountered a runtime exception or hook failure, the error propagated up the React component tree and crashed the entire host page (White Screen of Death).
2. **Layout Breakout & Style Bleed:** Injected widgets often relied on viewport media queries (`@media (min-width: 768px)`). When placed into a sidebar, grid card, or split-pane slot, the viewport was wide while the slot was narrow, leading to broken flex wrapping, overlapping text, and horizontal overflow.
3. **Uncontrolled Ordering & Context Filtering:** Plugins had no mechanism to express display precedence or conditionally hide widgets based on user roles, permissions, or entity states without embedding conditional boilerplate in every widget.
4. **Lack of Slot Contracts:** There was no centralized specification detailing which extension slots existed, where they were rendered, or what context parameters they supplied to mounted widgets.

## Decision

CampusOS implements an isolated, container-aware **Slot-Fill Micro-UI Architecture** in `@campus-os/shared`:

### 1. Per-Widget React Error Boundary (`ExtensionErrorBoundary`)

Every widget mounted inside `<ExtensionPoint />` is wrapped within an independent `ExtensionErrorBoundary` and synchronous `SafeWidget` protector:

- If a plugin widget throws during rendering or lifecycle updates, the error is isolated to that specific widget slot.
- Sibling widgets in the same slot and the parent page continue executing uninterrupted.
- Developers can configure custom fallback components via `fallbackWidget`, while in development mode a diagnostic card is displayed.

### 2. Priority Sorting & Conditional Rendering

`PluginRegistry.registerWidget()` supports:

- `priority?: number` (default `0`): Widgets in a slot are sorted descending (`b.priority - a.priority`). Higher priority widgets render first.
- `condition?: (context) => boolean`: Evaluated before rendering. If the condition returns `false` or throws, the widget is excluded cleanly.

### 3. Container Queries (`@container`) & CSS Isolation

- The `<ExtensionPoint />` wrapper establishes a CSS container context: `container-type: inline-size` with `@container`.
- Child widgets style responsively against their allocated slot space using container query utilities (`@sm:`, `@md:`, `@lg:`) instead of window-level viewport media queries.
- CSS isolation is enforced via Tailwind `isolate` (`isolation: isolate`) and `overflow-hidden` by default to prevent layout breakout or z-index collisions with host UI.

### 4. Strongly-Typed Slot Catalog

`@campus-os/shared/slot-catalog` exposes `CampusOSSlotId` and `SlotContextMap` interfaces:

- Standard slots (`dashboard-top`, `dashboard-stats`, `dashboard-actions`, `profile-tabs`, `club-header-actions`, etc.) provide autocompletion and type-safe context payload inference.

### 5. Plugin Teardown Integration

`PluginRegistry` provides `unregisterWidget(slotId, pluginId)` and `unregisterWidgetsByPlugin(pluginId)`, ensuring zero memory leaks or ghost widgets when a plugin is deactivated at runtime.

## Consequences

### Positive

- **Host Resilience:** Faulty, buggy, or malicious plugin widgets cannot crash core CampusOS pages.
- **Micro-UI Responsiveness:** Widgets automatically scale and adapt to small sidebar slots vs full-width dashboard columns using native CSS container queries.
- **Predictable Layouts:** Clear priority ordering and context filtering remove ad-hoc placement hacks.
- **Zero-Downtime Cleanup:** Deactivating a plugin immediately removes its widgets from all active slots without requiring page reload.

### Negative / Trade-Offs

- **Class Component Overhead:** Error boundaries require React class component wrappers around each widget.
- **Overflow Clipping:** `overflow-hidden` on slot containers prevents widgets from drawing custom dropdown menus outside their bounding box unless using React Portals (`Dialog`, `DropdownMenu` from `@campusos/design-system` correctly use portals).
