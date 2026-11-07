import { ReactNode, Suspense } from 'react';
import { RequireGuest } from '@/app/components/auth/AuthGuard';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-sm text-slate-400">
          Loading...
        </div>
      }
    >
      <RequireGuest>{children}</RequireGuest>
    </Suspense>
  );
}
