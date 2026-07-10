import { ClubRolesSettingsPage } from '@plugins/club/frontend/pages/ClubRolesSettingsPage';

export const dynamic = 'force-dynamic';

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  return <ClubRolesSettingsPage params={props.params} />;
}
