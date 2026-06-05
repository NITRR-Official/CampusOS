'use client';

import { useEffect, useState } from 'react';
import { fetchClubs, approveClub, rejectClub, Club } from '@/lib/club-api';
import { ShieldCheck, Check, X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClubApprovalsPage() {
  const [pendingClubs, setPendingClubs] = useState<Club[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingClubs();
  }, []);

  async function loadPendingClubs() {
    try {
      setIsLoading(true);
      const clubs = await fetchClubs('pending');
      setPendingClubs(clubs);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Failed to load pending clubs'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      await approveClub(id);
      setPendingClubs((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to approve club');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      await rejectClub(id);
      setPendingClubs((prev) => prev.filter((c) => c.id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reject club');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/50">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-3">
            <ShieldCheck className="size-4" />
            Admin Dashboard
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Club Approvals
          </h1>
          <p className="text-muted-foreground mt-1">
            Review and manage new student organization proposals.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-card/50 backdrop-blur border border-border/50 rounded-xl p-4 shadow-sm">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">
              {pendingClubs.length}
            </p>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">
              Pending Reviews
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertCircle className="size-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="rounded-2xl border border-border/50 bg-card/30 p-12 text-center text-muted-foreground animate-pulse">
            Loading proposals...
          </div>
        ) : pendingClubs.length === 0 ? (
          <div className="rounded-2xl border border-border/50 bg-card/30 p-12 text-center text-muted-foreground flex flex-col items-center">
            <ShieldCheck className="size-12 mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-sm">
              There are no pending club proposals to review.
            </p>
          </div>
        ) : (
          pendingClubs.map((club) => (
            <div
              key={club.id}
              className="group flex flex-col md:flex-row gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                      {club.name}
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground border border-border">
                        {club.category}
                      </span>
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Submitted on{' '}
                      {new Date(club.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none text-sm text-muted-foreground bg-muted/30 rounded-xl p-4 border border-border/50">
                  <span className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2 block">
                    Description & Mission
                  </span>
                  {club.description}
                </div>
              </div>

              <div className="flex md:flex-col items-center justify-end md:justify-center gap-3 border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6 shrink-0 min-w-[140px]">
                <Button
                  onClick={() => handleApprove(club.id)}
                  disabled={processingId === club.id}
                  className="w-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 shadow-none transition-colors group-hover:border-emerald-500/50"
                >
                  <Check className="size-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => handleReject(club.id)}
                  disabled={processingId === club.id}
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 hover:border-destructive transition-colors group-hover:border-destructive/50"
                >
                  <X className="size-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
