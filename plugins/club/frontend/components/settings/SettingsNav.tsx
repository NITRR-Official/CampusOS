'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Shield, Users } from 'lucide-react';
import { cn } from '@campusos/design-system';

interface SettingsNavProps {
  clubSlug: string;
}

export function SettingsNav({ clubSlug }: SettingsNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'General',
      href: `/workspace/${clubSlug}/settings`,
      icon: Settings,
      exact: true
    },
    {
      name: 'Roles & Permissions',
      href: `/workspace/${clubSlug}/settings/roles`,
      icon: Shield,
      exact: false
    },
    {
      name: 'Members',
      href: `/workspace/${clubSlug}/settings/members`,
      icon: Users,
      exact: false
    }
  ];

  return (
    <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon
              className={cn(
                'size-4',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
