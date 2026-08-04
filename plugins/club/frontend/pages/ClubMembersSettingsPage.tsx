import { notFound } from 'next/navigation';
import { fetchClubBySlug } from '../api';
import { MembersManager } from '../components/members/MembersManager';

export async function ClubMembersSettingsPage(props: {
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
          Members Management
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add, remove, and manage roles of club members.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 overflow-hidden">
        <MembersManager
          clubId={
            club.id ||
            ((club as unknown as Record<string, unknown>)._id as string)
          }
        />
      </div>
    </div>
  );
}
