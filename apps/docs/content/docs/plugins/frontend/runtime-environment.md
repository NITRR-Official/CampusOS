---
title: 'Plugin Frontend Runtime Environment'
---

# Plugin Frontend Runtime Environment

CampusOS provides a lightweight browser runtime bridge (`window.CampusOS` and `window.__CampusOS_Runtime__`) that supplies plugins with core libraries and UI components at runtime.

This design enables **Zero-Rebuild Plugin Architecture** (ADR-014), where plugin frontends are compiled into standalone ESM bundles (`bundle.esm.js`) without bundling React or the full design system.

---

## 1. Exposed Host Globals

When the host application initializes (`setupPluginRuntime()`), the following APIs are attached to `window.CampusOS`:

| Property         | Description                                                                          |
| ---------------- | ------------------------------------------------------------------------------------ |
| `React`          | Host React 19 instance                                                               |
| `ReactDOM`       | Host ReactDOM 19 instance                                                            |
| `registry`       | Central plugin registry for registering routes, widgets, sidebar items, and settings |
| `ExtensionPoint` | React component for mounting extension slot widgets                                  |
| `ui`             | Complete `@campusos/design-system` export suite                                      |
| `version`        | CampusOS runtime environment version (e.g. `1.0.0`)                                  |
| `loadedPlugins`  | Set of currently mounted runtime plugin IDs                                          |

---

## 2. Using `@campusos/design-system` in Plugins

Plugin developers can write standard TypeScript/JSX imports:

```tsx
import React from 'react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  useToast
} from '@campusos/design-system';
import { registry } from '@campus-os/shared';

export default function MyPluginWidget() {
  const { toast } = useToast();

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Plugin Overview</CardTitle>
        <Badge variant="secondary">Active</Badge>
      </CardHeader>
      <CardContent>
        <Button onClick={() => toast({ title: 'Action executed' })}>
          Trigger
        </Button>
      </CardContent>
    </Card>
  );
}
```

### Supported Components

All production UI components in `@campusos/design-system` are provided by the host:

- **Layout & Structure:** `Card`, `Sidebar`, `Separator`, `ScrollArea`, `Sheet`, `Dialog`
- **Actions & Controls:** `Button`, `Checkbox`, `Input`, `Textarea`, `Select`, `DropdownMenu`
- **Feedback & Status:** `Badge`, `Toast`, `Skeleton`, `Tooltip`
- **Data Display:** `Table`, `Avatar`, `Breadcrumb`
- **Utilities:** `cn`, `useToast`, `useSidebar`

---

## 3. How the Bundler Works

The frontend build script (`scripts/build-plugin-frontend.js`) intercepts imports to `@campusos/design-system` and `@campus-os/shared`:

```bash
pnpm plugin:build-frontend <plugin-name>
```

1. **Virtual Shimming:** During `esbuild` compilation, imports to `@campusos/design-system` are intercepted by `hostVirtualModulesPlugin` and resolved to `window.CampusOS.ui` / `window.__CampusOS_DesignSystem__`.
2. **Minimal Bundle Size:** Because React and the design system are not bundled inside the plugin, bundle size drops from >300KB down to **< 15KB**.
3. **No Bare Module Specifier Errors:** In native browser ESM (`import(url)`), bare specifiers like `import { Button } from '@campusos/design-system'` cause browser syntax errors. The virtual shim replaces them with global runtime references, making the bundle 100% native ESM compatible.
4. **Theme Synchronization:** Plugins automatically adopt the host's dark/light mode theme and CSS variables without extra configuration.
