---
name: code-review
description: "Comprehensive code review for architecture, security, quality, and documentation in CampusOS. Use when submitting PRs, preparing releases, onboarding team members, or conducting periodic audits."
---

# Code Review

## When to Use

- Before submitting pull requests
- Release preparation
- Periodic codebase audits
- Dependency updates

## Procedure

### Phase 1: Architecture Review

- ✅ All code in `/plugins/<module>/` — nothing in backend core except middleware/registry
- ✅ No direct module-to-module imports — only via registry or shared DB
- ✅ Plugin entry exports `init(app, registry)`
- ✅ Controllers thin — business logic in services
- ✅ ES Modules only — no `require()` or `module.exports`

### Phase 2: Security Review

- ✅ No hardcoded secrets, API keys, or passwords
- ✅ Protected endpoints have `requireRoles()` guards
- ✅ Controller extracts specific fields (not `...req.body`)
- ✅ Error responses don't expose internal details in production
- ✅ Dependencies audited: `pnpm audit`

### Phase 3: Code Quality Review

- ✅ Follows naming conventions (kebab-case files, camelCase variables)
- ✅ `const` by default, `let` only when needed, never `var`
- ✅ `async/await` — never `.then()` chains
- ✅ Service returns `{ success, data }` or `{ success, error }`
- ✅ Tests exist for new service methods

### Phase 4: Documentation Review

- ✅ API changes documented
- ✅ New env vars documented
- ✅ README commands work when copy-pasted
- ✅ Code comments explain "why" not "what"

## Decision Points

| Finding | Action |
|---------|--------|
| ✅ All passing | Approve & merge |
| ⚠️ Minor issues | Comment, proceed |
| 🔴 Security/architecture violation | Block until fixed |
| 🔴 Test failures | Block until fixed |

## Quick Reference

```bash
pnpm lint                          # Code quality
pnpm -C plugins/vendor test -- --run  # Tests
pnpm audit                         # Security
pnpm build                         # Build verification
```
