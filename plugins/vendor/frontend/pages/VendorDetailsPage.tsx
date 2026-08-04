'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useVendor, useVendorAssignments } from '../hooks';

export function VendorDetailsPage({ clubId }: { clubId: string }) {
  const params = useParams();
  const vendorId = params.id as string;

  const {
    data: vendor,
    isLoading: vendorLoading,
    error: vendorError
  } = useVendor(vendorId);
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useVendorAssignments(vendorId);

  if (vendorLoading)
    return <div className="p-4">Loading vendor details...</div>;
  if (vendorError || !vendor) {
    return (
      <div className="p-4 text-red-600">
        Error:{' '}
        {vendorError instanceof Error
          ? vendorError.message
          : 'Vendor not found'}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="rounded-4xl border border-border p-8 shadow-sm bg-card text-card-foreground">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {vendor.name}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
              {vendor.category} • {vendor.status}
            </p>
          </div>
          <Link
            href={`/clubs/${clubId}/vendors`}
            className="rounded-full border border-border/80 bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-border hover:bg-muted"
          >
            Back to Vendors
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-foreground">
              Contact Info
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Person:</span>{' '}
                {vendor.contactPerson}
              </p>
              <p>
                <span className="font-medium text-foreground">Email:</span>{' '}
                {vendor.email}
              </p>
              <p>
                <span className="font-medium text-foreground">Phone:</span>{' '}
                {vendor.phone}
              </p>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-foreground">
              Assignments
            </h2>
            {assignmentsLoading ? (
              <div>Loading assignments...</div>
            ) : assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex justify-between items-center border-b border-border pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Event ID: {assignment.eventId}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: {assignment.status}
                      </p>
                    </div>
                    {assignment.cost && (
                      <div className="text-sm font-semibold">$</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No assignments yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
