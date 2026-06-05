import { ExtensionPoint } from '@/components/ExtensionPoint';
import { UserCircle, Mail, ShieldCheck } from 'lucide-react';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api/client';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  let activePlugins: string[] = [];
  try {
    const res = await fetch(`${API_BASE_URL}/system/modules`, { cache: 'no-store' });
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
    console.error('Failed to fetch active plugins for profile:', err);
  }

  // We don't have direct access to the client-side user context here natively without reading cookies or using AuthGuard.
  // Since this is a server component, we would normally decode the auth session from cookies.
  // For the MVP, we'll render a beautiful skeleton/container that client components or plugins can fill,
  // or we can use a generic authenticated user placeholder if we can't parse it easily here.
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('auth_session');
  let user = {
    name: 'Student Name',
    email: 'student@campusos.edu',
    role: 'student'
  };

  if (sessionCookie?.value) {
    try {
      const parsed = JSON.parse(sessionCookie.value);
      if (parsed.user) user = parsed.user;
    } catch {
      // Ignore parse errors
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 shadow-sm">
        {/* Banner Area */}
        <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/10 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>

        <div className="px-6 md:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-4">
            <div className="flex aspect-square size-32 shrink-0 items-center justify-center rounded-full bg-card border-[4px] border-background shadow-lg text-primary overflow-hidden">
              <UserCircle className="size-full text-muted" strokeWidth={1} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary uppercase tracking-wider">
                  {user.role}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="size-3.5" />
                  Verified
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {user.name}
              </h1>
              <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                <Mail className="size-4" />
                {user.email}
              </p>
            </div>
            <div className="w-full sm:w-auto mt-4 sm:mt-0">
              <button className="w-full sm:w-auto rounded-xl border border-border bg-background px-6 py-2.5 text-sm font-medium shadow-sm hover:bg-muted transition-colors">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Extension Point for Tabs (Registered Events, Club Memberships, etc) */}
      <div className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-md p-6 md:p-8 shadow-sm">
        <div className="mb-6 border-b border-border/50 pb-4">
          <h2 className="text-xl font-bold text-foreground">My Campus Life</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your event registrations, club memberships, and tasks.
          </p>
        </div>

        {/* Plugins will inject their profile tabs or content here */}
        <ExtensionPoint
          id="profile-tabs"
          activePlugins={activePlugins}
          context={{ user }}
          className="space-y-8"
        />

        {/* Fallback if no plugins inject into profile-tabs */}
        {activePlugins.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              No active campus modules available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
