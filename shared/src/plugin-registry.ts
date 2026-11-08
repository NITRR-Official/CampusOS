import React from 'react';
import type { CampusOSSlotId } from '@campus-os/shared/slot-catalog';

export interface SidebarLink {
  pluginId: string;
  title: string;
  url: string;
  icon?: string;
  context?: 'global' | 'workspace';
}

export interface WidgetOptions<TContext = unknown> {
  /**
   * Priority score determining rendering order in the slot.
   * Higher priority numbers render before lower priority numbers.
   * Defaults to 0.
   */
  priority?: number;
  /**
   * Predicate determining whether this widget should render for a given context.
   */
  condition?: (context?: TContext) => boolean;
  /**
   * Arbitrary developer metadata associated with the widget registration.
   */
  metadata?: Record<string, unknown>;
}

export interface WidgetRegistration<TContext = unknown> {
  pluginId: string;
  component: React.ComponentType<{ context?: TContext }>;
  priority?: number;
  condition?: (context?: TContext) => boolean;
  metadata?: Record<string, unknown>;
}

export class PluginRegistry {
  private sidebarLinks: SidebarLink[] = [];
  private widgets: Map<string, WidgetRegistration<any>[]> = new Map();
  private listeners: Set<() => void> = new Set();

  /**
   * Subscribe to registry changes (widgets or sidebar links added/removed).
   * @param listener Callback invoked when registrations change.
   * @returns Unsubscribe cleanup function.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error(
            '[CampusOS:PluginRegistry] Listener notification failed:',
            err
          );
        }
      }
    }
  }

  /**
   * Register a link in the main navigation sidebar.
   * Automatically deduplicates by pluginId and URL.
   */
  registerSidebarLink(link: SidebarLink) {
    const existingIndex = this.sidebarLinks.findIndex(
      (l) => l.pluginId === link.pluginId && l.url === link.url
    );
    if (existingIndex !== -1) {
      this.sidebarLinks[existingIndex] = link;
    } else {
      this.sidebarLinks.push(link);
    }
    this.notify();
  }

  /**
   * Unregister sidebar links for a plugin (optionally targeting a specific URL).
   */
  unregisterSidebarLink(pluginId: string, url?: string): boolean {
    const initialLen = this.sidebarLinks.length;
    this.sidebarLinks = this.sidebarLinks.filter((l) => {
      if (l.pluginId !== pluginId) return true;
      if (url && l.url !== url) return true;
      return false;
    });
    const changed = this.sidebarLinks.length < initialLen;
    if (changed) {
      this.notify();
    }
    return changed;
  }

  /**
   * Get all registered sidebar links
   */
  getSidebarLinks(): SidebarLink[] {
    return [...this.sidebarLinks];
  }

  /**
   * Register a widget to be injected at a specific extension point slot.
   * Supports optional priority (higher renders first) and conditional rendering predicates.
   * Automatically deduplicates if the same component or metadata.id is re-registered by the plugin.
   */
  registerWidget<TContext = unknown>(
    extensionPointId: CampusOSSlotId,
    pluginId: string,
    component: React.ComponentType<{ context?: TContext }>,
    options?: WidgetOptions<TContext>
  ) {
    if (!this.widgets.has(extensionPointId)) {
      this.widgets.set(extensionPointId, []);
    }
    const list = this.widgets.get(extensionPointId)!;
    const entry: WidgetRegistration<TContext> = {
      pluginId,
      component,
      priority: options?.priority ?? 0,
      condition: options?.condition,
      metadata: options?.metadata
    };

    const existingIndex = list.findIndex(
      (w) =>
        w.pluginId === pluginId &&
        (w.component === component ||
          (options?.metadata?.id && w.metadata?.id === options.metadata.id))
    );

    if (existingIndex !== -1) {
      list[existingIndex] = entry as WidgetRegistration<any>;
    } else {
      list.push(entry as WidgetRegistration<any>);
    }

    this.notify();
  }

  /**
   * Get all widgets registered for a specific extension point slot,
   * sorted descending by priority (higher priority rendered first).
   */
  getWidgets<TContext = unknown>(
    extensionPointId: CampusOSSlotId
  ): WidgetRegistration<TContext>[] {
    const list = this.widgets.get(extensionPointId) || [];
    return [...list].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    ) as WidgetRegistration<TContext>[];
  }

  /**
   * Unregister a single widget from a slot for a given plugin.
   */
  unregisterWidget(
    extensionPointId: CampusOSSlotId,
    pluginId: string
  ): boolean {
    const list = this.widgets.get(extensionPointId);
    if (!list) return false;
    const initialLen = list.length;
    const filtered = list.filter((w) => w.pluginId !== pluginId);
    this.widgets.set(extensionPointId, filtered);
    const changed = filtered.length < initialLen;
    if (changed) {
      this.notify();
    }
    return changed;
  }

  /**
   * Unregister all widgets and sidebar links registered by a plugin (called during plugin teardown).
   */
  unregisterWidgetsByPlugin(pluginId: string): number {
    let removed = 0;
    for (const [id, list] of this.widgets.entries()) {
      const filtered = list.filter((w) => w.pluginId !== pluginId);
      removed += list.length - filtered.length;
      this.widgets.set(id, filtered);
    }
    this.sidebarLinks = this.sidebarLinks.filter(
      (l) => l.pluginId !== pluginId
    );
    if (removed > 0) {
      this.notify();
    }
    return removed;
  }

  /**
   * Alias for unregisterWidgetsByPlugin (called during dynamic plugin uninstall/disable).
   */
  unregisterPlugin(pluginId: string): number {
    return this.unregisterWidgetsByPlugin(pluginId);
  }

  /**
   * Clear all registrations in the registry (useful for test isolation).
   */
  clear() {
    this.sidebarLinks = [];
    this.widgets.clear();
    this.notify();
  }
}

// Global singleton registry
export const registry = new PluginRegistry();
