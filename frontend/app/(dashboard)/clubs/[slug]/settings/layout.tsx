import { ReactNode } from 'react';
import Link from 'next/link';
import { fetchClubBySlug } from '@plugins/club/frontend/api';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { SettingsNav } from '@plugins/club/frontend/components/settings/SettingsNav';

export default async function ClubSettingsLayout(props: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const club = await fetchClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <Link
          href={`/clubs/${club.slug}`}
          className="inline-flex items-center justify-center p-2 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your club profile, team roles, and settings for {club.name}.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <SettingsNav clubSlug={club.slug} />
        </aside>
        
        <main className="flex-1">
          {props.children}
        </main>
      </div>
    </div>
  );
}
