import React from 'react';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    slug: string;
    pluginId: string;
    path?: string[];
  }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Workspace Scope Catch-All Dynamic Route (ADR-018 / Issue #159)
 * Dynamically mounts any club/workspace plugin's runtime ESM bundle at /workspace/[slug]/plugins/[pluginId]/[[...path]]
 * with active workspace club context passed down to the plugin component.
 */
export default async function WorkspacePluginCatchAllPage(props: PageProps) {
  const { slug, pluginId, path: subPath } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};

  return (
    <div className="w-full flex-1">
      <DynamicPluginHost
        pluginName={pluginId}
        routeProps={{
          path: subPath,
          context: 'workspace',
          clubSlug: slug,
          params: { slug, pluginId, path: subPath },
          searchParams
        }}
      />
    </div>
  );
}
