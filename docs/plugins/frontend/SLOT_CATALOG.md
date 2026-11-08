# CampusOS Extension Slot Catalog & Developer Specification

This catalog defines the official **Extension Point Slots** available throughout the CampusOS core frontend shell. Plugins can inject widgets, action buttons, and secondary panels into these slots at runtime using the `PluginRegistry` API.

---

## 🎯 Architecture Overview

Extension points are mounted in core pages using the `<ExtensionPoint id="..." context={...} />` component.
Every slot guarantees:

1. **Isolated Error Boundaries:** A rendering error in one plugin widget never crashes other widgets or the host core page.
2. **Dynamic Teardown:** When a plugin is disabled or uninstalled, its widgets are immediately unmounted from all active slots without requiring a page refresh.
3. **Context Injection:** Core layouts inject contextual metadata (e.g. `clubId`, `userRole`, `eventId`) directly into child widgets.

---

## 📋 Official Slot Reference Table

| Slot ID                  | Host Location              | Layout / Dimensions                 | Context Payload (`props.context`) | Recommended Usage                                           |
| :----------------------- | :------------------------- | :---------------------------------- | :-------------------------------- | :---------------------------------------------------------- |
| `dashboard-top`          | Main Dashboard Top         | Full width banner (`col-span-full`) | `{ dashboard: true }`             | Announcements, critical notices, alert banners              |
| `dashboard-stats`        | Dashboard Stats Row        | Grid card (`min-w-[240px]`)         | `{ activePlugins: string[] }`     | Numerical metric cards, KPI counters, quick summaries       |
| `dashboard-actions`      | Dashboard Actions Bar      | Inline flex items (`gap-2`)         | `{}`                              | 1-click action buttons (e.g., "Create Ticket", "Book Room") |
| `dashboard-activity`     | Dashboard Feed Area        | Vertical list item                  | `{}`                              | Live event feeds, recent transaction logs, timeline entries |
| `profile-tabs`           | User Profile View          | Tab panel container                 | `{ user: { name, email, role } }` | Custom user profile tabs (e.g. "Certificates", "Badges")    |
| `profile-header-actions` | Profile Header             | Flex button row                     | `{ user: { id, role } }`          | User moderation actions, export profile, send message       |
| `club-header-actions`    | Club / Workspace Header    | Flex action row                     | `{ clubId, slug, userRole }`      | Workspace actions ("Join Club", "Manage Budget", "Audit")   |
| `club-tabs`              | Club / Workspace View      | Full tab panel                      | `{ clubId, slug }`                | Custom club tabs (e.g. "Treasury", "Equipment", "Voting")   |
| `event-details-sidebar`  | Event Details Page         | Sidebar panel (`w-80`)              | `{ eventId }`                     | Event sponsors widget, live attendance check-in counter     |
| `navbar-actions`         | Top App Navigation Bar     | Inline icon buttons (`size-8`)      | `{}`                              | Global quick-actions, notifications, switcher               |
| `sidebar-bottom`         | Primary App Sidebar Footer | Vertical item list                  | `{}`                              | Help links, plugin status indicators, version labels        |

---

## 💻 Developer Implementation Guide

### 1. Registering a Widget into a Slot

Plugins register micro-frontends into slots during their frontend initialization entrypoint (`frontend/init.ts`):

```tsx
import React from 'react';
import { registry } from '@campus-os/shared/plugin-registry';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button
} from '@campusos/design-system';
import { Trophy } from 'lucide-react';

export function initFrontend() {
  // Register a Metric Widget in the Dashboard Stats Row
  registry.registerWidget(
    'dashboard-stats',
    function HackathonStatWidget({ context }) {
      return (
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm p-4">
          <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Active Hackathons
            </CardTitle>
            <Trophy className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="text-2xl font-bold">3</div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Next submission deadline in 4 hours
            </p>
          </CardContent>
        </Card>
      );
    },
    { pluginId: 'hackathon-portal', priority: 10 }
  );

  // Register a Custom Tab in the Club Workspace
  registry.registerWidget(
    'club-tabs',
    function ClubTreasuryTab({ context }) {
      const { clubId, slug } = context;
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold">
            Treasury & Ledger for {slug}
          </h2>
          <p className="text-xs text-muted-foreground">Club ID: {clubId}</p>
        </div>
      );
    },
    { pluginId: 'budget-planner' }
  );
}
```

---

### 2. Registering Navigation Links

In addition to slot widgets, plugins can mount links directly into the core navigation sidebar:

```tsx
import { registry } from '@campus-os/shared/plugin-registry';

export function initFrontend() {
  registry.registerSidebarLink(
    {
      label: 'Hackathons',
      url: '/plugins/hackathon-portal',
      icon: 'Trophy' // Dynamically resolved via Lucide
    },
    'hackathon-portal'
  );
}
```

---

### 3. Slot Error Boundary & Crash Isolation

When a widget throws an unhandled JavaScript exception, `<ExtensionPoint />` automatically captures the error, suppresses propagation to the parent dashboard, and renders a fallback UI:

```tsx
// Handled automatically by CampusOS <ExtensionPoint />
<ExtensionPoint id="dashboard-stats" fallback={<CustomErrorFallback />} />
```

If no custom fallback is provided, the slot gracefully displays a subtle error pill with an option to inspect details, preventing layout collapse.
