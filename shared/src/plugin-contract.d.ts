import { z } from 'zod';
import {
  PluginManifestSchema,
  PluginDependenciesSchema
} from './plugin-contract.js';

export { PluginManifestSchema, PluginDependenciesSchema };

export class PluginContractError extends Error {
  pluginName?: string;
  details?: unknown;
  constructor(message: string, pluginName?: string, details?: unknown);
}

export class PluginSecurityError extends PluginContractError {}
export class AccessDeniedError extends PluginSecurityError {}
export class InvalidTierClaimError extends PluginSecurityError {}

export type PluginManifest = z.infer<typeof PluginManifestSchema>;

export type PluginInitFunction = (
  app: any,
  registry: any,
  eventBus?: any,
  logger?: any
) => Promise<void> | void;

export interface CampusOSPlugin {
  manifest: PluginManifest;
  init: PluginInitFunction;
}

export function validatePluginManifest(
  rawManifest: unknown,
  folderName?: string
): PluginManifest;
