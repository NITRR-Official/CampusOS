'use client';

import { useParams } from 'next/navigation';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function WorkspaceEventSchedulePage() {
  const params = useParams();
  const slug = params?.slug as string;
  const eventId = params?.eventId as string;
  return (
    <DynamicPluginHost
      pluginName="scheduling"
      routeProps={{
        context: 'workspace',
        clubSlug: slug,
        params: { eventId }
      }}
    />
  );
}
