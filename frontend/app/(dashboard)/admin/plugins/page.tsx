/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { apiClient } from '@campus-os/shared/api-client';
import { registry } from '@campus-os/shared/plugin-registry';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  useToast,
  CardSkeleton
} from '@campusos/design-system';
import {
  Search,
  Package,
  UploadCloud,
  Store,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Settings2
} from 'lucide-react';
import { PluginCapabilityBadge } from '@/components/admin/PluginCapabilityBadge';
import { PluginUploadDropzone } from '@/components/admin/PluginUploadDropzone';
import { MarketplaceGrid } from '@/components/marketplace/MarketplaceGrid';

interface PluginSettingsConfig {
  type: string;
  default: any;
  description: string;
  required?: boolean;
}

interface PluginConfigSchema {
  fields: Record<string, PluginSettingsConfig>;
}

interface PluginItem {
  id?: string;
  name: string;
  enabled: boolean;
  version?: string;
  tier?: 'core' | 'community' | string;
  trusted?: boolean;
  requestedCapabilities?: string[];
  grantedCapabilities?: string[];
  description?: string;
  settings: Record<string, any>;
  configSchema?: PluginConfigSchema | null;
}

type TabType = 'installed' | 'sideload' | 'marketplace';

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('installed');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedSettings, setExpandedSettings] = useState<
    Record<string, boolean>
  >({});

  const { toast } = useToast();

  // State for settings forms
  const [settingsValues, setSettingsValues] = useState<
    Record<string, Record<string, any>>
  >({});

  const loadPlugins = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<any>('/plugins');
      if (data && Array.isArray(data.plugins)) {
        setPlugins(data.plugins);

        // Initialize settings values
        const initialSettings: Record<string, Record<string, any>> = {};
        data.plugins.forEach((p: PluginItem) => {
          initialSettings[p.name] = { ...p.settings };
        });
        setSettingsValues(initialSettings);
      } else {
        setPlugins([]);
      }
    } catch (err: any) {
      toast({
        title: 'Failed to load plugins',
        description: err.message || 'An error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  async function handleToggle(pluginName: string, currentlyEnabled: boolean) {
    setActionLoading(`toggle-${pluginName}`);
    try {
      const nextState = !currentlyEnabled;
      await apiClient.put(`/plugins/${pluginName}/toggle`, {
        enabled: nextState
      });

      if (!nextState) {
        // Immediately unregister plugin from runtime to drop widgets in DOM without refresh (Issue #161)
        registry.unregisterPlugin(pluginName);
      } else {
        // Dynamic import runtime ESM bundle on the client
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          await import(
            /* webpackIgnore: true */ `/api/v1/plugins/${pluginName}/bundle.js`
          );
        } catch (bundleErr: any) {
          console.warn(
            `[AdminPlugins] Runtime bundle load notice for '${pluginName}':`,
            bundleErr.message
          );
        }
      }

      setPlugins((prev) =>
        prev.map((p) =>
          p.name === pluginName ? { ...p, enabled: nextState } : p
        )
      );

      toast({
        title: 'Status Updated',
        description: `Plugin '${pluginName}' has been ${nextState ? 'enabled' : 'disabled'}.`
      });
    } catch (err: any) {
      toast({
        title: 'Toggle failed',
        description: err.message || 'Failed to toggle plugin',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveSettings(pluginName: string) {
    setActionLoading(`save-${pluginName}`);
    try {
      const settings = settingsValues[pluginName] || {};
      await apiClient.patch(`/plugins/${pluginName}/settings`, { settings });
      toast({
        title: 'Settings Saved',
        description: `Configuration for '${pluginName}' updated successfully.`
      });
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRestartServer() {
    if (
      !window.confirm(
        'Are you sure you want to trigger a graceful server restart?'
      )
    ) {
      return;
    }
    setActionLoading('server-restart');
    try {
      await apiClient.post('/plugins/restart', {});
      toast({
        title: 'Server Restart Triggered',
        description:
          'The server process is restarting gracefully. Reloading in 3 seconds...'
      });
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (err: any) {
      toast({
        title: 'Restart failed',
        description: err.message || 'Failed to trigger restart',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(null);
    }
  }

  function handleSettingChange(pluginName: string, field: string, value: any) {
    setSettingsValues((prev) => ({
      ...prev,
      [pluginName]: {
        ...(prev[pluginName] || {}),
        [field]: value
      }
    }));
  }

  const toggleSettingsExpansion = (pluginName: string) => {
    setExpandedSettings((prev) => ({
      ...prev,
      [pluginName]: !prev[pluginName]
    }));
  };

  const handlePluginInstalled = (newPlugin: any) => {
    loadPlugins();
    setActiveTab('installed');
    // Attempt bundle import
    if (newPlugin?.name) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        import(
          /* webpackIgnore: true */ `/api/v1/plugins/${newPlugin.name}/bundle.js`
        );
      } catch (err: any) {
        console.warn(`[AdminPlugins] Bundle preload notice:`, err.message);
      }
    }
  };

  const filteredPlugins = useMemo(() => {
    return plugins.filter((p) => {
      const matchesSearch =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.requestedCapabilities || []).some((c) =>
          c.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTier =
        filterTier === 'all' ||
        (filterTier === 'core' && (p.tier === 'core' || p.trusted)) ||
        (filterTier === 'community' && p.tier !== 'core' && !p.trusted);

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'enabled' && p.enabled) ||
        (filterStatus === 'disabled' && !p.enabled);

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [plugins, searchQuery, filterTier, filterStatus]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="size-6 text-primary" />
            Plugin Management
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Super Admin control plane for zero-touch module sideloading, runtime
            capabilities, and hot-toggling.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestartServer}
            disabled={actionLoading === 'server-restart'}
            className="text-xs h-9 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw
              className={`size-3.5 mr-1.5 ${
                actionLoading === 'server-restart' ? 'animate-spin' : ''
              }`}
            />
            Restart Server
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-border/60 gap-4">
        <nav className="flex space-x-1 sm:space-x-4">
          <button
            onClick={() => setActiveTab('installed')}
            className={`py-3 px-3 sm:px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'installed'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            <Package className="size-4" />
            Installed Modules
            <Badge variant="secondary" className="ml-1 text-[11px] px-1.5 py-0">
              {plugins.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('sideload')}
            className={`py-3 px-3 sm:px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sideload'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            <UploadCloud className="size-4" />
            Sideload Package (.ZIP)
          </button>

          <button
            onClick={() => setActiveTab('marketplace')}
            className={`py-3 px-3 sm:px-4 text-sm font-medium border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'marketplace'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            <Store className="size-4" />
            Community Marketplace
          </button>
        </nav>
      </div>

      {/* TAB 1: INSTALLED PLUGINS */}
      {activeTab === 'installed' && (
        <div className="space-y-6">
          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search modules or permissions (e.g. 'db:rw')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                aria-label="Filter by tier"
                className="bg-background border border-input rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Tiers</option>
                <option value="core">Core Modules</option>
                <option value="community">Community Addons</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
                className="bg-background border border-input rounded-lg text-xs py-2 px-3 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton
                  key={i}
                  className="border-border/50 bg-card/50 backdrop-blur-sm h-64"
                />
              ))}
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border/80 rounded-xl bg-card/20">
              <Package className="size-10 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-base font-medium">No plugins found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? 'Try modifying your search or filters.'
                  : 'Get started by sideloading a package from the Sideload tab.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredPlugins.map((plugin) => {
                const isCore = plugin.tier === 'core' || plugin.trusted;
                const capabilities = plugin.requestedCapabilities || [];

                return (
                  <Card
                    key={plugin.name}
                    className="border-border/60 bg-card/50 backdrop-blur-sm flex flex-col justify-between hover:border-border transition-all shadow-sm"
                  >
                    <div>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base font-semibold capitalize">
                                {plugin.name}
                              </CardTitle>
                              {isCore && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 font-medium"
                                >
                                  <ShieldCheck className="size-3 mr-1" />
                                  Core
                                </Badge>
                              )}
                            </div>
                            {plugin.version && (
                              <CardDescription className="text-xs font-mono mt-0.5">
                                v{plugin.version}
                              </CardDescription>
                            )}
                          </div>

                          <Badge
                            variant="outline"
                            className={
                              plugin.enabled
                                ? 'text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800'
                                : 'text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-900/30 dark:border-slate-800'
                            }
                          >
                            {plugin.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4 pt-0">
                        {/* Capabilities / Permissions */}
                        <div>
                          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                            Declared Capabilities
                          </p>
                          {capabilities.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {capabilities.map((cap) => (
                                <PluginCapabilityBadge
                                  key={cap}
                                  capability={cap}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground/70 italic">
                              No special capabilities requested (sandboxed)
                            </p>
                          )}
                        </div>

                        {/* Config Schema Settings Accordion */}
                        {plugin.configSchema?.fields &&
                        Object.keys(plugin.configSchema.fields).length > 0 ? (
                          <div className="border-t border-border/50 pt-3 mt-3">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSettingsExpansion(plugin.name)
                              }
                              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center justify-between w-full py-1"
                            >
                              <span className="flex items-center gap-1.5">
                                <Settings2 className="size-3.5" />
                                Dynamic Settings (
                                {Object.keys(plugin.configSchema.fields).length}
                                )
                              </span>
                              <span>
                                {expandedSettings[plugin.name] ? '−' : '+'}
                              </span>
                            </button>

                            {expandedSettings[plugin.name] && (
                              <div className="space-y-3 pt-3">
                                {Object.entries(plugin.configSchema.fields).map(
                                  ([fieldKey, config]) => (
                                    <div key={fieldKey} className="space-y-1">
                                      <label className="text-[11px] font-medium capitalize text-muted-foreground">
                                        {fieldKey
                                          .replace(/([A-Z])/g, ' $1')
                                          .trim()}
                                      </label>
                                      {config.type === 'boolean' ? (
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="checkbox"
                                            checked={
                                              settingsValues[plugin.name]?.[
                                                fieldKey
                                              ] ?? config.default
                                            }
                                            onChange={(e) =>
                                              handleSettingChange(
                                                plugin.name,
                                                fieldKey,
                                                e.target.checked
                                              )
                                            }
                                            disabled={!plugin.enabled}
                                            className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                                          />
                                          <span className="text-[11px] text-muted-foreground">
                                            {config.description}
                                          </span>
                                        </div>
                                      ) : (
                                        <div>
                                          <input
                                            type={
                                              config.type === 'number'
                                                ? 'number'
                                                : 'text'
                                            }
                                            value={
                                              settingsValues[plugin.name]?.[
                                                fieldKey
                                              ] ?? config.default
                                            }
                                            onChange={(e) =>
                                              handleSettingChange(
                                                plugin.name,
                                                fieldKey,
                                                config.type === 'number'
                                                  ? Number(e.target.value)
                                                  : e.target.value
                                              )
                                            }
                                            disabled={!plugin.enabled}
                                            className="flex h-7 w-full rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                                            placeholder={`Enter ${fieldKey}`}
                                          />
                                          <p className="text-[10px] text-muted-foreground mt-0.5">
                                            {config.description}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )
                                )}
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleSaveSettings(plugin.name)
                                  }
                                  disabled={
                                    actionLoading === `save-${plugin.name}` ||
                                    !plugin.enabled
                                  }
                                  className="w-full text-xs h-7 mt-2"
                                >
                                  {actionLoading === `save-${plugin.name}`
                                    ? 'Saving...'
                                    : 'Save Settings'}
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </CardContent>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="p-3 bg-muted/20 border-t border-border/50 flex items-center justify-between gap-3">
                      <Link
                        href={`/plugins/${plugin.name}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors font-medium"
                      >
                        <ExternalLink className="size-3" />
                        Open Page
                      </Link>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {plugin.enabled ? 'Active' : 'Off'}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={plugin.enabled}
                          onClick={() =>
                            handleToggle(plugin.name, plugin.enabled)
                          }
                          disabled={actionLoading === `toggle-${plugin.name}`}
                          className={`${
                            plugin.enabled ? 'bg-primary' : 'bg-input'
                          } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50`}
                        >
                          <span
                            aria-hidden="true"
                            className={`${
                              plugin.enabled ? 'translate-x-4' : 'translate-x-0'
                            } pointer-events-none inline-block size-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SIDELOAD PACKAGE */}
      {activeTab === 'sideload' && (
        <Card className="max-w-2xl mx-auto border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UploadCloud className="size-5 text-primary" />
              Sideload Plugin Archive
            </CardTitle>
            <CardDescription className="text-xs">
              Upload a compiled `.zip` plugin package or provide a remote GitHub
              release URL. The package will be validated against CampusOS
              contracts, built, and dynamically registered in the runtime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PluginUploadDropzone onInstalled={handlePluginInstalled} />
          </CardContent>
        </Card>
      )}

      {/* TAB 3: MARKETPLACE */}
      {activeTab === 'marketplace' && (
        <MarketplaceGrid onPluginInstalled={loadPlugins} />
      )}
    </div>
  );
}
