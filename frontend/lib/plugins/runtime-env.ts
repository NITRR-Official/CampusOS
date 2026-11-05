'use client';

/**
 * CampusOS Frontend Plugin Runtime Environment (ADR-014)
 * Provides shared host context (React, ReactDOM, PluginRegistry, ExtensionPoint)
 * to dynamically loaded runtime ESM plugin bundles without bundling duplicate dependencies.
 */

import React from 'react';
import * as ReactDOM from 'react-dom';
import { registry } from '@campus-os/shared/plugin-registry';
import { ExtensionPoint } from '@campus-os/shared/extension-point';

export interface CampusOSRuntime {
  React: typeof React;
  ReactDOM: typeof ReactDOM;
  registry: typeof registry;
  ExtensionPoint: typeof ExtensionPoint;
  version: string;
  loadedPlugins: Set<string>;
}

declare global {
  interface Window {
    React?: typeof React;
    ReactDOM?: typeof ReactDOM;
    CampusOS?: CampusOSRuntime;
    __CampusOS_Runtime__?: CampusOSRuntime;
  }
}

/**
 * Initializes and exposes the shared runtime environment on the host window.
 */
export function setupPluginRuntime(): CampusOSRuntime {
  if (typeof window === 'undefined') {
    return {
      React,
      ReactDOM,
      registry,
      ExtensionPoint,
      version: '1.0.0',
      loadedPlugins: new Set()
    };
  }

  if (!window.__CampusOS_Runtime__) {
    const runtime: CampusOSRuntime = {
      React,
      ReactDOM,
      registry,
      ExtensionPoint,
      version: '1.0.0',
      loadedPlugins: new Set()
    };

    window.React = React;
    window.ReactDOM = ReactDOM;
    window.CampusOS = runtime;
    window.__CampusOS_Runtime__ = runtime;
  }

  return window.__CampusOS_Runtime__;
}

/**
 * Dynamically loads and mounts a plugin frontend ESM bundle in the browser.
 *
 * @param pluginName - Unique plugin identifier
 * @param bundleUrl - Optional custom bundle URL override
 * @returns Evaluated ES module containing exported components
 */
export async function loadPluginBundle(
  pluginName: string,
  bundleUrl?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (typeof window === 'undefined') {
    return null;
  }

  const runtime = setupPluginRuntime();
  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const url =
    bundleUrl || `${baseApiUrl}/api/v1/plugins/${pluginName}/bundle.js`;

  try {
    // Dynamic ESM import with webpackIgnore to avoid Next.js bundling remote URL
    const pluginModule = await import(/* webpackIgnore: true */ url);
    runtime.loadedPlugins.add(pluginName);

    // Auto-invoke frontend lifecycle hooks if exported
    if (typeof pluginModule.initFrontend === 'function') {
      pluginModule.initFrontend();
    } else if (typeof pluginModule.init === 'function') {
      pluginModule.init();
    }

    return pluginModule;
  } catch (error) {
    console.error(
      `[PluginRuntime] Failed to load frontend bundle for '${pluginName}':`,
      error
    );
    throw error;
  }
}

export default setupPluginRuntime;
