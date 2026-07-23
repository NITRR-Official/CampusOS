'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn } from '@campusos/design-system';
import { Button } from '@campusos/design-system';

interface EventNavProps {
  clubId: string;
  eventId: string;
}

export function EventNav({ clubId, eventId }: EventNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      name: 'Overview',
      href: `/workspace/${clubId}/events/${eventId}`,
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'Participants',
      href: `/workspace/${clubId}/events/${eventId}/participants`,
      icon: Users,
      exact: false
    },
    {
      name: 'Settings',
      href: `/workspace/${clubId}/events/${eventId}/settings`,
      icon: Settings,
      exact: false
    }
  ];

  return (
    <aside
      className={cn(
        'transition-all duration-300 ease-in-out border border-border/50 bg-card rounded-2xl flex flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        {!isCollapsed && (
          <span className="font-semibold text-sm">Event Menu</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-8 w-8', isCollapsed && 'mx-auto')}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                isCollapsed && 'justify-center px-0'
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={cn(
                  'size-4 shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
