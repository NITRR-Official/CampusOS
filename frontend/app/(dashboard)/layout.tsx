import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { RequireAuth } from '@/app/components/auth/AuthGuard';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <RequireAuth>
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="relative flex-1 bg-background/50 overflow-hidden">
            <div className="relative z-10 p-5 md:p-8 pb-20">{children}</div>
          </main>
        </SidebarInset>
      </RequireAuth>
    </SidebarProvider>
  );
}
