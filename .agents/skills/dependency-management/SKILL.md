---
name: dependency-management
description: "Security audits, dependency updates, compatibility checks, pnpm package management for CampusOS. Use when updating dependencies, auditing security, managing package versions, or resolving conflicts."
---

# Dependency Management

## When to Use

- Running security audits on dependencies
- Updating outdated packages
- Resolving dependency conflicts
- Managing monorepo dependencies with pnpm

## Procedure

### Phase 1: Security Auditing

```bash
pnpm audit                    # Check for vulnerabilities
pnpm audit --json             # Machine-readable output
pnpm audit --fix              # Auto-fix if available
```

### Phase 2: Dependency Inventory

```bash
pnpm list                     # All dependencies
pnpm list --prod              # Production only
pnpm outdated                 # Outdated packages
```

### Phase 3: Update Strategy

- **Patch** (1.0.x): Pull immediately, low risk
- **Minor** (1.x.0): Test before merge, usually safe
- **Major** (x.0.0): Manual review, check migration guide

```bash
pnpm update express@latest        # Specific package
pnpm update --interactive         # Choose versions
pnpm install --frozen-lockfile     # CI-safe install
```

### Phase 4: After Updating

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm -C plugins/vendor test -- --run
pnpm build
```

### Phase 5: Conflict Resolution

```bash
pnpm install --no-frozen-lockfile  # Resolve conflicts
pnpm prune                         # Remove unused deps
pnpm store prune                   # Clear pnpm cache
```

Use overrides in `package.json` if needed:
```json
{ "pnpm": { "overrides": { "lodash": "4.17.21" } } }
```

## Important

- **pnpm only** — never use npm or yarn
- Module-specific installs: `pnpm -C plugins/<module> add <package>`
- Dev dependencies: `pnpm add -D <package>`
- Commit updates separately: `chore: update dependencies`

## Common Issues

| Issue | Solution |
|-------|----------|
| High-severity vulnerability | Check if fix available; override version if needed |
| Update breaks tests | Revert lockfile; check migration guide |
| Peer dependency conflict | Use `pnpm.overrides` to pin version |
| pnpm install hangs | `pnpm store prune` then retry |
