import React from 'react';
import type { CampusOSSlotId } from './slot-catalog.ts';

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

  /**
   * Register a link in the main navigation sidebar
   */
  registerSidebarLink(link: SidebarLink) {
    this.sidebarLinks.push(link);
  }

  /**
   * Get all registered sidebar links
   */
  getSidebarLinks(): SidebarLink[] {
    return this.sidebarLinks;
  }

  /**
   * Register a widget to be injected at a specific extension point slot.
   * Supports optional priority (higher renders first) and conditional rendering predicates.
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
    const entry: WidgetRegistration<TContext> = {
      pluginId,
      component,
      priority: options?.priority ?? 0,
      condition: options?.condition,
      metadata: options?.metadata
    };
    this.widgets.get(extensionPointId)!.push(entry as WidgetRegistration<any>);
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
    return filtered.length < initialLen;
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
    return removed;
  }

  /**
   * Clear all registrations in the registry (useful for test isolation).
   */
  clear() {
    this.sidebarLinks = [];
    this.widgets.clear();
  }
}

// Global singleton registry
export const registry = new PluginRegistry();
