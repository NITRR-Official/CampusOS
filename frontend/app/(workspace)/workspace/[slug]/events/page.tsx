import { EventsPage } from '@plugins/event/frontend/pages/EventsPage';

export const dynamic = 'force-dynamic';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <EventsPage clubId={resolvedParams.slug} />;
}
