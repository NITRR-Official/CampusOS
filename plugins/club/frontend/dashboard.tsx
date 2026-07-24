import React, { useEffect, useState } from 'react';
import { Target, Users, Plus } from 'lucide-react';
import { API_BASE_URL } from '@campus-os/shared/api-client';

export function ClubStatsWidget() {
  return (
    <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 text-2xl min-w-fit">
        <Target className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
          Clubs
        </p>
        <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">0</p>
      </div>
    </div>
  );
}

export function ClubMemberStatsWidget() {
  return (
    <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 text-2xl min-w-fit">
        <Users className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
          Members
        </p>
        <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">0</p>
      </div>
    </div>
  );
}

export function ClubQuickActionWidget() {
  return (
    <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 transition-colors">
        <Plus className="h-6 w-6" />
      </div>
      <span className="relative text-sm font-semibold tracking-wide text-foreground">
        Create Club
      </span>
    </button>
  );
}

export function ClubMemberQuickActionWidget() {
  return (
    <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500 transition-colors">
        <Users className="h-6 w-6" />
      </div>
      <span className="relative text-sm font-semibold tracking-wide text-foreground">
        Invite Member
      </span>
    </button>
  );
}

export function ClubActivityWidget() {
  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/clubs`)
      .then((res) => res.json())
      .then((data) => {
        setClubs(data.data?.slice(0, 3) || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch clubs for activity feed:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground animate-pulse">
        Loading recent clubs...
      </div>
    );
  }

  if (clubs.length === 0) {
    return null; // Let the dashboard be empty or handled by other plugins
  }

  return (
    <>
      {clubs.map((club, index) => (
        <div
          key={club._id || club.id || index}
          className="bg-card/80 backdrop-blur rounded-xl border border-border/60 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <Target className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground m-0">
              {club.name || 'New Club'}
            </p>
            <p className="text-sm text-muted-foreground m-0 mt-0.5">
              Created on {new Date(club.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full">
            Club
          </span>
        </div>
      ))}
    </>
  );
}
