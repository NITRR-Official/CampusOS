'use client';

import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function AdminPage() {
  return <DynamicPluginHost pluginName="admin" />;
}
