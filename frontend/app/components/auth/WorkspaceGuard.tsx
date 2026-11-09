'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';
import { useAuth } from '@campus-os/shared/auth-provider';
import { useWorkspacePermissions } from '@/lib/hooks/use-workspaces';

interface WorkspaceGuardProps {
  children: ReactNode;
  clubSlug: string;
}

export function WorkspaceGuard({ children, clubSlug }: WorkspaceGuardProps) {
  const { user, isAuthenticated } = useAuth();
  const {
    data: permData,
    isLoading,
    error
  } = useWorkspacePermissions(isAuthenticated ? clubSlug : '');

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 p-8 text-center">
        <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          Verifying workspace permissions...
        </p>
      </div>
    );
  }

  // Super admin, explicit member, or coordinator with assigned permissions
  const hasAccess =
    user?.isSuperAdmin ||
    permData?.isSuperAdmin ||
    permData?.isMember ||
    (permData?.permissions && permData.permissions.length > 0);

  if (!hasAccess && !error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-3xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-sm mb-6">
          <ShieldAlert className="size-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Workspace Access Restricted
        </h2>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          You are currently signed in as{' '}
          <strong className="text-foreground">{user?.email}</strong>, but you
          are not registered as an active coordinator or team member for this
          workspace.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full">
          <Link
            href={`/clubs/${clubSlug}`}
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
          >
            <Building2 className="size-4" /> View Public Club Page
          </Link>
          <Link
            href="/clubs"
            className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition"
          >
            <ArrowLeft className="size-4" /> Explore Clubs
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
