import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  discoverMigrations,
  calculateFileChecksum,
  runPendingMigrations,
  rollbackMigration,
  getMigrationStatus,
  InMemoryMigrationStorage
} from './migration-runner.js';
import { PluginMigrationError } from '@campus-os/shared/plugin-contract';

describe('Plugin Database Migration Runner (Issue #126)', () => {
  let tempDir;
  let storage;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'campusos-migration-test-')
    );
    storage = new InMemoryMigrationStorage();
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best effort cleanup
    }
  });

  describe('discoverMigrations', () => {
    it('returns empty array if directory or migrations do not exist', () => {
      expect(discoverMigrations(path.join(tempDir, 'non-existent'))).toEqual(
        []
      );
      expect(discoverMigrations(tempDir)).toEqual([]);
    });

    it('discovers and sorts migrations in natural ascending order', () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });

      fs.writeFileSync(
        path.join(migrationsDir, '002_add_index.js'),
        'export function up() {}'
      );
      fs.writeFileSync(
        path.join(migrationsDir, '001_create_table.js'),
        'export function up() {}'
      );
      fs.writeFileSync(
        path.join(migrationsDir, '010_update_schema.js'),
        'export function up() {}'
      );
      fs.writeFileSync(
        path.join(migrationsDir, '002_add_index.test.js'),
        '// test file ignored'
      );

      const discovered = discoverMigrations(tempDir);
      expect(discovered).toHaveLength(3);
      expect(discovered.map((d) => d.name)).toEqual([
        '001_create_table.js',
        '002_add_index.js',
        '010_update_schema.js'
      ]);
      expect(discovered[0].checksum).toBeDefined();
    });

    it('calculates deterministic SHA-256 checksums', () => {
      const testFile = path.join(tempDir, 'sample.js');
      fs.writeFileSync(testFile, 'console.log("hello");');
      const hash1 = calculateFileChecksum(testFile);
      const hash2 = calculateFileChecksum(testFile);
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });
  });

  describe('runPendingMigrations', () => {
    it('applies pending migrations sequentially and records them in storage', async () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });

      const auditTrail = [];
      const m1Content = `
        export async function up({ logger }) {
          logger.info("Migrating 001");
        }
      `;
      const m2Content = `
        export async function up({ logger }) {
          logger.info("Migrating 002");
        }
      `;

      fs.writeFileSync(path.join(migrationsDir, '001_initial.js'), m1Content);
      fs.writeFileSync(path.join(migrationsDir, '002_secondary.js'), m2Content);

      const mockLogger = {
        info: vi.fn((msg) => auditTrail.push(msg)),
        warn: vi.fn(),
        error: vi.fn()
      };

      const result = await runPendingMigrations('sample-plugin', tempDir, {
        storage,
        logger: mockLogger,
        version: '1.2.0'
      });

      expect(result.success).toBe(true);
      expect(result.appliedCount).toBe(2);
      expect(result.appliedMigrations).toEqual([
        '001_initial.js',
        '002_secondary.js'
      ]);

      expect(auditTrail).toContain('Migrating 001');
      expect(auditTrail).toContain('Migrating 002');

      const applied = await storage.getApplied('sample-plugin');
      expect(applied).toHaveLength(2);
      expect(applied[0].migrationName).toBe('001_initial.js');
      expect(applied[0].version).toBe('1.2.0');
      expect(applied[1].migrationName).toBe('002_secondary.js');

      // Subsequent run should detect no pending migrations
      const rerun = await runPendingMigrations('sample-plugin', tempDir, {
        storage,
        logger: mockLogger
      });
      expect(rerun.appliedCount).toBe(0);
      expect(rerun.appliedMigrations).toEqual([]);
    });

    it('throws PluginMigrationError if migration does not export up function', async () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });

      fs.writeFileSync(
        path.join(migrationsDir, '001_invalid.js'),
        'export const notUp = 42;'
      );

      await expect(
        runPendingMigrations('bad-plugin', tempDir, { storage })
      ).rejects.toThrow(PluginMigrationError);
    });

    it('attempts rollback and leaves migration unrecorded when up throws', async () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });

      let rollbackExecuted = false;
      const failingContent = `
        export async function up() {
          throw new Error("Simulated DDL failure");
        }
        export async function down() {
          // Rollback hook
        }
      `;

      fs.writeFileSync(path.join(migrationsDir, '001_fail.js'), failingContent);

      const mockLogger = {
        info: vi.fn(),
        warn: vi.fn((msg) => {
          if (msg.includes('rollback')) rollbackExecuted = true;
        }),
        error: vi.fn()
      };

      await expect(
        runPendingMigrations('failing-plugin', tempDir, {
          storage,
          logger: mockLogger
        })
      ).rejects.toThrow(/Simulated DDL failure/);

      expect(rollbackExecuted).toBe(true);
      const applied = await storage.getApplied('failing-plugin');
      expect(applied).toHaveLength(0);
    });

    it('supports dryRun flag without recording migrations', async () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });
      fs.writeFileSync(
        path.join(migrationsDir, '001_step.js'),
        'export function up() {}'
      );

      const result = await runPendingMigrations('dry-plugin', tempDir, {
        storage,
        dryRun: true
      });

      expect(result.dryRun).toBe(true);
      expect(result.appliedCount).toBe(1);
      const applied = await storage.getApplied('dry-plugin');
      expect(applied).toHaveLength(0);
    });
  });

  describe('rollbackMigration', () => {
    it('rolls back last applied migration and removes record from storage', async () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });

      let downCalled = false;
      fs.writeFileSync(
        path.join(migrationsDir, '001_step.js'),
        `
        export async function up() {}
        export async function down() {
          // roll back
        }
        `
      );

      const mockLogger = {
        info: vi.fn((msg) => {
          if (msg.includes('Rolled back')) downCalled = true;
        }),
        warn: vi.fn(),
        error: vi.fn()
      };

      await runPendingMigrations('rollback-plugin', tempDir, {
        storage,
        logger: mockLogger
      });
      expect(await storage.getApplied('rollback-plugin')).toHaveLength(1);

      const result = await rollbackMigration(
        'rollback-plugin',
        tempDir,
        undefined,
        {
          storage,
          logger: mockLogger
        }
      );

      expect(result.success).toBe(true);
      expect(result.rolledBack).toBe('001_step.js');
      expect(downCalled).toBe(true);
      expect(await storage.getApplied('rollback-plugin')).toHaveLength(0);
    });

    it('throws PluginMigrationError when no migrations exist to roll back', async () => {
      await expect(
        rollbackMigration('empty-plugin', tempDir, undefined, { storage })
      ).rejects.toThrow(/No applied migrations found/);
    });
  });

  describe('getMigrationStatus', () => {
    it('accurately reports status of applied and pending migrations', async () => {
      const migrationsDir = path.join(tempDir, 'migrations');
      fs.mkdirSync(migrationsDir, { recursive: true });

      fs.writeFileSync(
        path.join(migrationsDir, '001_first.js'),
        'export function up() {}'
      );
      fs.writeFileSync(
        path.join(migrationsDir, '002_second.js'),
        'export function up() {}'
      );

      // Apply first migration only
      await storage.record({
        pluginName: 'status-plugin',
        migrationName: '001_first.js',
        appliedAt: new Date(),
        checksum: 'abc'
      });

      const status = await getMigrationStatus('status-plugin', tempDir, {
        storage
      });

      expect(status.totalCount).toBe(2);
      expect(status.appliedCount).toBe(1);
      expect(status.pendingCount).toBe(1);

      expect(status.migrations[0].name).toBe('001_first.js');
      expect(status.migrations[0].status).toBe('applied');

      expect(status.migrations[1].name).toBe('002_second.js');
      expect(status.migrations[1].status).toBe('pending');
    });
  });
});
