'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Users, Puzzle } from 'lucide-react';
import { DynamicIcon } from '@/components/DynamicIcon';
import { apiClient } from '@campus-os/shared/api-client';
import { registry } from '@campus-os/shared/plugin-registry';
import { ExtensionPoint } from '@campus-os/shared/extension-point';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [activeModules, setActiveModules] = useState<string[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    apiClient
      .get<{ modules?: string[] }>('/system/modules')
      .then((res) => {
        if (res && Array.isArray(res.modules)) {
          setActiveModules(res.modules);
        }
      })
      .catch(() => {});

    return registry.subscribe(() => {
      setTick((prev) => prev + 1);
    });
  }, []);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  // Core administrative links that are part of the core platform shell
  const coreLinks = [
    { name: 'Overview', href: '/admin', icon: ShieldCheck },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Plugins', href: '/admin/plugins', icon: Puzzle }
  ];

  // Dynamic admin navigation links registered by active plugins
  const registryAdminLinks = registry
    .getSidebarLinks()
    .filter(
      (link) =>
        link.url.startsWith('/admin/') &&
        link.url !== '/admin/plugins' &&
        link.url !== '/admin/users' &&
        (activeModules.length === 0 || activeModules.includes(link.pluginId))
    )
    .map((link) => ({
      name: link.title,
      href: link.url,
      iconName: link.icon || 'Puzzle'
    }));

  // Standard plugin tabs shown conditionally when their respective plugins are active
  const fallbackPluginTabs = [
    {
      id: 'club',
      name: 'Pending Clubs',
      href: '/admin/clubs',
      iconName: 'Building2'
    },
    {
      id: 'event',
      name: 'Events',
      href: '/admin/events',
      iconName: 'Calendar'
    },
    {
      id: 'activity',
      name: 'Activity',
      href: '/admin/activity',
      iconName: 'Activity'
    }
  ].filter(
    (tab) =>
      (activeModules.length === 0 || activeModules.includes(tab.id)) &&
      !registryAdminLinks.some((l) => l.href === tab.href)
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <ShieldCheck className="size-8 text-primary" />
          Super Admin Panel
        </h1>
        <p className="text-muted-foreground">
          Global system settings, user management, and club approvals.
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 md:gap-4 border-b border-border/50 pb-2">
        {coreLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${
                isActive(link.href)
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon className="size-4" />
              {link.name}
            </Link>
          );
        })}

        {[...registryAdminLinks, ...fallbackPluginTabs].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${
              isActive(tab.href)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <DynamicIcon name={tab.iconName} className="size-4" />
            {tab.name}
          </Link>
        ))}

        <ExtensionPoint id="admin-tabs" activePlugins={activeModules} />
      </nav>

      <div className="pt-2">{children}</div>
    </div>
  );
}
