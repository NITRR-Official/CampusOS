'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Button } from '@campusos/design-system';
import { useAuth } from '@campus-os/shared/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export function LandingHeroActions() {
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-11 w-36 rounded-md" />
        <Skeleton className="h-11 w-36 rounded-md" />
        <Skeleton className="h-11 w-24 rounded-md" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild className="h-11 px-6">
        <Link href="/dashboard">View dashboard</Link>
      </Button>
      {!isAuthenticated && (
        <>
          <Button asChild variant="outline" className="h-11 px-6">
            <Link href="/signup">Create account</Link>
          </Button>
          <Button asChild variant="ghost" className="h-11 px-6">
            <Link href="/login">Login</Link>
          </Button>
        </>
      )}
    </div>
  );
}
