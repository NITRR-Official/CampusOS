'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { UserRole } from '@campus-os/shared/auth-types';
import { useAuth } from '@campus-os/shared/auth-provider';
import {
  ensureAuthCookie,
  clearAuthSession,
  parseJwtExp
} from '@campus-os/shared/auth-session';

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
  const searchParams = useSearchParams();
  const { status, isAuthenticated, session, refreshSession } = useAuth();
  const [isRedirecting, setIsRedirecting] = React.useState(false);

  React.useEffect(() => {
    // When mounting on guest routes, verify session freshness
    refreshSession();
  }, [refreshSession]);

  React.useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) {
      return;
    }

    const exp = parseJwtExp(session.accessToken);
    if (exp && Date.now() >= exp * 1000) {
      clearAuthSession();
      return;
    }

    ensureAuthCookie(session);
    setIsRedirecting(true);

    const next = searchParams?.get('next') || '/dashboard';
    const target =
      next.startsWith('/') &&
      !next.startsWith('/login') &&
      !next.startsWith('/signup')
        ? next
        : '/dashboard';

    router.replace(target);

    // Fallback: if soft navigation gets stuck after 1.2s, force hard navigation
    const timeout = setTimeout(() => {
      if (
        typeof window !== 'undefined' &&
        (window.location.pathname === '/login' ||
          window.location.pathname.startsWith('/login'))
      ) {
        window.location.href = target;
      }
    }, 1200);

    return () => clearTimeout(timeout);
  }, [router, status, session, searchParams]);

  if (status === 'loading') {
    return (
      <div className="text-sm text-muted-foreground">Checking session...</div>
    );
  }

  if (isAuthenticated || isRedirecting) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="text-sm text-muted-foreground">
          Redirecting to dashboard...
        </div>
        <button
          type="button"
          onClick={() => {
            clearAuthSession();
            window.location.href = '/login';
          }}
          className="mt-4 text-xs text-primary underline underline-offset-4 hover:opacity-80 cursor-pointer"
        >
          Having trouble? Clear session and log in
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
