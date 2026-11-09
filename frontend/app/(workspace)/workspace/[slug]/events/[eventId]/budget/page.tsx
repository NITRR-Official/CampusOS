'use client';

import { useParams } from 'next/navigation';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function WorkspaceEventBudgetPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const eventId = params?.eventId as string;
  return (
    <DynamicPluginHost
      pluginName="budget"
      routeProps={{
        context: 'workspace',
        clubSlug: slug,
        params: { eventId }
      }}
    />
  );
}
