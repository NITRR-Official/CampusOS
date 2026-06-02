import { ReactNode } from 'react';
import { RequireGuest } from '@/app/components/auth/AuthGuard';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <RequireGuest>
      {children}
    </RequireGuest>
  );
}
