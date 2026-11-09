'use client';

import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function AdminActivityPage() {
  return (
    <DynamicPluginHost
      pluginName="activity"
      routeProps={{ context: 'global', path: ['admin', 'activity'] }}
    />
  );
}
