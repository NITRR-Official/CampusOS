'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
  useToast,
  CardSkeleton
} from '@campusos/design-system';
import {
  Search,
  Star,
  Download,
  ShieldCheck,
  Check,
  RefreshCw,
  Sparkles,
  Layers
} from 'lucide-react';
import { apiClient } from '@campus-os/shared/api-client';
import { DynamicIcon } from '@/components/DynamicIcon';
import { PluginCapabilityBadge } from '@/components/admin/PluginCapabilityBadge';
import {
  PluginPermissionModal,
  MarketplacePlugin
} from './PluginPermissionModal';

interface MarketplaceResponse {
  success: boolean;
  count: number;
  plugins: MarketplacePlugin[];
}

interface InstalledPlugin {
  name: string;
  version?: string;
  enabled: boolean;
}

interface MarketplaceGridProps {
  onPluginInstalled?: (plugin: MarketplacePlugin) => void;
  className?: string;
}

const CATEGORIES = ['All', 'Club Operations', 'Events', 'Utilities'];

export function MarketplaceGrid({
  onPluginInstalled,
  className = ''
}: MarketplaceGridProps) {
  const [catalog, setCatalog] = useState<MarketplacePlugin[]>([]);
  const [installedMap, setInstalledMap] = useState<
    Map<string, InstalledPlugin>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Permission Modal state
  const [selectedPlugin, setSelectedPlugin] =
    useState<MarketplacePlugin | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);

      const [marketRes, installedRes] = await Promise.allSettled([
        apiClient.get<MarketplaceResponse>('/marketplace/plugins'),
        apiClient.get<{ plugins?: InstalledPlugin[] }>('/plugins')
      ]);

      if (
        marketRes.status === 'fulfilled' &&
        marketRes.value &&
        Array.isArray(marketRes.value.plugins)
      ) {
        setCatalog(marketRes.value.plugins);
      }

      if (
        installedRes.status === 'fulfilled' &&
        installedRes.value &&
        Array.isArray(installedRes.value.plugins)
      ) {
        const map = new Map<string, InstalledPlugin>();
        installedRes.value.plugins.forEach((p) => {
          map.set(p.name.toLowerCase(), p);
        });
        setInstalledMap(map);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load catalog';
      toast({
        title: 'Catalog Error',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenInstallModal = (plugin: MarketplacePlugin) => {
    setSelectedPlugin(plugin);
    setIsModalOpen(true);
  };

  const handleConfirmInstall = async (plugin: MarketplacePlugin) => {
    setInstallingId(plugin.id);
    try {
      // Execute 1-click installation via backend marketplace endpoint
      await apiClient.post(`/marketplace/install/${plugin.id}`, {
        force: true
      });

      // Hot-load browser ESM bundle if available
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        await import(
          /* webpackIgnore: true */ `/api/v1/plugins/${plugin.id}/bundle.js`
        );
      } catch (bundleErr: unknown) {
        const bMsg =
          bundleErr instanceof Error ? bundleErr.message : 'preload notice';
        console.warn(`[MarketplaceGrid] Bundle preload notice:`, bMsg);
      }

      toast({
        title: 'Plugin Installed',
        description: `Successfully installed "${plugin.name}" from the Community Marketplace.`
      });

      setIsModalOpen(false);
      setSelectedPlugin(null);

      // Refresh catalog and installed status
      await loadData();
      onPluginInstalled?.(plugin);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Installation failed';
      toast({
        title: 'Installation Failed',
        description: msg,
        variant: 'destructive'
      });
    } finally {
      setInstallingId(null);
    }
  };

  const filteredCatalog = useMemo(() => {
    return catalog.filter((plugin) => {
      const matchesSearch =
        !searchQuery.trim() ||
        plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (plugin.tags || []).some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === 'All' ||
        plugin.category?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [catalog, searchQuery, selectedCategory]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Category Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search verified extensions, tags, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-lg text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton
              key={i}
              className="border-border/50 bg-card/50 backdrop-blur-sm h-72"
            />
          ))}
        </div>
      ) : filteredCatalog.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border/80 rounded-xl bg-card/20">
          <Sparkles className="size-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-base font-medium">No marketplace plugins found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search query or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCatalog.map((plugin) => {
            const installed = installedMap.get(plugin.id.toLowerCase());
            const isInstalled = Boolean(installed);
            const hasUpdate =
              isInstalled &&
              installed?.version &&
              installed.version !== plugin.version;

            return (
              <Card
                key={plugin.id}
                className="border-border/60 bg-card/50 backdrop-blur-sm flex flex-col justify-between hover:border-border transition-all shadow-sm"
              >
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <DynamicIcon
                            name={plugin.icon}
                            fallback={Layers}
                            className="size-5"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <CardTitle className="text-base font-semibold">
                              {plugin.name}
                            </CardTitle>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            by {plugin.author}
                          </p>
                        </div>
                      </div>

                      {plugin.verified && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-cyan-600 dark:text-cyan-400 border-cyan-500/20 bg-cyan-500/10 shrink-0"
                        >
                          <ShieldCheck className="size-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3.5 pt-0">
                    <CardDescription className="text-xs leading-relaxed line-clamp-2">
                      {plugin.description}
                    </CardDescription>

                    {/* Stats & Category */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {plugin.rating && (
                        <span className="flex items-center gap-1 font-medium text-amber-500">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          {plugin.rating.toFixed(1)}
                        </span>
                      )}
                      {plugin.downloads && (
                        <span className="flex items-center gap-1">
                          <Download className="size-3" />
                          {plugin.downloads.toLocaleString()}
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className="text-[10px] ml-auto"
                      >
                        {plugin.category}
                      </Badge>
                    </div>

                    {/* Capability Pills Preview */}
                    {plugin.capabilities && plugin.capabilities.length > 0 && (
                      <div className="pt-1">
                        <div className="flex flex-wrap gap-1">
                          {plugin.capabilities.slice(0, 3).map((cap) => (
                            <PluginCapabilityBadge key={cap} capability={cap} />
                          ))}
                          {plugin.capabilities.length > 3 && (
                            <span className="text-[10px] text-muted-foreground self-center px-1">
                              +{plugin.capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer Action */}
                <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">
                    v{plugin.version}
                  </span>

                  {isInstalled && !hasUpdate ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      className="text-xs h-8 bg-muted/40 text-muted-foreground font-medium"
                    >
                      <Check className="size-3.5 mr-1 text-emerald-500" />
                      Installed
                    </Button>
                  ) : hasUpdate ? (
                    <Button
                      size="sm"
                      onClick={() => handleOpenInstallModal(plugin)}
                      className="text-xs h-8 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold"
                    >
                      <RefreshCw className="size-3 mr-1" />
                      Update (v{plugin.version})
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleOpenInstallModal(plugin)}
                      className="text-xs h-8 font-semibold"
                    >
                      <Download className="size-3 mr-1" />
                      1-Click Install
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Permissions Audit Modal */}
      <PluginPermissionModal
        plugin={selectedPlugin}
        isOpen={isModalOpen}
        isInstalling={installingId === selectedPlugin?.id}
        onClose={() => {
          if (!installingId) {
            setIsModalOpen(false);
            setSelectedPlugin(null);
          }
        }}
        onConfirm={handleConfirmInstall}
      />
    </div>
  );
}

export default MarketplaceGrid;
