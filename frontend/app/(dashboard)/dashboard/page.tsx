import Link from 'next/link';
import { ExtensionPoint } from '@campus-os/shared/extension-point';
import { API_BASE_URL } from '@campus-os/shared/api-client';

export default async function Dashboard() {
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
    console.error('Failed to fetch active plugins for dashboard:', err);
  }

  return (
    <div className="w-full">
      {/* Background decorations matching the landing page */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15),transparent_60%)] blur-3xl" />
        <div className="absolute right-[-8%] top-24 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.12),transparent_60%)] blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.16)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.16)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 dark:opacity-20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto pt-4">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm backdrop-blur mb-4">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Dashboard Workspace
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3">
            Welcome to CampusOS
          </h1>
          <p className="text-base md:text-xl text-muted-foreground max-w-2xl">
            Campus Management & Community Platform
          </p>
        </div>

        {/* Plugin Extension Point: dashboard-top */}
        <ExtensionPoint
          id="dashboard-top"
          activePlugins={activePlugins}
          context={{ dashboard: true }}
        />

        {/* Quick Stats */}
        <ExtensionPoint
          id="dashboard-stats"
          activePlugins={activePlugins}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10"
        />

        {/* Quick Actions */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-4">
            Quick Actions
          </p>
          <ExtensionPoint
            id="dashboard-actions"
            activePlugins={activePlugins}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          />
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-4">
            Recent Activity
          </p>
          <ExtensionPoint
            id="dashboard-activity"
            activePlugins={activePlugins}
            className="space-y-4"
          />
        </div>
      </div>
    </div>
  );
}
