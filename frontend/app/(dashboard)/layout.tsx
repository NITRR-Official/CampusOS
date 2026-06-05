import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { RequireAuth } from '@/app/components/auth/AuthGuard';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { API_BASE_URL } from '@/lib/api/client';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default async function DashboardLayout({
  children
}: DashboardLayoutProps) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  // Fetch active plugins to conditionally render sidebar links.
  // Next.js caches this fetch automatically, saving API hits on every page load.
  let activePlugins: string[] = [];
  try {
    // Using no-store so plugin toggles reflect immediately without waiting 5 minutes.
    const res = await fetch(`${API_BASE_URL}/system/modules`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      activePlugins = data.modules || [];
    }
  } catch (err: unknown) {
    if (
      err &&
      typeof err === 'object' &&
      'digest' in err &&
      err.digest === 'DYNAMIC_SERVER_USAGE'
    )
      throw err;
    console.error('Failed to fetch active plugins for sidebar:', err);
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <RequireAuth>
        <AppSidebar activePlugins={activePlugins} />
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
