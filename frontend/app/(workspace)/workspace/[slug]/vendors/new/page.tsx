import { CreateVendorPage } from '@plugins/vendor/frontend/pages/CreateVendorPage';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <CreateVendorPage clubId={resolvedParams.slug} />;
}
