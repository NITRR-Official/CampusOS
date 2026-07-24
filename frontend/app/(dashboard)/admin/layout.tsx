import { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldCheck, Users, Building2, Calendar, Settings, Activity } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
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
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50"
        >
          Overview
        </Link>
        <Link
          href="/admin/clubs"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 flex items-center gap-2"
        >
          <Building2 className="size-4" />
          Pending Clubs
        </Link>
        <Link
          href="/admin/users"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 flex items-center gap-2"
        >
          <Users className="size-4" />
          User Management
        </Link>
        <Link
          href="/admin/events"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 flex items-center gap-2"
        >
          <Calendar className="size-4" />
          Events
        </Link>
        <Link
          href="/admin/plugins"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 flex items-center gap-2"
        >
          <Settings className="size-4" />
          Plugins
        </Link>
        <Link
          href="/admin/activity"
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted/50 flex items-center gap-2"
        >
          <Activity className="size-4" />
          Activity
        </Link>
      </nav>

      <div className="pt-2">{children}</div>
    </div>
  );
}
