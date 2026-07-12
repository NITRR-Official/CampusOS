'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/lib/auth-provider';
import { useUIStore } from '@/lib/store';

function getInitials(value: string) {
  const parts = value.split(' ').filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : value[0];
  return (letters || 'U').toUpperCase();
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useAuth();
  const { isSearchOpen, toggleSearch } = useUIStore();

  const getBreadcrumbs = () => {
    if (!pathname || pathname === '/')
      return [{ label: 'Dashboard', href: '/' }];

    const parts = pathname.split('/').filter(Boolean);
    const crumbs = [];
    let currentPath = '';

    for (const part of parts) {
      currentPath += `/${part}`;
      crumbs.push({
        label: part.charAt(0).toUpperCase() + part.slice(1),
        href: currentPath
      });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const displayName = user?.name || 'Campus User';
  const displayEmail = user?.email || 'No email on file';

  let displayRole = '';
  if (user?.isSuperAdmin) {
    displayRole = 'Super Admin';
  } else if (role) {
    displayRole = `${role[0].toUpperCase()}${role.slice(1)}`;
  }

  const avatarFallback = getInitials(user?.name || user?.email || 'User');

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-4 border-b bg-background/60 backdrop-blur-xl px-4 md:px-6 transition-[width,height] ease-linear">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="hidden md:block">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                  <React.Fragment key={crumb.href}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Mobile Search Icon */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSearch}
          className="lg:hidden relative size-9 rounded-full"
        >
          <Search className="size-5 text-muted-foreground" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Desktop / Toggled Search Bar */}
        <div
          className={`relative ${isSearchOpen ? 'block' : 'hidden'} lg:block w-64`}
        >
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full appearance-none bg-background pl-8 shadow-none h-9 rounded-md"
          />
        </div>

        <ThemeToggle />

        <Button
          variant="ghost"
          size="icon"
          className="relative size-9 rounded-full"
        >
          <Bell className="size-5 text-muted-foreground" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-red-600 border border-background"></span>
          <span className="sr-only">Notifications</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative size-9 rounded-full">
              <Avatar className="size-9 border border-border">
                {/* Render AvatarImage conditionally or use a valid fallback approach. Since we don't have a URL, we will omit the src prop entirely or omit AvatarImage */}
                {/* <AvatarImage src="" alt="User" /> */}
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  {avatarFallback}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {displayName}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {displayEmail}
                </p>
                {displayRole ? (
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    {displayRole}
                  </p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleLogout}
              className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950"
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
