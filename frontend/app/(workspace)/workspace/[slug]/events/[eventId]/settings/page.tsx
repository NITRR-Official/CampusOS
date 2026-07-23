import { EventSettingsPage } from '@plugins/event/frontend/pages/EventSettingsPage';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  return <EventSettingsPage params={params} />;
}
