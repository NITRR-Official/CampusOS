---
description: "Dependency security, version management, vulnerability scanning, pnpm package maintenance. Apply when auditing dependencies, updating packages, checking for vulnerabilities, or managing pnpm workspaces in CampusOS."
trigger: model_decision
---

# Dependency Manager Rules

## Package Manager

- **pnpm only** — never use `npm` or `yarn`
- Install from root: `pnpm install`
- Module-specific: `pnpm -C plugins/vendor add <package>`
- Dev dependencies: `pnpm add -D <package>`
- Lock file: `pnpm-lock.yaml` (never `package-lock.json`)

## Current Stack Versions

| Package | Version | Notes |
|---------|---------|-------|
| Node.js | 18+ | ES Modules |
| Express | 5.2.1 | v5, not v4 |
| Next.js | 16.2.2 | App Router |
| React | 19.2.4 | React 19 |
| Tailwind CSS | 4.x | v4 |
| shadcn/ui | 4.6.0 | UI components |
| Mongoose | Latest | MongoDB ODM |
| Vitest | Latest | Test runner |

## Vulnerability Response SLA

| Severity | Response Time | Action |
|----------|---------------|--------|
| Critical | Immediate | Hotfix within 24h |
| High | 24 hours | Include in next release |
| Medium | 1 week | Plan for next sprint |
| Low | 1 month | Track for future update |

## Audit Commands

```bash
pnpm audit                    # Check for vulnerabilities
pnpm audit --fix              # Auto-fix if available
pnpm outdated                 # List outdated packages
pnpm update --interactive     # Update interactively
pnpm install --frozen-lockfile # CI-safe install
pnpm store prune              # Clear pnpm cache
```

## Update Strategy

- **Patch** (1.0.x): Pull immediately, low risk
- **Minor** (1.x.0): Test before merge, usually safe
- **Major** (x.0.0): Manual review required, check migration guide, run full test suite

## Constraints

- Never update production dependencies without running full test suite
- Never skip `pnpm-lock.yaml` review in PRs
- Commit dependency updates separately: `chore: update dependencies`
- Document overrides with comments for context
