import { ClubMembersSettingsPage } from '@plugins/club/frontend/pages/ClubMembersSettingsPage';

export const metadata = {
  title: 'Members Settings - CampusOS'
};

export default function Page(props: { params: Promise<{ slug: string }> }) {
  return <ClubMembersSettingsPage params={props.params} />;
}
