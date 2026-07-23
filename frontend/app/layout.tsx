import type { Metadata } from 'next';
import './globals.css';
import { TooltipProvider, ThemeProvider } from '@campusos/design-system';
import { AuthProvider } from '@campus-os/shared/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata: Metadata = {
  title: 'CampusOS',
  description: 'The Operating System for Campus Management'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
