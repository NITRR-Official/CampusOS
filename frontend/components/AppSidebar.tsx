'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import {
  Calendar,
  Home,
  Users,
  Ticket,
  CheckSquare,
  Settings,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Settings', href: '/settings', icon: Settings }
];

import { registry } from '@/lib/plugins/registry';
import { initializePlugins } from '@/lib/plugins/init';

// Call it once when module is loaded on client
initializePlugins();

export function AppSidebar({
  activePlugins = []
}: {
  activePlugins?: string[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // Map string icons back to Lucide components
  const iconMap: Record<string, React.ElementType> = {
    Ticket,
    CheckSquare,
    Calendar,
    Users,
    Settings,
    Home
  };

  // Combine core navigation with plugin navigation
  const pluginLinks = registry
    .getSidebarLinks()
    .filter((link) => activePlugins.includes(link.pluginId))
    .map((link) => ({
      name: link.title,
      href: link.url,
      icon: link.icon && iconMap[link.icon] ? iconMap[link.icon] : Settings
    }));

  const allNavigation = [...navigation, ...pluginLinks];

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-border/60 bg-card/50 backdrop-blur-xl"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="hover:bg-transparent mb-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                <span className="text-xl font-bold">C</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold tracking-tight text-lg">
                  CampusOS
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/' && pathname?.startsWith(item.href));
                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.name}
                      className={`min-h-[44px] transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-medium shadow-sm' : 'hover:bg-muted/50 hover:text-foreground text-muted-foreground'}`}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-5" />
                        <span className="text-[15px]">{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="pb-10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="min-h-[44px] text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              asChild
            >
              <button
                onClick={async () => {
                  logout();
                  router.push('/login');
                }}
              >
                <LogOut className="size-5" />
                <span className="text-[15px]">Log out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
