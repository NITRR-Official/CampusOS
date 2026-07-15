import { VendorDetailsPage } from '@plugins/vendor/frontend/pages/VendorDetailsPage';

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  return <VendorDetailsPage clubId={resolvedParams.slug} />;
}
