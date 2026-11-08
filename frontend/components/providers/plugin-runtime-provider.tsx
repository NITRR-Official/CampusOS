'use client';

import React, { useEffect } from 'react';
import { setupPluginRuntime } from '@/lib/plugins/runtime-env';

/**
 * Ensures the CampusOS shared host runtime (React, Design System, Lucide Icons, PluginRegistry)
 * is initialized globally on window.__CampusOS_Runtime__ and window.CampusOS upon client load.
 */
export function PluginRuntimeProvider({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupPluginRuntime();
  }, []);

  return <>{children}</>;
}

export default PluginRuntimeProvider;
