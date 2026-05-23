import { ReactNode } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 bg-background/50">
          <div className="p-5 md:p-8 pb-20">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
