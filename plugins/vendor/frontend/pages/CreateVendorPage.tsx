'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateVendor } from '../hooks';

export function CreateVendorPage({ clubId }: { clubId: string }) {
  const router = useRouter();
  const createVendorMutation = useCreateVendor(clubId);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    createVendorMutation.mutate(
      {
        name,
        category,
        contactPerson,
        email,
        phone
      },
      {
        onSuccess: () => {
          router.push(`/clubs/${clubId}/vendors`);
        },
        onError: (err: any) => {
          setError(err.message || 'Failed to create vendor');
        }
      }
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="rounded-4xl border border-border p-8 shadow-sm bg-card text-card-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Add New Vendor
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Register a new external supplier or partner.
            </p>
          </div>
          <Link
            href={`/clubs/${clubId}/vendors`}
            className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:bg-muted"
          >
            Cancel
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Vendor Name *
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Acme Catering"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category *
              </span>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Food & Beverage"
                required
              />
            </label>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contact Person *
              </span>
              <input
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="John Doe"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Email *
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="john@acme.com"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Phone *
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-2xl border border-border/80 bg-muted px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="+1 234 567 8900"
                required
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={createVendorMutation.isPending}
            className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
          >
            {createVendorMutation.isPending ? 'Saving...' : 'Save Vendor'}
          </button>
        </form>
      </section>
    </div>
  );
}
