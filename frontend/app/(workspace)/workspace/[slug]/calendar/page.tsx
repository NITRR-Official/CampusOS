'use client';

import { useParams } from 'next/navigation';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function WorkspaceCalendarPage() {
  const params = useParams();
  const slug = params?.slug as string;
  return (
    <DynamicPluginHost
      pluginName="calendar"
      routeProps={{ context: 'workspace', clubSlug: slug }}
    />
  );
}
