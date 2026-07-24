# Dashboard Integration Guide

CampusOS provides a dynamic dashboard where plugins can register their own statistics, quick actions, and activity feeds. This guide explains how to hook your plugin into the global dashboard.

## 1. Registering Dashboard Stats

To display stats (e.g., "Total Clubs: 10") on the global dashboard, you must register a **Stat Provider** in your backend plugin and create a **Stat Widget** in your frontend plugin.

### Backend

In your plugin's backend `index.js`, use the `registry.registerStatProvider` method. You provide a unique key for your plugin and an async function that returns an object containing your stats.

```javascript
// plugins/my-plugin/backend/src/index.js
export async function init(app, registry, eventBus) {
  // ... other initialization ...

  registry.registerStatProvider('my-plugin', async (user) => {
    try {
      if (!user) return { items: 0 };

      // Fetch stats relevant to the currently logged in user
      const itemsCount = await MyModel.countDocuments({
        userId: user.id,
        status: 'active'
      });
      return { items: itemsCount };
    } catch (err) {
      console.error('Error fetching my-plugin stats:', err);
      return { items: 0 };
    }
  });
}
```

This stat will now be automatically aggregated and exposed by the core system at `GET /api/v1/system/stats`.

### Frontend

In your frontend plugin, create a React widget that fetches the aggregated stats from `/api/v1/system/stats`.

```tsx
// plugins/my-plugin/frontend/dashboard.tsx
import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '@campus-os/shared/api-client';
import { Activity } from 'lucide-react';

export function MyStatWidget() {
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/system/stats`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data.data?.['my-plugin']?.items !== undefined) {
          setCount(data.data['my-plugin'].items);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg p-6 flex items-center gap-4 shadow-sm border border-border/60">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
        <Activity className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase font-semibold">
          Active Items
        </p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </div>
  );
}
```

Then, register this widget in your frontend `init.ts`:

```typescript
// plugins/my-plugin/frontend/init.ts
import { registry } from '@campus-os/shared/plugin-registry';
import { MyStatWidget } from './dashboard';

export function initFrontend() {
  registry.registerWidget('dashboard-stats', 'my-plugin', MyStatWidget);
}
```

## 2. Registering Quick Actions

Quick Actions allow users to perform common tasks directly from the dashboard (e.g., "Create Club", "Schedule Event").
If your plugin provides a Quick Action, create a Widget that uses Next.js routing (like `<Link>`) or triggers a modal. **Avoid creating "dummy" buttons that do nothing.**

```tsx
// plugins/my-plugin/frontend/dashboard.tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';

export function MyQuickActionWidget() {
  return (
    <Link
      href="/my-plugin/create"
      className="group flex flex-col items-center justify-center gap-4 p-6 bg-card/80 rounded-xl border border-border/60 shadow-sm hover:border-primary/50 transition-all"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-blue-500 group-hover:text-white transition-colors">
        <Plus className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold text-foreground">Create Item</span>
    </Link>
  );
}
```

Register it in `init.ts`:

```typescript
// plugins/my-plugin/frontend/init.ts
import { registry } from '@campus-os/shared/plugin-registry';
import { MyQuickActionWidget } from './dashboard';

export function initFrontend() {
  registry.registerWidget(
    'dashboard-actions',
    'my-plugin',
    MyQuickActionWidget
  );
}
```
