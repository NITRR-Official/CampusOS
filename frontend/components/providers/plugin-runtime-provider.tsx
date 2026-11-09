'use client';

import React, { useEffect } from 'react';
import {
  setupPluginRuntime,
  loadPluginBundle
} from '@/lib/plugins/runtime-env';
import { initializePlugins } from '@/lib/plugins/init';
import { apiClient } from '@campus-os/shared/api-client';

/**
 * Ensures the CampusOS shared host runtime (React, Design System, Lucide Icons, PluginRegistry)
 * is initialized globally on window.__CampusOS_Runtime__ and window.CampusOS upon client load,
 * and dynamically bootstraps active plugin bundles at runtime without compile-time coupling (Issue #158 / #162).
 */
export function PluginRuntimeProvider({
  children
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    setupPluginRuntime();

    // 1. Run local plugin initializers for present in-tree modules
    initializePlugins().catch(() => {});

    // 2. Dynamically bootstrap all active plugins from the backend at runtime
    apiClient
      .get<{ modules?: string[] }>('/system/modules')
      .then((res) => {
        const modules = res?.modules || [];
        modules.forEach((mod) => {
          loadPluginBundle(mod).catch((err) => {
            // Notice: logged as a soft warning so a single plugin failure doesn't crash the host
            console.warn(
              `[PluginRuntimeProvider] Notice: could not load dynamic bundle for '${mod}':`,
              err.message
            );
          });
        });
      })
      .catch((err) => {
        console.warn(
          '[PluginRuntimeProvider] Failed to fetch active modules for runtime bootstrap:',
          err.message
        );
      });
  }, []);

  return <>{children}</>;
}

export default PluginRuntimeProvider;
