import { ClubDashboard } from '@plugins/club/frontend/pages/ClubDashboard';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <ClubDashboard slug={resolvedParams.slug} />;
}
