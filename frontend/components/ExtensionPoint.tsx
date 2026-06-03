'use client';

import React from 'react';
import { registry } from '../lib/plugins/registry';

interface ExtensionPointProps {
  id: string;
  context?: any;
  className?: string;
  activePlugins?: string[];
}

/**
 * An ExtensionPoint allows plugins to dynamically inject their own React components
 * into core CampusOS pages without modifying the core codebase.
 */
export function ExtensionPoint({ id, context, className = "contents", activePlugins }: ExtensionPointProps) {
  let Widgets = registry.getWidgets(id);
  
  if (activePlugins) {
    Widgets = Widgets.filter(w => activePlugins.includes(w.pluginId));
  }

  if (Widgets.length === 0) {
    return null;
  }

  return (
    <div className={className} data-extension-id={id}>
      {Widgets.map((WidgetData, i) => {
        const Component = WidgetData.component;
        return <Component key={i} context={context} />;
      })}
    </div>
  );
}
