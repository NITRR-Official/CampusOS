import { ReactNode } from 'react';
import { cookies } from 'next/headers';
import { RequireAuth } from '@/app/components/auth/AuthGuard';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { API_BASE_URL } from '@/lib/api/client';

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceLayout({
  children,
  params
}: WorkspaceLayoutProps) {
  const resolvedParams = await params;
  const clubId = resolvedParams.slug;
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  let activePlugins: string[] = [];
  try {
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
        <AppSidebar activePlugins={activePlugins} clubId={clubId} />
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
