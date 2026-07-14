'use client';

import Link from 'next/link';
import { useAllVendors } from '@plugins/vendor/frontend/hooks';

export function VendorsPage({ clubId }: { clubId: string }) {
  const { data: vendors = [], isLoading, error } = useAllVendors(clubId);

  if (isLoading) return <div className="p-4">Loading vendors...</div>;
  if (error)
    return (
      <div className="p-4 text-red-600">
        Error: {error instanceof Error ? error.message : String(error)}
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-4xl border border-border p-8 shadow-sm bg-card text-card-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              Vendor Management
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              Manage external suppliers, agencies, and partners for your events.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/clubs/${clubId}`}
              className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:bg-muted"
            >
              Back to dashboard
            </Link>
            <Link
              href={`/clubs/${clubId}/vendors/new`}
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 shadow-sm"
            >
              Add vendor
            </Link>
          </div>
        </div>
      </section>

      {vendors.length > 0 && (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:border-primary/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground line-clamp-1">
                    {vendor.name}
                  </h3>
                  <span className="mt-3 inline-block rounded-full bg-muted/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                    {vendor.category}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">Contact:</span>{' '}
                  {vendor.contactPerson || 'N/A'}
                </p>
                <p>
                  <span className="font-medium text-foreground">Phone:</span>{' '}
                  {vendor.phone || 'N/A'}
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <Link
                  href={`/clubs/${clubId}/vendors/${vendor.id}`}
                  className="flex-1 rounded-2xl border border-border/80 bg-muted px-4 py-2.5 text-center text-sm font-semibold text-foreground transition hover:border-primary/50 hover:bg-card"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}

      {vendors.length === 0 && (
        <section className="rounded-3xl border border-dashed border-border p-12 text-center bg-card">
          <p className="text-lg font-medium text-foreground mb-2">
            No vendors yet
          </p>
          <p className="text-sm text-muted-foreground">
            Create your first vendor to start managing suppliers.
          </p>
        </section>
      )}
    </div>
  );
}
