import Link from 'next/link';
import {
  Building2,
  Target,
  Calendar,
  Users,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
          <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary min-w-fit">
              <Building2 size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
                Institutes
              </p>
              <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">
                0
              </p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 min-w-fit">
              <Target size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
                Clubs
              </p>
              <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">
                0
              </p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 min-w-fit">
              <Calendar size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
                Events
              </p>
              <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">
                0
              </p>
            </div>
          </div>

          <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 min-w-fit">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
                Members
              </p>
              <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">
                0
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-4">
            Quick Actions
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                <Plus size={20} />
              </div>
              <span className="relative text-sm font-semibold tracking-wide text-foreground">
                Create Institute
              </span>
            </button>
            <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">
                <Plus size={20} />
              </div>
              <span className="relative text-sm font-semibold tracking-wide text-foreground">
                Create Club
              </span>
            </button>
            <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-colors">
                <Plus size={20} />
              </div>
              <span className="relative text-sm font-semibold tracking-wide text-foreground">
                Schedule Event
              </span>
            </button>
            <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-colors">
                <Users size={20} />
              </div>
              <span className="relative text-sm font-semibold tracking-wide text-foreground">
                Invite Member
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground mb-4">
            Recent Activity
          </p>
          <div className="bg-card/80 backdrop-blur rounded-xl border border-border/60 p-8 md:p-12 text-center shadow-sm">
            <p className="text-muted-foreground text-sm md:text-base m-0">
              No recent activity. Create an institute or club to get started!
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                href="/institutes/new"
                className="inline-flex items-center justify-center min-h-[40px] px-6 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-medium transition-colors text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
