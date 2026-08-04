'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  Puzzle,
  Activity
} from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

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

      <nav className="flex gap-4 border-b border-border/50 pb-2">
        <Link
          href="/admin"
          className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${isActive('/admin') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          Overview
        </Link>
        <Link
          href="/admin/clubs"
          className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${isActive('/admin/clubs') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          <Building2 className="size-4" />
          Pending Clubs
        </Link>
        <Link
          href="/admin/users"
          className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${isActive('/admin/users') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          <Users className="size-4" />
          User Management
        </Link>
        <Link
          href="/admin/events"
          className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${isActive('/admin/events') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          <Calendar className="size-4" />
          Events
        </Link>
        <Link
          href="/admin/plugins"
          className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${isActive('/admin/plugins') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          <Puzzle className="size-4" />
          Plugins
        </Link>
        <Link
          href="/admin/activity"
          className={`text-sm font-medium transition-colors px-2 py-1 rounded-md flex items-center gap-2 ${isActive('/admin/activity') ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
        >
          <Activity className="size-4" />
          Activity
        </Link>
      </nav>

      <div className="pt-2">{children}</div>
    </div>
  );
}
