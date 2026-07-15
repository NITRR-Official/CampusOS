'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-provider';
import {
  Calendar,
  Home,
  Users,
  Ticket,
  CheckSquare,
  Settings,
  ShieldAlert,
  ChevronsUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Settings', href: '/settings', icon: Settings }
];

import { registry } from '@/lib/plugins/registry';
import { initializePlugins } from '@/lib/plugins/init';
import { useClubs } from '@plugins/club/frontend/hooks';

// Call it once when module is loaded on client
initializePlugins();

export function AppSidebar({
  activePlugins = [],
  clubId
}: {
  activePlugins?: string[];
  clubId?: string;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { isMobile } = useSidebar();

  const { data: clubs } = useClubs();

  // Map string icons back to Lucide components
  const iconMap: Record<string, React.ElementType> = {
    Ticket,
    CheckSquare,
    Calendar,
    Users,
    Settings,
    Home,
    ShieldAlert
  };

  // Combine core navigation with plugin navigation
  const pluginLinks = registry
    .getSidebarLinks()
    .filter((link) => activePlugins.includes(link.pluginId))
    .filter((link) => {
      const isWorkspace = link.context !== 'global';
      // If we are in a club context, show workspace links.
      // If we are in global context, show global links.
      return clubId ? isWorkspace : !isWorkspace;
    })
    .map((link) => ({
      name: link.title,
      href:
        clubId && link.context !== 'global'
          ? `/workspace/${clubId}${link.url}`
          : link.url,
      icon: link.icon && iconMap[link.icon] ? iconMap[link.icon] : Settings
    }));

  const allNavigation = clubId
    ? [
        { name: 'Dashboard', href: `/workspace/${clubId}`, icon: Home },
        ...pluginLinks,
        {
          name: 'Settings',
          href: `/workspace/${clubId}/settings`,
          icon: Settings
        }
      ]
    : [...navigation, ...pluginLinks];

  if (!clubId && user?.isSuperAdmin) {
    allNavigation.push({
      name: 'Admin Panel',
      href: '/admin',
      icon: ShieldAlert
    });
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-border/60 bg-card/50 backdrop-blur-xl"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent mb-2"
              asChild
            >
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
                  <span className="text-xl font-bold">C</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold tracking-tight text-lg">
                    CampusOS
                  </span>
                  {clubId && (
                    <span className="text-[11px] text-muted-foreground font-medium truncate">
                      / {clubs?.find((c) => c.slug === clubId)?.name || clubId}
                    </span>
                  )}
                </div>
              </Link>
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
                  (item.href !== '/dashboard' &&
                    item.href !== `/workspace/${clubId}` &&
                    pathname?.startsWith(item.href + '/'));
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

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground border border-border/50 bg-card/50 shadow-sm"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <span className="text-sm font-bold">
                      {clubId ? clubId.charAt(0).toUpperCase() : 'G'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                    <span className="font-semibold tracking-tight text-sm truncate">
                      {clubId
                        ? clubs?.find((c) => c.slug === clubId)?.name || clubId
                        : 'Global Dashboard'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {clubId ? 'Workspace' : 'System'}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="rounded-lg"
                style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
                side={isMobile ? 'bottom' : 'top'}
                align="start"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Switch Workspace
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Home className="size-3" />
                    </div>
                    Global Dashboard
                  </Link>
                </DropdownMenuItem>

                {clubs && clubs.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      Your Clubs
                    </DropdownMenuLabel>
                    {clubs.map((club) => (
                      <DropdownMenuItem key={club.id || club._id} asChild>
                        <Link
                          href={`/workspace/${club.slug}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className="flex size-6 items-center justify-center rounded-sm border bg-primary/10">
                            {club.name.charAt(0)}
                          </div>
                          <span className="truncate">{club.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
