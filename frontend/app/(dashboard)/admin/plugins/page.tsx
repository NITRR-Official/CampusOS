/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@campus-os/shared/api-client';
import { Skeleton, useToast, Badge } from '@campusos/design-system';
import { Search, Plus, Store } from 'lucide-react';

interface PluginSettingsConfig {
  type: string;
  default: any;
  description: string;
  required?: boolean;
}

interface PluginConfigSchema {
  fields: Record<string, PluginSettingsConfig>;
}

interface Plugin {
  id: string;
  name: string;
  enabled: boolean;
  version?: string;
  settings: Record<string, any>;
  configSchema?: PluginConfigSchema | null;
}

export default function AdminPluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // State for settings forms
  const [settingsValues, setSettingsValues] = useState<
    Record<string, Record<string, any>>
  >({});

  async function loadPlugins() {
    try {
      setLoading(true);
      const data = await apiClient.get<any>('/plugins');
      if (data && Array.isArray(data.plugins)) {
        setPlugins(data.plugins);

        // Initialize settings values
        const initialSettings: Record<string, Record<string, any>> = {};
        data.plugins.forEach((p: Plugin) => {
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
  }

  useEffect(() => {
    loadPlugins();
  }, []);

  async function handleToggle(pluginName: string, currentlyEnabled: boolean) {
    setActionLoading(`toggle-${pluginName}`);
    try {
      await apiClient.put(`/plugins/${pluginName}/toggle`, {
        enabled: !currentlyEnabled
      });
      toast({
        title: 'Success',
        description: `Plugin ${pluginName} has been ${!currentlyEnabled ? 'enabled' : 'disabled'}.`
      });
      setPlugins((prev) =>
        prev.map((p) =>
          p.name === pluginName ? { ...p, enabled: !currentlyEnabled } : p
        )
      );
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
        title: 'Success',
        description: `Settings for ${pluginName} have been saved.`
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

  function handleSettingChange(pluginName: string, field: string, value: any) {
    setSettingsValues((prev) => ({
      ...prev,
      [pluginName]: {
        ...(prev[pluginName] || {}),
        [field]: value
      }
    }));
  }

  const filteredPlugins = useMemo(() => {
    if (!searchQuery.trim()) return plugins;
    const lowerQuery = searchQuery.toLowerCase();
    return plugins.filter((p) => p.name.toLowerCase().includes(lowerQuery));
  }, [plugins, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Plugin Management
          </h2>
          <p className="text-sm text-muted-foreground">
            Enable or disable modules and configure their dynamic settings.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search plugins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
            />
          </div>
          <button
            onClick={() => {
              toast({
                title: 'Coming Soon',
                description:
                  'The Community Plugin Store will be available in a future update.'
              });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm shrink-0"
          >
            <Store className="size-4" />
            Browse Plugins
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="border border-border/50 rounded-md p-4 bg-card/50 backdrop-blur-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-[120px]" />
                <Skeleton className="h-6 w-[60px]" />
              </div>
              <Skeleton className="h-4 w-full" />
              <div className="pt-4 border-t border-border/50">
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border border-border/50 rounded-md bg-card/50">
          {searchQuery
            ? 'No plugins matched your search.'
            : 'No plugins found.'}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlugins.map((plugin) => (
            <div
              key={plugin.name}
              className="border border-border/50 rounded-md overflow-hidden bg-card/50 backdrop-blur-sm flex flex-col transition-all hover:shadow-sm"
            >
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg capitalize">
                    {plugin.name}
                  </h3>
                  <Badge
                    variant="outline"
                    className={
                      plugin.enabled
                        ? 'text-green-600 border-green-200 bg-green-50'
                        : 'text-slate-500 border-slate-200 bg-slate-50'
                    }
                  >
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                {plugin.version && (
                  <p className="text-xs text-muted-foreground mb-4">
                    v{plugin.version}
                  </p>
                )}

                {/* Dynamic Settings Form */}
                {plugin.configSchema &&
                plugin.configSchema.fields &&
                Object.keys(plugin.configSchema.fields).length > 0 ? (
                  <div className="space-y-4 mt-6">
                    <h4 className="text-sm font-medium border-b border-border/50 pb-2">
                      Configuration
                    </h4>
                    {Object.entries(plugin.configSchema.fields).map(
                      ([fieldKey, config]) => (
                        <div key={fieldKey} className="space-y-1">
                          <label className="text-xs font-medium capitalize">
                            {fieldKey.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          {config.type === 'boolean' ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="checkbox"
                                checked={
                                  settingsValues[plugin.name]?.[fieldKey] ??
                                  config.default
                                }
                                onChange={(e) =>
                                  handleSettingChange(
                                    plugin.name,
                                    fieldKey,
                                    e.target.checked
                                  )
                                }
                                disabled={!plugin.enabled}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <span className="text-xs text-muted-foreground">
                                {config.description}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <input
                                type={
                                  config.type === 'number' ? 'number' : 'text'
                                }
                                value={
                                  settingsValues[plugin.name]?.[fieldKey] ??
                                  config.default
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
                                className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={`Enter ${fieldKey}`}
                              />
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {config.description}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    )}
                    <div className="pt-2">
                      <button
                        onClick={() => handleSaveSettings(plugin.name)}
                        disabled={
                          actionLoading === `save-${plugin.name}` ||
                          !plugin.enabled
                        }
                        className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === `save-${plugin.name}`
                          ? 'Saving...'
                          : 'Save Settings'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 text-sm text-muted-foreground italic">
                    No configuration options available for this plugin.
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={plugin.enabled}
                  onClick={() => handleToggle(plugin.name, plugin.enabled)}
                  disabled={actionLoading === `toggle-${plugin.name}`}
                  className={`${
                    plugin.enabled ? 'bg-primary' : 'bg-input'
                  } relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span
                    aria-hidden="true"
                    className={`${
                      plugin.enabled ? 'translate-x-4' : 'translate-x-0'
                    } pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
