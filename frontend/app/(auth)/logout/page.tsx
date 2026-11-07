'use client';

import { useEffect } from 'react';
import { clearAuthSession } from '@campus-os/shared/auth-session';

export default function LogoutPage() {
  useEffect(() => {
    clearAuthSession();
    // Hard navigate to ensure in-memory cache and cookies are fully reset
    window.location.href = '/login';
  }, []);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <div className="text-sm text-muted-foreground">Logging out...</div>
    </div>
  );
}
