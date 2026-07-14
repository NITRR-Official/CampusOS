import { EventDetailPage } from '@plugins/event/frontend/pages/EventDetailPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ eventId: string; slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const resolvedParams = await params;
  return <EventDetailPage params={params} clubId={resolvedParams.slug} />;
}
