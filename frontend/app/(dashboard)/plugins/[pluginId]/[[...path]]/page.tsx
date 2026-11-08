import React from 'react';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    pluginId: string;
    path?: string[];
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Global Scope Catch-All Dynamic Route (ADR-018 / Issue #159)
 * Dynamically mounts any installed plugin's runtime ESM bundle at /plugins/[pluginId]/[[...path]]
 * without touching core Next.js files or rebuilding the frontend application.
 */
export default async function GlobalPluginCatchAllPage(props: PageProps) {
  const { pluginId, path: subPath } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};

  return (
    <div className="w-full flex-1">
      <DynamicPluginHost
        pluginName={pluginId}
        routeProps={{
          path: subPath,
          context: 'global',
          params: { pluginId, path: subPath },
          searchParams
        }}
      />
    </div>
  );
}
