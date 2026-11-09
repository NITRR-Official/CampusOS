'use client';

import { useParams } from 'next/navigation';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function WorkspaceTasksPage() {
  const params = useParams();
  const slug = params?.slug as string;
  return (
    <DynamicPluginHost
      pluginName="task"
      routeProps={{ context: 'workspace', clubSlug: slug }}
    />
  );
}
