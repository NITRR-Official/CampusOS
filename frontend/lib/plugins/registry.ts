import React from 'react';

export interface SidebarLink {
  pluginId: string;
  title: string;
  url: string;
  icon?: string;
  context?: 'global' | 'workspace';
}

export interface WidgetRegistration {
  pluginId: string;
  component: React.ComponentType<{ context?: unknown }>;
}

class PluginRegistry {
  private sidebarLinks: SidebarLink[] = [];
  private widgets: Map<string, WidgetRegistration[]> = new Map();

  /**
   * Register a link in the main navigation sidebar
   */
  registerSidebarLink(link: SidebarLink) {
    this.sidebarLinks.push(link);
  }

  /**
   * Get all registered sidebar links
   */
  getSidebarLinks() {
    return this.sidebarLinks;
  }

  /**
   * Register a widget to be injected at a specific extension point
   */
  registerWidget(
    extensionPointId: string,
    pluginId: string,
    component: React.ComponentType<{ context?: unknown }>
  ) {
    if (!this.widgets.has(extensionPointId)) {
      this.widgets.set(extensionPointId, []);
    }
    this.widgets.get(extensionPointId)!.push({ pluginId, component });
  }

  /**
   * Get all widgets registered for a specific extension point
   */
  getWidgets(extensionPointId: string): WidgetRegistration[] {
    return this.widgets.get(extensionPointId) || [];
  }
}

// Global singleton registry
export const registry = new PluginRegistry();
