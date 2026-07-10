import { notFound } from 'next/navigation';
import { fetchClubBySlug } from '../api';
import { GeneralSettingsForm } from '../components/settings/GeneralSettingsForm';

export async function ClubSettingsPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  const club = await fetchClubBySlug(params.slug);

  if (!club) {
    notFound();
  }

  const initialData = {
    name: club.name || '',
    description: club.description || '',
    category: club.category || '',
    email: club.email || ''
  };

  return (
    <GeneralSettingsForm 
      clubId={club.id || (club as unknown as Record<string, unknown>)._id as string} 
      initialData={initialData} 
    />
  );
}
