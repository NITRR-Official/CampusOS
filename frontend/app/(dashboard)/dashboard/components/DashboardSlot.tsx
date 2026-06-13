'use client';

import * as React from 'react';
import { registry } from '@/lib/plugins/registry';
import { initializePlugins } from '@/lib/plugins/init';

// Ensure plugin widgets are registered on the client before we read the registry.
initializePlugins();

interface DashboardSlotProps {
  /** Extension point id, e.g. "dashboard-stats" or "dashboard-actions". */
  extensionId: string;
  /** Plugins currently enabled (from the backend). Filters registered widgets. */
  activePlugins?: string[];
  context?: unknown;
  /** Static/mock fallback rendered when no active plugin fills this slot. */
  children: React.ReactNode;
}

/**
 * Renders plugin-provided widgets for an extension point when any active plugin
 * registers them, otherwise falls back to the static mock content passed as
 * `children`. This prevents the dashboard from showing duplicate cards (mock +
 * plugin) for the same slot while keeping a complete UI when no plugins are on.
 *
 * A mount gate keeps the server render and first client render identical (both
 * show the fallback), avoiding hydration mismatches; plugin widgets swap in
 * after mount once the client-side registry is populated.
 */
export function DashboardSlot({
  extensionId,
  activePlugins,
  context,
  children
}: DashboardSlotProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  let widgets = registry.getWidgets(extensionId);
  if (activePlugins) {
    widgets = widgets.filter((w) => activePlugins.includes(w.pluginId));
  }

  if (widgets.length === 0) {
    return <>{children}</>;
  }

  return (
    <>
      {widgets.map((widget, i) => {
        const Component = widget.component;
        return <Component key={i} context={context} />;
      })}
    </>
  );
}
