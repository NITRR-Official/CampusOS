---
title: 'UI Integration & Widgets'
---

# UI Integration & Slot-Fill System

In CampusOS, plugins inject React UI components seamlessly into the Next.js App Router frontend using the strongly typed **Plugin Registry** (`@campus-os/shared/plugin-registry`) and host **Extension Points** (`@campus-os/shared/extension-point`, ADR-020).

Every frontend plugin exports an `initFrontend` function from `frontend/init.ts` (or `.tsx`). During boot, the host calls this function to register navigation links and extension slot widgets.

---

## 1. Registering Sidebar Navigation Links

To place a persistent link into the main sidebar:

```typescript
import { registry } from '@campus-os/shared/plugin-registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'recruitment',
    title: 'Interviews',
    url: '/interviews',
    icon: 'Calendar', // Lucide-React icon identifier
    context: 'workspace' // 'global' | 'workspace'
  });
}
```

---

## 2. Registering Extension Slot Widgets

Host pages declare `<ExtensionPoint id="...">` slots (e.g. `dashboard-top`, `dashboard-stats`, `club-tabs`). Plugins register React components into these slots with optional priority scoring and conditional rendering rules.

### Widget Registration Signature

```typescript
registry.registerWidget<TContext>(
  slotId: CampusOSSlotId,
  pluginId: string,
  component: React.ComponentType<{ context?: TContext }>,
  options?: {
    priority?: number;                        // Higher priority renders first (default: 0)
    condition?: (context?: TContext) => boolean; // Predicate function for dynamic rendering
    metadata?: Record<string, unknown>;        // Developer metadata
  }
);
```

### Complete Example

```tsx
// plugins/recruitment/frontend/init.tsx
import React from 'react';
import { registry } from '@campus-os/shared/plugin-registry';
import type { SlotContextMap } from '@campus-os/shared/slot-catalog';

// Define your React widget receiving slot context
export function RecruitmentStatsWidget({
  context
}: {
  context?: SlotContextMap['dashboard-stats'];
}) {
  return (
    <div className="p-4 bg-card border rounded-lg shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground">
        Active Campaigns
      </h3>
      <p className="text-2xl font-bold mt-1">4 Open Positions</p>
    </div>
  );
}

// Register inside initFrontend
export function initFrontend() {
  registry.registerWidget(
    'dashboard-stats', // Strongly typed slot identifier from slot-catalog
    'recruitment', // Plugin ID matching manifest name
    RecruitmentStatsWidget, // React component
    {
      priority: 25, // Renders before lower priority widgets
      condition: (ctx) => {
        // Only render if recruitment plugin is active or user has permissions
        return true;
      }
    }
  );
}
```

---

## 3. Host Page Extension Point Consumption

Host pages render extension slots using the `<ExtensionPoint>` component from `@campus-os/shared/extension-point`. Each slot is automatically wrapped with an isolated React Error Boundary (`ExtensionErrorBoundary`) and CSS containment:

```tsx
import { ExtensionPoint } from '@campus-os/shared/extension-point';

export function DashboardPage({ activePlugins, user }) {
  return (
    <div className="space-y-6">
      {/* Extension Point passes typed context and filters by activePlugins */}
      <ExtensionPoint
        id="dashboard-stats"
        context={{ activePlugins }}
        activePlugins={activePlugins}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        fallback={<div>Loading stats...</div>}
      />
    </div>
  );
}
```

---

## 4. Teardown and Unregistration

When a plugin is unloaded dynamically, its widgets and navigation links are safely pruned from the registry:

```typescript
import { registry } from '@campus-os/shared/plugin-registry';

// Unregister a specific widget
registry.unregisterWidget('dashboard-stats', 'recruitment');

// Or unregister all widgets and sidebar links registered by this plugin
registry.unregisterWidgetsByPlugin('recruitment');
```

---

## 5. Official Slot Identifiers

For the complete list of strongly typed slots, parameters, and context contracts, see the **[Extension Slots Catalog](./SLOT_CATALOG.md)**.
