'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  fetchClubBySlug,
  fetchMyClubPermissions
} from '@plugins/club/frontend/api';
import { fetchPublicEvents } from '@plugins/event/frontend/api';
import {
  Building2,
  Users,
  ArrowRight,
  ExternalLink,
  Calendar,
  MapPin,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PublicClubProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { data: club, isLoading: isLoadingClub } = useQuery({
    queryKey: ['club', slug],
    queryFn: () => fetchClubBySlug(slug)
  });

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ['club', slug, 'permissions'],
    queryFn: () => fetchMyClubPermissions(slug),
    enabled: !!club
  });

  const { data: publicEvents, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['club', slug, 'public-events'],
    queryFn: () => fetchPublicEvents(slug),
    enabled: !!club
  });

  if (isLoadingClub) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <Building2 className="size-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Club Not Found</h2>
        <p className="text-muted-foreground text-center max-w-sm">
          The club you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => router.push('/clubs')} variant="outline">
          Back to Directory
        </Button>
      </div>
    );
  }

  const isMember = permissions?.isMember || permissions?.isSuperAdmin;

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-card border border-border/50 shadow-sm min-h-[400px] flex flex-col justify-end">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent z-10" />
        <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-primary/20 blur-3xl rounded-full opacity-60" />
        <div className="absolute -bottom-24 -left-24 w-[400px] h-[400px] bg-secondary/20 blur-3xl rounded-full opacity-60" />

        {/* Fake cover image for visual flair */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523580494112-071d1e2008bc?q=80&w=2070')] bg-cover bg-center opacity-30 mix-blend-luminosity" />

        <div className="relative z-20 p-8 md:p-12 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary border border-primary/20 backdrop-blur-md">
                {club.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1 text-xs font-medium text-secondary-foreground border border-border backdrop-blur-md">
                <Users className="size-3.5" />
                {club.memberCount} Members
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-md">
              {club.name}
            </h1>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {isLoadingPermissions ? (
              <Button disabled className="w-40 rounded-xl shadow-lg">
                <Loader2 className="size-4 animate-spin mr-2" />
                Loading...
              </Button>
            ) : isMember ? (
              <Link href={`/workspace/${club.slug}`}>
                <Button
                  size="lg"
                  className="rounded-xl shadow-lg shadow-primary/20 font-semibold gap-2 transition-transform hover:scale-105 active:scale-95"
                >
                  Go to Workspace
                  <ArrowRight className="size-4" />
                </Button>
              </Link>
            ) : (
              <Button
                size="lg"
                className="rounded-xl shadow-lg shadow-primary/20 font-semibold gap-2 transition-transform hover:scale-105 active:scale-95"
              >
                Request to Join
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: About & Details */}
        <div className="lg:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">About Us</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {club.description ||
                  'This club has not provided a description yet. Check back soon for more information about their activities and mission!'}
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              Upcoming Public Events
            </h2>
            {isLoadingEvents ? (
              <div className="flex justify-center p-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : publicEvents && publicEvents.length > 0 ? (
              <div className="grid gap-4">
                {publicEvents.map((event) => (
                  <div
                    key={event.id || event._id}
                    className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/40 p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 hover:border-primary/20"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-2xl rounded-full" />
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-lg mb-1">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                          <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                            <Calendar className="size-3.5" />
                            <span>
                              {new Date(event.startsAt).toLocaleDateString()}
                            </span>
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                              <MapPin className="size-3.5" />
                              <span>{event.venue}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-12 text-center flex flex-col items-center justify-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-background border shadow-sm">
                  <Calendar className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    No public events scheduled
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This club hasn&apos;t published any upcoming events yet.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Sidebar Info */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-foreground">
              Club Information
            </h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex size-8 items-center justify-center rounded-md bg-secondary/50 text-secondary-foreground">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Status</p>
                  <p className="capitalize">{club.status}</p>
                </div>
              </li>
              <li className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex size-8 items-center justify-center rounded-md bg-secondary/50 text-secondary-foreground">
                  <MapPin className="size-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Campus Location</p>
                  <p>TBD</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-md p-6 shadow-sm">
            <h3 className="font-semibold mb-4 text-foreground">Core Links</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between group rounded-xl"
              >
                Instagram Page
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between group rounded-xl"
              >
                Official Website
                <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
