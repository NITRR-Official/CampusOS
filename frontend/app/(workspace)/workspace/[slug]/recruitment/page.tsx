import RecruitmentPage from '@plugins/recruitment/frontend/page';

export const dynamic = 'force-dynamic';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <RecruitmentPage entityId={resolvedParams.slug} entityType="club" />;
}
