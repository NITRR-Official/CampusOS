import { InvalidTierClaimError } from '@campus-os/shared/plugin-contract';

/**
 * Immutable whitelist of verified first-party core plugins.
 * Only plugins in this set (or explicitly trusted by administrator in DB)
 * can run with unrestricted core tier privileges.
 */
export const OFFICIAL_CORE_PLUGINS = Object.freeze(
  new Set([
    'activity',
    'admin',
    'auth',
    'budget',
    'calendar',
    'checkin',
    'club',
    'event',
    'forms',
    'institute',
    'plugin-manager',
    'recruitment',
    'resource',
    'scheduling',
    'task',
    'vendor'
  ])
);

/**
 * Validates the provenance and tier declaration of a plugin.
 * Prevents unauthorized privilege escalation attempts ("Manifest proposes, Host enforces").
 *
 * @param {object} manifest - The validated plugin manifest
 * @param {object} [options]
 * @param {boolean} [options.trusted=false] - Whether administrator marked plugin as trusted in DB
 * @param {boolean} [options.isProd=false] - Whether strict fail-fast enforcement is active
 * @returns {{ verifiedTier: 'core' | 'community', demoted: boolean }}
 * @throws {InvalidTierClaimError} When an unverified plugin attempts privilege escalation
 */
export function verifyPluginProvenance(manifest, options = {}) {
  const pluginName = manifest?.name || 'unknown';
  const claimedTier = manifest?.tier || 'community';
  const isOfficial = OFFICIAL_CORE_PLUGINS.has(pluginName);
  const isTrusted = Boolean(options.trusted);
  const isStrict = Boolean(options.isProd || options.failFast);

  // If plugin claims core tier
  if (claimedTier === 'core') {
    if (!isOfficial && !isTrusted) {
      const msg = `Security violation: Plugin '${pluginName}' attempted privilege escalation by claiming tier 'core'. Only verified first-party plugins or admin-trusted internal plugins can claim core tier.`;
      if (isStrict) {
        throw new InvalidTierClaimError(msg, pluginName, {
          claimedTier,
          isOfficial,
          isTrusted
        });
      }
      return { verifiedTier: 'community', demoted: true };
    }
    return { verifiedTier: 'core', demoted: false };
  }

  // If official core plugin omitted tier or declared community
  if (isOfficial) {
    return { verifiedTier: 'core', demoted: false };
  }

  // Admin-trusted plugin
  if (isTrusted) {
    return { verifiedTier: 'core', demoted: false };
  }

  return { verifiedTier: 'community', demoted: false };
}

export default {
  OFFICIAL_CORE_PLUGINS,
  verifyPluginProvenance
};
