import { ReactNode } from 'react';
import { cookies } from 'next/headers';
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
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 bg-background/50">
          <div className="p-5 md:p-8 pb-20">{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
