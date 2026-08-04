/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClub } from '@plugins/club/frontend/api';
import { Building2, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@campusos/design-system';
import { Input } from '@campusos/design-system';
import { Label } from '@campusos/design-system';

export default function NewClubPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      email: formData.get('email') as string,
      instituteId: 'nitrr' // Mocked institute ID for MVP
    };

    try {
      await createClub(payload);
      setSuccess(true);
      // Optional: wait a moment then redirect
      setTimeout(() => {
        router.push('/clubs');
      }, 3000);
    } catch (err: any) {
      setError(
        err instanceof Error ? err.message : 'Failed to submit proposal'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-20 p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 text-center shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-emerald-500/20 p-4">
            <CheckCircle2 className="size-12 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Check Your Email!
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          We've sent a verification link to the official club email address you
          provided. Please click the link in the email to verify your address
          before the administration can review your proposal.
        </p>
        <Button
          onClick={() => router.push('/clubs')}
          className="rounded-xl px-8"
        >
          Return to Clubs
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-8 md:p-12 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-3xl rounded-full opacity-50 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
            <Sparkles className="size-4" />
            New Initiative
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Propose a Club
          </h1>
          <p className="text-lg text-muted-foreground">
            Have a great idea for a new student organization? Fill out the
            proposal form below to submit it for administrative approval.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/30 backdrop-blur-md p-8 md:p-12 shadow-sm">
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
            <AlertCircle className="size-5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold">
                Club Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                minLength={3}
                maxLength={120}
                placeholder="e.g., Quantum Computing Society"
                className="h-12 rounded-xl bg-background border-border/50 focus-visible:ring-primary/20"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="category" className="text-sm font-semibold">
                Category
              </Label>
              <select
                id="category"
                name="category"
                required
                className="flex h-12 w-full rounded-xl border border-border/50 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a category...</option>
                <option value="Technology">Technology & Engineering</option>
                <option value="Cultural">Cultural & Arts</option>
                <option value="Sports">Sports & Athletics</option>
                <option value="Academic">Academic & Research</option>
                <option value="Social">Social & Volunteering</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label htmlFor="email" className="text-sm font-semibold">
                Official Contact Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="e.g., hello@quantum.club"
                className="h-12 rounded-xl bg-background border-border/50 focus-visible:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="description" className="text-sm font-semibold">
              Mission & Description
            </Label>
            <textarea
              id="description"
              name="description"
              required
              maxLength={500}
              rows={5}
              placeholder="Describe the purpose, goals, and activities of the proposed club..."
              className="flex w-full rounded-xl border border-border/50 bg-background px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Maximum 500 characters.
            </p>
          </div>

          <div className="pt-4 border-t border-border/50 flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="rounded-xl px-6 h-12"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl px-8 h-12 gap-2 shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5"
            >
              <Building2 className="size-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
