import { notFound } from 'next/navigation';
import { fetchClubBySlug } from '@/lib/club-api';
import { RolesManager } from '@/components/clubs/roles/RolesManager';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClubRolesSettingsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const club = await fetchClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  // Ideally we would verify user permissions on the server too,
  // but for the UI we'll just render the client component.

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/clubs/${club.slug}`}
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Role Settings
          </h1>
          <p className="text-muted-foreground">
            Manage roles and permissions for {club.name}. Drag and drop to
            reorder hierarchy.
          </p>
        </div>
      </div>

      {/* 
        The RolesManager component will handle data fetching 
        for roles and permissions on the client side 
        to provide a snappy, reactive experience. 
      */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 overflow-hidden">
        <RolesManager
          clubId={
            club.id ||
            ((club as unknown as Record<string, unknown>)._id as string)
          }
        />
      </div>
    </div>
  );
}
