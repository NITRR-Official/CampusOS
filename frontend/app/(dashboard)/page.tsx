import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-3">
          Welcome to CampusOS
        </h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl">
          Campus Management & Community Platform
        </p>
        <div className="flex flex-wrap gap-4 mt-6">
          <Link
            href="/login"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[100px] px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center min-h-[44px] min-w-[100px] px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
          >
            Create account
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
          <div className="text-3xl md:text-4xl min-w-fit">🏫</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold m-0 mb-1">
              Institutes
            </p>
            <p className="text-2xl md:text-3xl font-bold m-0">0</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
          <div className="text-3xl md:text-4xl min-w-fit">🎯</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold m-0 mb-1">
              Clubs
            </p>
            <p className="text-2xl md:text-3xl font-bold m-0">0</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
          <div className="text-3xl md:text-4xl min-w-fit">📅</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold m-0 mb-1">
              Events
            </p>
            <p className="text-2xl md:text-3xl font-bold m-0">0</p>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border border-border p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
          <div className="text-3xl md:text-4xl min-w-fit">👥</div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold m-0 mb-1">
              Members
            </p>
            <p className="text-2xl md:text-3xl font-bold m-0">0</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6 mt-0">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-card text-card-foreground border border-border shadow-sm rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-1 active:translate-y-0 text-center min-h-[120px]">
            <span className="text-3xl">➕</span>
            <span className="text-sm font-semibold tracking-wide">
              Create Institute
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-card text-card-foreground border border-border shadow-sm rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-1 active:translate-y-0 text-center min-h-[120px]">
            <span className="text-3xl">➕</span>
            <span className="text-sm font-semibold tracking-wide">
              Create Club
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-card text-card-foreground border border-border shadow-sm rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-1 active:translate-y-0 text-center min-h-[120px]">
            <span className="text-3xl">➕</span>
            <span className="text-sm font-semibold tracking-wide">
              Schedule Event
            </span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 p-6 bg-card text-card-foreground border border-border shadow-sm rounded-xl cursor-pointer transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-1 active:translate-y-0 text-center min-h-[120px]">
            <span className="text-3xl">👥</span>
            <span className="text-sm font-semibold tracking-wide">
              Invite Member
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-4 md:mb-6 mt-0">
          Recent Activity
        </h2>
        <div className="bg-card rounded-lg border border-border p-6 md:p-8 text-center">
          <p className="text-muted-foreground text-sm md:text-base m-0">
            No recent activity. Create an institute or club to get started!
          </p>
        </div>
      </div>
    </div>
  );
}
