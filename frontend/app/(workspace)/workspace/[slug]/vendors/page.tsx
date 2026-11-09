'use client';

import { useParams } from 'next/navigation';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function WorkspaceVendorsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  return (
    <DynamicPluginHost
      pluginName="vendor"
      routeProps={{ context: 'workspace', clubSlug: slug }}
    />
  );
}
