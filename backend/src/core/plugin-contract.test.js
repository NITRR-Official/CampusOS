import { describe, it, expect } from 'vitest';
import {
  PluginManifestSchema,
  validatePluginManifest,
  PluginContractError
} from '@campus-os/shared/plugin-contract';

describe('PluginManifestSchema & validatePluginManifest (Issue #113)', () => {
  const validManifest = {
    name: 'audit-ledger',
    version: '1.2.0',
    description: 'Provides tamper-proof audit trails for campus operations',
    defaultEnabled: true,
    dependencies: {
      club: '^1.0.0'
    },
    database: {
      type: 'mongodb'
    },
    themeColor: 'bg-emerald-100 text-emerald-700'
  };

  it('successfully validates a fully compliant plugin manifest', () => {
    const directParsed = PluginManifestSchema.parse(validManifest);
    expect(directParsed.name).toBe('audit-ledger');

    const parsed = validatePluginManifest(validManifest, 'audit-ledger');
    expect(parsed.name).toBe('audit-ledger');
    expect(parsed.version).toBe('1.2.0');
    expect(parsed.dependencies.club).toBe('^1.0.0');
    expect(parsed.database?.type).toBe('mongodb');
  });

  it('normalizes array dependencies into record structure', () => {
    const manifestWithArrayDeps = {
      name: 'simple-plugin',
      version: '0.1.0',
      description: 'Simple plugin',
      dependencies: ['auth', 'club']
    };

    const parsed = validatePluginManifest(
      manifestWithArrayDeps,
      'simple-plugin'
    );
    expect(parsed.dependencies).toEqual({
      auth: '*',
      club: '*'
    });
  });

  it('rejects non-kebab-case plugin names', () => {
    const invalidNames = [
      'AuditLedger',
      'audit_ledger',
      'audit ledger',
      'audit@ledger'
    ];

    for (const badName of invalidNames) {
      expect(() =>
        validatePluginManifest({ ...validManifest, name: badName }, badName)
      ).toThrow(PluginContractError);
    }
  });

  it('rejects non-semver version strings', () => {
    const invalidVersions = ['v1.0', '1.0', 'alpha', 'latest', '1.0.0.0'];

    for (const badVer of invalidVersions) {
      expect(() =>
        validatePluginManifest(
          { ...validManifest, version: badVer },
          'audit-ledger'
        )
      ).toThrow(PluginContractError);
    }
  });

  it('rejects empty descriptions', () => {
    expect(() =>
      validatePluginManifest(
        { ...validManifest, description: '' },
        'audit-ledger'
      )
    ).toThrow(PluginContractError);
  });

  it('rejects invalid dependency semver ranges', () => {
    expect(() =>
      validatePluginManifest(
        {
          ...validManifest,
          dependencies: {
            club: 'not-a-range'
          }
        },
        'audit-ledger'
      )
    ).toThrow(PluginContractError);
  });

  it('rejects manifest when folder name does not match manifest.name', () => {
    expect(() =>
      validatePluginManifest(validManifest, 'different-folder-name')
    ).toThrow(/does not match manifest name/);
  });

  it('allows frontend-only plugins with backend: false', () => {
    const frontendManifest = {
      name: 'admin-ui',
      version: '1.0.0',
      description: 'Admin frontend dashboard',
      frontend: true,
      backend: false
    };

    const parsed = validatePluginManifest(frontendManifest, 'admin-ui');
    expect(parsed.backend).toBe(false);
    expect(parsed.frontend).toBe(true);
  });
});
