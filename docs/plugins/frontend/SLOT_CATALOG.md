# CampusOS Extension Slot Catalog & Context Specification

CampusOS uses a decentralized **Slot-Fill Micro-UI Pattern** that allows plugins to inject custom React widgets into core pages without modifying host platform templates.

Each slot provides a CSS Container Context (`@container`) and isolates mounted widgets with dedicated React Error Boundaries (`ExtensionErrorBoundary`).

---

## 1. Official Extension Slots Catalog

The following table lists all official extension points available in CampusOS:

| Slot ID                  | Core Location                | Layout Format                | Context Object (`context`)        | Purpose                                                               |
| ------------------------ | ---------------------------- | ---------------------------- | --------------------------------- | --------------------------------------------------------------------- |
| `dashboard-top`          | `/dashboard` (Top banner)    | Full-width container         | `{ dashboard: true }`             | Announcements, critical notices, welcome banners                      |
| `dashboard-stats`        | `/dashboard` (Metrics row)   | 4-column responsive grid     | `{ activePlugins: string[] }`     | KPI counters, summaries, quick analytics cards                        |
| `dashboard-actions`      | `/dashboard` (Quick Actions) | 4-column responsive grid     | `{}`                              | Quick-action shortcut cards (e.g., "Create Event", "Submit Form")     |
| `dashboard-activity`     | `/dashboard` (Activity feed) | Vertical stack (`space-y-4`) | `{}`                              | Real-time notifications, audit feed entries                           |
| `profile-tabs`           | `/profile` (My Campus Life)  | Vertical stack / tab panes   | `{ user: { name, email, role } }` | User-centric activity (e.g. "My Registrations", "My Clubs")           |
| `profile-header-actions` | `/profile` (Action bar)      | Horizontal inline row        | `{ user: { id, role } }`          | Action buttons (e.g., "Export Data", "Settings")                      |
| `club-header-actions`    | Club details header          | Horizontal inline row        | `{ clubId, slug, userRole }`      | Club interaction buttons (e.g., "Apply for Club", "Join Discussion")  |
| `club-tabs`              | Club details page            | Tab view pane                | `{ clubId, slug }`                | Tab panels (e.g., "Club Events", "Club Budget", "Roster")             |
| `event-details-sidebar`  | Event details page           | Right-hand sidebar           | `{ eventId }`                     | Event widgets (e.g., "Registered Attendees", "Sponsors", "Live Poll") |
| `navbar-actions`         | Global header                | Inline flex row              | `{}`                              | Top-level icon buttons or indicator badges                            |
| `sidebar-bottom`         | Global sidebar               | Vertical stack               | `{}`                              | Utility links, storage quota badges, plugin status                    |

---

## 2. Registering a Widget

Plugins register widgets during frontend initialization:

```tsx
import React from 'react';
import { registry } from '@campus-os/shared/plugin-registry';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@campusos/design-system';

interface ProfileContext {
  user?: {
    name: string;
    role: string;
  };
}

export function RecruitmentProfileWidget({
  context
}: {
  context?: ProfileContext;
}) {
  return (
    <Card className="p-4 @sm:p-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Active Applications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Hello {context?.user?.name}, you have 2 pending club recruitment
          applications.
        </p>
      </CardContent>
    </Card>
  );
}

// Register into the 'profile-tabs' slot with priority and condition
registry.registerWidget<ProfileContext>(
  'profile-tabs',
  'recruitment',
  RecruitmentProfileWidget,
  {
    priority: 80, // Higher numbers render first (default is 0)
    condition: (ctx) => ctx?.user?.role === 'student', // Only show for students
    metadata: { title: 'Applications' }
  }
);
```

---

## 3. Container Queries & CSS Isolation

Every `<ExtensionPoint />` establishes a CSS Container Context using `container-type: inline-size` and Tailwind v4 `@container`:

> [!IMPORTANT]
> **Do not use viewport `@media` queries in widgets.** Viewport media queries (`@media (min-width: 768px)`) reflect the browser window size, NOT the slot size. When placed in a 300px sidebar or grid column, a widget relying on `@media` will overflow.

Instead, use container query utilities:

```tsx
// Good: Styles adapt to the widget slot's container width!
<div className="flex flex-col @sm:flex-row items-start @sm:items-center justify-between gap-2">
  <span className="text-xs @md:text-sm">Metric Title</span>
  <span className="text-sm @md:text-lg font-bold">1,240</span>
</div>
```

### Stacking and Isolation Safeguards

`<ExtensionPoint />` automatically applies:

- `isolate`: Establishes a new local stacking context so z-indexes do not interfere with the host.
- `overflow-hidden`: Prevents miscalculated child widths from causing page horizontal scrollbars.

If your widget needs to display a floating popover or dropdown, use portal-based components from `@campusos/design-system` (`Dialog`, `DropdownMenu`, `Tooltip`), which escape the container via React Portals.

---

## 4. Error Isolation & Fault Tolerance

CampusOS wraps every mounted widget in an `ExtensionErrorBoundary`:

- If an uncaught JavaScript error occurs during rendering in Plugin A's widget, Plugin A's slot collapses or displays a fallback.
- **Sibling widgets from Plugin B and the host page continue running normally.**
- In development mode (`NODE_ENV !== 'production'`), a visual indicator identifies which plugin failed and in which slot.
