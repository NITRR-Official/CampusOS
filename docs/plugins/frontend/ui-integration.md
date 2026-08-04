# UI Integration & Widgets

In CampusOS, plugins can inject UI components seamlessly into the Next.js frontend by using the global **Frontend Registry**.

Every frontend plugin must export an `initFrontend` function from `frontend/init.ts` (or `.tsx`). The CampusOS CLI Installer will automatically execute this function during the application boot process.

## 1. Registering Sidebar Links

You can add a link to the main navigation sidebar.

```typescript
import { registry } from '@/lib/plugins/registry';

export function initFrontend() {
  registry.registerSidebarLink({
    pluginId: 'recruitment',
    title: 'Interviews',
    url: '/interviews',
    icon: 'Calendar' // Lucide-React icon name
  });
}
```

## 2. Registering Dashboard Widgets

You can inject React components straight into the Club Dashboard!

CampusOS defines several "Widget Zones" (e.g., `dashboard-stats`, `dashboard-actions`). You can bind your component to these zones.

```tsx
import { registry } from '@/lib/plugins/registry';
import React from 'react';

// Define your React component
export function RecruitmentStatsWidget() {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2>Pending Applications: 12</h2>
    </div>
  );
}

// Register it
export function initFrontend() {
  registry.registerWidget(
    'dashboard-stats', // The zone to inject into
    'recruitment', // Your plugin ID
    RecruitmentStatsWidget
  );
}
```

> [!TIP]
> Make sure your `init.ts` exports `initFrontend`! If it doesn't, the CLI Installer will wire it up, but Next.js will throw an error when it tries to call it.
