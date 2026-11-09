'use client';

import React from 'react';
import { registry } from '@campus-os/shared/plugin-registry';
import type {
  CampusOSSlotId,
  SlotContextMap
} from '@campus-os/shared/slot-catalog';

export interface FallbackWidgetProps {
  error: Error;
  pluginId: string;
  slotId: CampusOSSlotId;
}

export interface ExtensionPointProps<
  TSlot extends CampusOSSlotId = CampusOSSlotId
> {
  /**
   * The identifier of the extension slot (e.g. 'dashboard-stats', 'profile-tabs').
   */
  id: TSlot;
  /**
   * Dynamic contextual payload passed down to all mounted widgets in this slot.
   */
  context?: TSlot extends keyof SlotContextMap
    ? SlotContextMap[TSlot]
    : unknown;
  /**
   * Optional outer container CSS class name.
   */
  className?: string;
  /**
   * Optional individual widget slot container CSS class name. Defaults to 'contents'.
   */
  containerClassName?: string;
  /**
   * List of currently active plugin IDs. Only widgets registered by active plugins are rendered.
   */
  activePlugins?: string[];
  /**
   * Optional fallback content rendered if no widgets match, or all fail active/condition checks.
   */
  fallback?: React.ReactNode;
  /**
   * Optional custom error renderer when a widget throws during execution.
   */
  fallbackWidget?: (props: FallbackWidgetProps) => React.ReactNode;
  /**
   * Whether to apply CSS style isolation (`isolate overflow-hidden`). Defaults to true.
   */
  isolate?: boolean;
}

interface ErrorBoundaryProps {
  pluginId: string;
  slotId: CampusOSSlotId;
  fallbackWidget?: (props: FallbackWidgetProps) => React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Isolated React Error Boundary that prevents individual widget render exceptions
 * from crashing the parent page or sibling widgets (Issue #125).
 */
export class ExtensionErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof console !== 'undefined' && console.error) {
      console.error(
        `[CampusOS:ExtensionPoint] Widget from plugin '${this.props.pluginId}' threw an error in slot '${this.props.slotId}':`,
        error,
        errorInfo
      );
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallbackWidget) {
        return this.props.fallbackWidget({
          error: this.state.error,
          pluginId: this.props.pluginId,
          slotId: this.props.slotId
        });
      }
      if (process.env.NODE_ENV !== 'production') {
        return (
          <div
            className="rounded border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-600 dark:text-red-400"
            data-extension-error={this.props.pluginId}
          >
            [Plugin Widget Error: {this.props.pluginId}] Failed in{' '}
            {this.props.slotId}
          </div>
        );
      }
      return null;
    }
    return this.props.children;
  }
}

/**
 * An ExtensionPoint allows plugins to dynamically inject micro-UI components
 * into core CampusOS pages with priority sorting, condition checks, container queries,
 * and resilient error isolation (Issues #125, #132).
 */
export function ExtensionPoint<TSlot extends CampusOSSlotId = CampusOSSlotId>({
  id,
  context,
  className = '',
  containerClassName = '',
  activePlugins,
  fallback = null,
  fallbackWidget,
  isolate = true
}: ExtensionPointProps<TSlot>) {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    return registry.subscribe(() => {
      setTick((prev) => prev + 1);
    });
  }, []);

  let widgets = registry.getWidgets(id);

  // Filter by active plugins if active list is provided
  if (activePlugins) {
    widgets = widgets.filter((w) => activePlugins.includes(w.pluginId));
  }

  // Filter by optional condition predicate
  widgets = widgets.filter((w) => {
    if (typeof w.condition === 'function') {
      try {
        return Boolean(w.condition(context));
      } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
          console.error(
            `[CampusOS:ExtensionPoint] Condition evaluation failed for plugin '${w.pluginId}' in slot '${id}':`,
            err
          );
        }
        return false;
      }
    }
    return true;
  });

  if (widgets.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  const isolationClasses = isolate ? 'isolate overflow-hidden' : '';
  const containerQueryClasses = '@container';
  const computedClassName = [containerQueryClasses, isolationClasses, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={computedClassName}
      data-extension-id={id}
      style={{ containerType: 'inline-size' }}
    >
      {widgets.map((widgetData, i) => {
        const Component = widgetData.component;
        return (
          <ExtensionErrorBoundary
            key={`${widgetData.pluginId}-${i}`}
            pluginId={widgetData.pluginId}
            slotId={id}
            fallbackWidget={fallbackWidget}
          >
            <div
              className={`widget-slot @container/slot ${containerClassName}`}
              data-plugin-widget={widgetData.pluginId}
            >
              <Component context={context} />
            </div>
          </ExtensionErrorBoundary>
        );
      })}
    </div>
  );
}
