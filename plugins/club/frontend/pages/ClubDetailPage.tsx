import { notFound } from 'next/navigation';
import { fetchClubBySlug } from '../api';
import { Users, Building2, Calendar, ChevronLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { ClubActionButtons } from '../components/ClubActionButtons';

export const dynamic = 'force-dynamic';

export async function ClubDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const club = await fetchClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Back Navigation */}
      <Link
        href="/clubs"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to Clubs
      </Link>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* Banner Area (Mocked with gradient) */}
        <div className="h-48 md:h-64 bg-gradient-to-r from-primary/20 via-primary/5 to-secondary/20 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
        </div>

        {/* Profile Info */}
        <div className="px-6 md:px-10 pb-10 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12 md:-mt-16 mb-6">
            <div className="flex aspect-square size-24 md:size-32 shrink-0 items-center justify-center rounded-2xl bg-card border-[4px] border-background shadow-lg text-primary">
              <span className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-primary to-primary/60">
                {club.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                  {club.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${club.status === 'active' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${club.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                  />
                  <span className="capitalize">{club.status}</span>
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                {club.name}
              </h1>
            </div>
            <ClubActionButtons 
              clubId={club.id || (club as unknown as Record<string, unknown>)._id as string} 
              clubSlug={club.slug} 
            />
          </div>

          <div className="grid grid-cols-2 md:flex md:flex-row gap-4 md:gap-8 pt-6 border-t border-border/50">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                <Users className="size-4" /> Members
              </span>
              <span className="text-xl font-semibold text-foreground">
                {club.memberCount}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 mb-1">
                <Calendar className="size-4" /> Founded
              </span>
              <span className="text-xl font-semibold text-foreground">
                {new Date(club.createdAt).getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Info className="size-5 text-primary" />
              About {club.name}
            </h2>
            <div className="prose dark:prose-invert max-w-none text-muted-foreground bg-card/30 backdrop-blur rounded-2xl border border-border/50 p-6 md:p-8">
              <p className="text-lg leading-relaxed">{club.description}</p>
              <p className="mt-4">
                We are constantly looking for enthusiastic members to join our
                ranks. Whether you are a beginner or a pro, there is a place for
                everyone here. We organize weekly meetups, host workshops, and
                participate in inter-college competitions.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Calendar className="size-5 text-primary" />
              Upcoming Events
            </h2>
            <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur p-12 text-center text-muted-foreground">
              No upcoming events scheduled yet.
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" />
              Club Details
            </h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{club.category}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium capitalize">{club.status}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Contact</span>
                <span className="font-medium text-primary hover:underline cursor-pointer">
                  contact@{club.slug}.club
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
