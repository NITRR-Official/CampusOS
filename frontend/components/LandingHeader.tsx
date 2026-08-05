'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@campusos/design-system';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuthStore } from '@/lib/store/auth';
import { Skeleton } from '@/components/ui/skeleton';

export function LandingHeader() {
  const [mounted, setMounted] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="relative z-10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground text-background">
            CO
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              CampusOS
            </p>
            <p className="text-sm font-medium text-foreground">
              Operating system for campuses
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
          <Link
            href="#features"
            className="transition-colors hover:text-foreground"
          >
            Platform
          </Link>
          <Link
            href="#modules"
            className="transition-colors hover:text-foreground"
          >
            Modules
          </Link>
          <Link
            href="#workflow"
            className="transition-colors hover:text-foreground"
          >
            Workflow
          </Link>
          <Link
            href="#launch"
            className="transition-colors hover:text-foreground"
          >
            Launch
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!mounted ? (
            <Skeleton className="h-10 w-28 rounded-md" />
          ) : isAuthenticated ? (
            <Button asChild className="h-10 px-5">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                className="hidden h-10 lg:inline-flex"
              >
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild className="h-10 px-5">
                <Link href="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
