import { ClubDetailPage } from '@plugins/club/frontend/pages/ClubDetailPage';

export const dynamic = 'force-dynamic';

export default async function Page(props: {
  params: Promise<{ slug: string }>;
}) {
  return <ClubDetailPage params={props.params} />;
}
