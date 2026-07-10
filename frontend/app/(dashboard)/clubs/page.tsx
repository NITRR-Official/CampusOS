import Link from 'next/link';
import { fetchClubs } from '@plugins/club/frontend/api';
import { Users, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ClubsPage() {
  const clubs = await fetchClubs('approved');

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 md:p-12 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-3xl rounded-full opacity-50" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
            <Building2 className="size-4" />
            Clubs Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Discover Your Community
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Explore university clubs, join communities that share your passion,
            and take your campus experience to the next level.
          </p>
          <Link
            href="/clubs/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Building2 className="size-4" />
            Propose a New Club
          </Link>
        </div>
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-12 text-center text-muted-foreground">
            No clubs found yet. Check back later!
          </div>
        ) : (
          clubs.map((club) => (
            <Link
              key={club.id}
              href={`/clubs/${club.slug}`}
              className="group block"
            >
              <article className="h-full rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:bg-card/60 hover:border-primary/20">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex aspect-square size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-sm border border-primary/10">
                    <span className="text-xl font-bold">
                      {club.name.charAt(0)}
                    </span>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground border border-border">
                    {club.category}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-2">
                  {club.name}
                </h2>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-6">
                  {club.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mt-auto">
                  <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                    <Users className="size-3.5" />
                    <span>{club.memberCount} Members</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                    <span
                      className={`size-2 rounded-full ${club.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    />
                    <span className="capitalize">{club.status}</span>
                  </div>
                </div>
              </article>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
