---
name: dependency-management
description: 'Security audits, dependency updates, compatibility checks, vulnerability scanning. Use when: updating dependencies, auditing security, managing package versions, resolving conflicts.'
argument-hint: 'audit-type, severity-level'
---

# Dependency Management

## When to Use

- Running security audits on dependencies
- Updating outdated packages
- Checking compatibility before updating
- Resolving dependency conflicts
- Scanning for vulnerabilities
- Managing monorepo dependencies

## What This Skill Does

Manages CampusOS dependencies securely, including auditing, updating, and compatibility verification.

## Procedure

### Phase 1: Security Auditing

1. Audit current dependencies: `pnpm audit`
2. Output shows identified vulnerabilities:
   - Package name, vulnerability, severity (critical, high, moderate, low)
   - Current version, required version to fix
3. View details: `pnpm audit --json` for machine-readable output
4. Filter by severity: `pnpm audit --filter moderate`
5. Ignore low-severity (review before):
   ```json
   {
     "pnpm": { "overrides": { "vulnerable-pkg": "1.0.0" } }
   }
   ```
6. Schedule audits in CI: Weekly in GitHub Actions

### Phase 2: Dependency Inventory

1. List all dependencies: `pnpm list`
2. View production dependencies only: `pnpm list --prod`
3. Find duplicate/multiple versions: `pnpm list --depth 0`
4. Check for circular dependencies: `pnpm ls --graph`
5. Export to file: `pnpm list > deps.txt`
6. Verify no breaking major versions: Check if 2.x installed alongside 3.x

### Phase 3: Update Strategy

1. Classify updates:
   - **Patch** (1.0.0 → 1.0.1): Safe, pull immediately
   - **Minor** (1.0.0 → 1.1.0): Usually safe, test before merge
   - **Major** (1.0.0 → 2.0.0): Breaking changes, manual review required
2. Establish update cadence:
   - Security patches: Immediately (same day)
   - Minor updates: Weekly
   - Major updates: Monthly (after thorough testing)
3. Test updates locally first: `pnpm update` on feature branch
4. Run full test suite: `pnpm test && pnpm test:integration`
5. Monitor for regressions: Check error tracking for 24hrs post-deploy
6. Use automated tools: Dependabot, Renovate for PR automation

### Phase 4: Updating Dependencies

1. Check for outdated packages: `pnpm outdated`
2. Update specific package: `pnpm update express@latest`
3. Update all minor/patch: `pnpm update --interactive`
4. Update major versions (careful):
   ```bash
   pnpm update @chakra-ui/react@3! # Major version 3
   ```
5. Review changes to APIs in migration guide (check GitHub)
6. Verify `pnpm-lock.yaml` changes are minimal
7. Commit separately: "chore: update dependencies"

### Phase 5: Compatibility Verification

1. After update, run full test suite:
   ```bash
   pnpm install --frozen-lockfile
   pnpm lint
   pnpm test
   pnpm build
   ```
2. Check for deprecated APIs:
   ```bash
   npm deprecations | grep campusos
   ```
3. Review peer dependency warnings:
   ```
   warn! peer dep missing: react@18, installed: react@17
   ```
4. Test in development environment (dev machine + Docker)
5. Test integration with other services (backend/frontend)
6. Monitor staging environment for 24hrs before production

### Phase 6: Conflict Resolution & Cleanup

1. If `pnpm install` fails, resolve conflicts:
   ```bash
   pnpm install --no-frozen-lockfile
   # Retry install
   pnpm install
   ```
2. Check for conflicting peer dependencies:
   ```
   pnpm install --strict-peer-dependencies
   ```
3. Override conflicting versions in `package.json`:
   ```json
   { "pnpm": { "overrides": { "lodash": "4.17.21" } } }
   ```
4. Remove unused dependencies:
   ```bash
   pnpm prune
   ```
5. Update transitive dependencies safely:
   ```bash
   pnpm update --recursive --interactive
   ```
6. Document overrides with comments for future context

## Quick Reference

```bash
# Security audit
pnpm audit

# Fix automatically (if available)
pnpm audit --fix

# List outdated packages
pnpm outdated

# Update interactively (choose versions)
pnpm update --interactive

# Update specific package
pnpm update express@6.0.0

# Check for vulnerabilities before deploy
pnpm audit --prod

# Reset dependencies to lock file
pnpm install --frozen-lockfile

# Clean up unused deps
pnpm prune
```

## Troubleshooting

| Issue                                   | Solution                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| High-severity vulnerability with no fix | Evaluate alternative package; override with lower version if needed; document in PR   |
| Update breaks tests                     | Revert: `git checkout pnpm-lock.yaml`; check migration guide; file issue with package |
| Peer dependency conflict                | Review conflict message; use `pnpm.overrides` to specify version; test compatibility  |
| pnpm install hangs                      | Clear cache: `pnpm store prune`; retry with `--no-frozen-lockfile`                    |
| Circular dependency detected            | Use `pnpm ls --graph` to identify; refactor imports to break loop                     |
| Duplicate package versions              | Resolve in `pnpm-lock.yaml` or use `.pnpmfile.cjs` hook                               |
