import { EventParticipantsPage } from '@plugins/event/frontend/pages/EventParticipantsPage';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  return <EventParticipantsPage params={params} />;
}
