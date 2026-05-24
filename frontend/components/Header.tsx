'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
  const pathname = usePathname();

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
          className="lg:hidden relative size-9 rounded-full"
        >
          <Search className="size-5 text-muted-foreground" />
          <span className="sr-only">Search</span>
        </Button>

        {/* Desktop Search Bar */}
        <div className="relative hidden w-64 lg:block">
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
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                  AD
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin User</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@campusos.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:bg-red-50 dark:focus:bg-red-950">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
