import { VendorsPage } from '@plugins/vendor/frontend/pages/VendorsPage';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <VendorsPage clubId={resolvedParams.slug} />;
}
