---
name: code-review
description: 'Comprehensive codebase review for inconsistencies, security vulnerabilities, code quality, and documentation. Use when: submitting PRs, preparing releases, onboarding new team members, or conducting periodic audits. Covers architecture patterns, dependency security, linting, type checking, and Humanet validation.'
argument-hint: 'Optional: focus areas (all, security, architecture, quality, docs) or file path'
---

# Code Review Skill

## When to Use

- **Before submitting pull requests** — ensure code meets quality standards
- **Release preparation** — verify no security issues or breaking changes
- **Team onboarding** — familiarize with codebase patterns and standards
- **Periodic audits** — catch drift from architecture decisions
- **Dependency updates** — scan for vulnerabilities after pnpm update

## What This Skill Does

Performs systematic code review across four dimensions:

1. **Architecture Consistency** — Modular patterns, module naming, plugin structure
2. **Security Vulnerabilities** — Dependency audits, secret detection, auth patterns
3. **Code Quality** — Linting, type checking, unused code
4. **Documentation** — Humanet validation, ADR alignment, README accuracy

## Procedure

### Phase 1: Setup (Minutes)

```bash
cd d:\Sanskar\programming\projects\campus-os

# 1. Install tools if not already present
pnpm install --save-dev @commitlint/cli eslint prettier typescript

# 2. Run diagnostic
pnpm run analyze:codebase
```

### Phase 2: Security Review (~5 minutes)

Execute [security checks script](./scripts/security-check.sh):

```bash
pnpm run audit:security
```

**Checks performed:**

- ✅ Dependency vulnerability scan (`pnpm audit`)
- ✅ Secrets detection (no API keys, tokens, passwords in code)
- ✅ Auth pattern validation (JWT usage, session handling)
- ✅ Environment variable validation

**If vulnerabilities found:**

- Document severity (critical, high, medium, low)
- Check if already documented in ADRs
- Create issue for remediation
- Run `pnpm update` to patch if safe

### Phase 3: Architecture Review (~10 minutes)

Use [architecture checklist](./references/architecture-checklist.md):

```bash
pnpm run validate:architecture
```

**Checks performed:**

- ✅ Module structure compliance (all code in `/apps/*`)
- ✅ No direct module-to-module imports (only via DB or services)
- ✅ Plugin loader usage correctness
- ✅ ADR alignment with code decisions
- ✅ Database schema consistency

**If inconsistencies found:**

- Compare against [ADR-003: System Layers](../../.humanet/discussions/003-system-layers.md)
- Check [ADR-004: Development Strategy](../../.humanet/discussions/004-development-strategy.md)
- Update code or ADR accordingly

### Phase 4: Code Quality Review (~15 minutes)

Execute [quality checks](./scripts/quality-check.sh):

```bash
pnpm run lint:all
pnpm run type:check
pnpm run format:check
```

**Checks performed:**

- ✅ ESLint rules compliance
- ✅ TypeScript type correctness
- ✅ Code formatting (Prettier)
- ✅ Unused variables/imports detection
- ✅ Jest test coverage baseline

**If issues found:**

- Auto-fix with `pnpm run fix:all`
- Review failing tests: `pnpm run test`
- Update test snapshots only if intentional

### Phase 5: Documentation Review (~5 minutes)

Run [documentation validation](./scripts/docs-check.sh):

```bash
# Validate Humanet structure
humanet validate

# Check README accuracy
pnpm run validate:docs
```

**Checks performed:**

- ✅ Humanet YAML frontmatter correctness
- ✅ ADR references in code match reality
- ✅ README command accuracy (copy/paste and run each section)
- ✅ `COPILOT.md` rules followed
- ✅ `ROADMAP.md` alignment with implementation

**If issues found:**

- Update `.humanet/` files
- Run `humanet validate` to confirm
- Update README with current command syntax

### Phase 6: Generate Report

Create summary for PR/release notes:

```bash
pnpm run review:report
```

**Output locations:**

- `review-report.md` — Summary of all findings
- `review-details.json` — Machine-readable results
- Git staging — Ready to commit if all passing

## Decision Points

| Finding Level | Security | Architecture | Quality       | Docs    | Action             |
| ------------- | -------- | ------------ | ------------- | ------- | ------------------ |
| ✅ Passing    | None     | None         | None          | None    | Approve & merge    |
| ⚠️ Warning    | Low      | Warning      | Minor         | Info    | Document & proceed |
| 🔴 Blocking   | Any      | Core pattern | Test failures | Missing | Fix before merge   |

## Quick Reference

### All Checks

```bash
pnpm run review:all
```

### Specific Focus

```bash
pnpm run audit:security          # Security only
pnpm run validate:architecture   # Architecture only
pnpm run lint:all                # Code quality only
humanet validate                 # Documentation only
```

### Automated Fixes

```bash
pnpm run fix:all                 # Auto-fix linting/formatting
pnpm run update:deps             # Update dependencies safely
```

## Tools & References

- **Dependency Audit**: [pnpm audit docs](https://pnpm.io/cli/audit)
- **Security Patterns**: [OWASP Node.js Security](https://nodejs.org/en/docs/guides/security/)
- **Architecture**: [ADR-003: System Layers](../../.humanet/discussions/003-system-layers.md)
- **Code Standards**: [COPILOT.md](../../COPILOT.md)
- **Quality Baselines**: See [quality metrics reference](./references/quality-metrics.md)

## Related Skills

- [testing-strategy](../testing-strategy/) — Unit and integration test procedures
- [security-hardening](../security-hardening/) — Advanced security patterns

## Common Issues & Solutions

| Issue                  | Root Cause            | Solution                                                           |
| ---------------------- | --------------------- | ------------------------------------------------------------------ |
| `pnpm audit` fails     | Outdated dependencies | Run `pnpm update` to patch versions                                |
| Architecture warnings  | Code outside `/apps/` | Move to module or create new app                                   |
| Type errors            | Missing TypeScript    | Run `pnpm install -D typescript`                                   |
| Humanet validate fails | YAML frontmatter      | Check [Humanet spec](https://www.npmjs.com/package/create-humanet) |
| Secrets detected       | Committed credentials | Use `.env.local` (gitignored)                                      |

---

**Last Updated**: March 31, 2026  
**Project**: CampusOS - Campus Management System  
**Maintained by**: NITRR Open Source
