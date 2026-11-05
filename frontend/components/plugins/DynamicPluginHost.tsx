'use client';

import React, { useState, useEffect, useCallback, Component } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@campusos/design-system';
import { loadPluginBundle } from '@/lib/plugins/runtime-env';

export interface DynamicPluginHostProps {
  pluginName: string;
  bundleUrl?: string;
  cssUrl?: string;
  componentName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>;
  fallback?: React.ReactNode;
  errorFallback?: (error: Error, retry: () => void) => React.ReactNode;
  className?: string;
}

interface ErrorBoundaryProps {
  pluginName: string;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  onRetry: () => void;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class PluginErrorBoundary extends Component<
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
    console.error(
      `[PluginErrorBoundary] Crash in plugin '${this.props.pluginName}':`,
      error,
      errorInfo
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="font-semibold text-base">
              Plugin Render Failed ({this.props.pluginName})
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {this.state.error.message ||
              'An unexpected runtime error occurred inside this plugin.'}
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleRetry}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry Plugin
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * DynamicPluginHost loads and renders a plugin's pre-compiled ESM bundle at runtime (ADR-014).
 * Eliminates the need to rebuild Next.js when new plugins are installed.
 */
export function DynamicPluginHost({
  pluginName,
  bundleUrl,
  cssUrl,
  componentName = 'default',
  props = {},
  fallback,
  errorFallback,
  className
}: DynamicPluginHostProps) {
  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  const fetchBundle = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      // 1. Optionally attach CSS bundle if provided or available
      const baseApiUrl =
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const resolvedCssUrl =
        cssUrl || `${baseApiUrl}/api/v1/plugins/${pluginName}/bundle.css`;

      const linkId = `plugin-style-${pluginName}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = resolvedCssUrl;
        // Ignore css 404s quietly
        link.onerror = () => link.remove();
        document.head.appendChild(link);
      }

      // 2. Load and evaluate standalone ES module
      const pluginModule = await loadPluginBundle(pluginName, bundleUrl);
      if (!pluginModule) {
        throw new Error(`Module evaluation returned empty for '${pluginName}'`);
      }

      const TargetComponent =
        pluginModule[componentName] ||
        pluginModule.default ||
        (componentName !== 'default' ? pluginModule.default : null);

      if (!TargetComponent) {
        throw new Error(
          `Plugin '${pluginName}' does not export component '${componentName}' or a default export.`
        );
      }

      setLoadedComponent(() => TargetComponent);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err
          : new Error(`Failed to load plugin: ${String(err)}`)
      );
    } finally {
      setLoading(false);
    }
  }, [pluginName, bundleUrl, cssUrl, componentName]);

  useEffect(() => {
    fetchBundle();
  }, [fetchBundle, attempt]);

  const handleRetry = useCallback(() => {
    setAttempt((prev) => prev + 1);
  }, []);

  if (loading) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-border p-6 text-muted-foreground">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">
            Loading {pluginName} plugin...
          </span>
        </div>
      </div>
    );
  }

  if (loadError) {
    if (errorFallback) {
      return <>{errorFallback(loadError, handleRetry)}</>;
    }

    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="font-semibold text-base">
            Failed to Load Plugin ({pluginName})
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {loadError.message}
        </p>
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!LoadedComponent) {
    return null;
  }

  return (
    <PluginErrorBoundary
      pluginName={pluginName}
      fallback={errorFallback}
      onRetry={handleRetry}
    >
      <div className={className}>
        <LoadedComponent {...props} />
      </div>
    </PluginErrorBoundary>
  );
}

export default DynamicPluginHost;
