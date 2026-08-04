import { ClubSettingsPage } from '@plugins/club/frontend/pages/ClubSettingsPage';

export const dynamic = 'force-dynamic';

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  return <ClubSettingsPage params={props.params} />;
}
