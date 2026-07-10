import { EventDetailPage } from '@plugins/event/frontend/pages/EventDetailPage';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function Page({ params }: PageProps) {
  return <EventDetailPage params={params} />;
}
