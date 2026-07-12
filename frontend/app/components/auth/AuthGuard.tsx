'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { UserRole } from '@plugins/auth/frontend/api';
import { useAuth } from '@/lib/auth-provider';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

interface RequireGuestProps {
  children: React.ReactNode;
}

export function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status, isAuthenticated, hasRole } = useAuth();

  const nextPath = React.useMemo(() => {
    if (!pathname) {
      return '/dashboard';
    }

    const params = new URLSearchParams(searchParams?.toString() || '');
    params.delete('next');
    const search = params.toString();

    if (!search) {
      return pathname;
    }

    return `${pathname}?${search}`;
  }, [pathname, searchParams]);

  React.useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }

    const encodedNext = encodeURIComponent(nextPath);
    router.replace(`/login?next=${encodedNext}`);
  }, [router, status, nextPath]);

  if (status === 'loading') {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Redirecting to login...
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return (
      <div className="p-6">
        <div className="max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="mt-2 text-sm">
            You do not have permission to view this page.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-flex rounded-lg bg-rose-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function RequireGuest({ children }: RequireGuestProps) {
  const router = useRouter();
  const { status, isAuthenticated } = useAuth();

  React.useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    router.replace('/dashboard');
  }, [router, status]);

  if (status === 'loading') {
    return (
      <div className="text-sm text-muted-foreground">Checking session...</div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="text-sm text-muted-foreground">
        Redirecting to dashboard...
      </div>
    );
  }

  return <>{children}</>;
}
