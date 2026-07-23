import React from 'react';
import { Calendar, Plus } from 'lucide-react';

export function EventStatsWidget() {
  return (
    <div className="bg-card/80 backdrop-blur text-card-foreground rounded-lg shadow-sm border border-border/60 p-6 flex items-center gap-4 hover:border-primary/50 hover:shadow-md transition-all duration-200">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 text-2xl min-w-fit">
        <Calendar className="h-6 w-6" />
      </div>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-semibold m-0 mb-1">
          Events
        </p>
        <p className="text-2xl md:text-3xl font-bold m-0 text-foreground">0</p>
      </div>
    </div>
  );
}

export function EventQuickActionWidget() {
  return (
    <button className="group relative overflow-hidden flex flex-col items-center justify-center gap-4 p-6 bg-card/80 backdrop-blur text-card-foreground border border-border/60 shadow-sm rounded-xl cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 active:translate-y-0 text-center min-h-[140px]">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border/50 text-foreground shadow-sm group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-colors">
        <Plus className="h-6 w-6" />
      </div>
      <span className="relative text-sm font-semibold tracking-wide text-foreground">
        Schedule Event
      </span>
    </button>
  );
}
