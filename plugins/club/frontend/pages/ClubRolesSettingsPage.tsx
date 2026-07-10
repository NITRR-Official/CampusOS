import { notFound } from 'next/navigation';
import { fetchClubBySlug } from '../api';
import { RolesManager } from '../components/roles/RolesManager';

export async function ClubRolesSettingsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const club = await fetchClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Roles & Permissions
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage roles and permissions. Drag and drop to reorder hierarchy.
        </p>
      </div>

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
