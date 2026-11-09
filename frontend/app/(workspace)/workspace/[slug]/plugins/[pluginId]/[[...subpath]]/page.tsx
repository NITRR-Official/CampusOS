'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { DynamicPluginHost } from '@/components/plugins/DynamicPluginHost';

export default function WorkspacePluginCatchAllPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const clubSlug = (params?.slug as string) || '';
  const pluginId = (params?.pluginId as string) || '';
  const rawSubpath = params?.subpath;
  const subpath = Array.isArray(rawSubpath)
    ? rawSubpath
    : typeof rawSubpath === 'string'
      ? [rawSubpath]
      : [];

  const searchParamsRecord: Record<string, string> = {};
  searchParams?.forEach((val, key) => {
    searchParamsRecord[key] = val;
  });

  return (
    <div className="w-full">
      <DynamicPluginHost
        pluginName={pluginId}
        routeProps={{
          context: 'workspace',
          clubSlug,
          path: subpath,
          slug: subpath,
          searchParams: searchParamsRecord
        }}
      />
    </div>
  );
}
