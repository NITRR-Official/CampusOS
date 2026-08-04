---
name: code-quality-at-scale
description: "Linting rules, architecture enforcement, code patterns, tech debt tracking for CampusOS. Use when enforcing code conventions, managing tech debt, refactoring, or scaling code patterns."
---

# Code Quality at Scale

## When to Use

- Enforcing ESLint/TypeScript rules across codebase
- Detecting code smell and architectural violations
- Managing technical debt
- Refactoring for consistency

## Procedure

### Phase 1: Code Style Enforcement

CampusOS enforces these patterns project-wide:

**ES Modules only:**
```javascript
// ✅ Always
import express from 'express';
export function createApp() { ... }

// ❌ Never
const express = require('express');
module.exports = createApp;
```

**Variable declarations:**
```javascript
const vendors = await service.getAll();  // ✅ const by default
let retries = 3;                          // ✅ let only when mutated
// var vendors = [];                      // ❌ Never
```

**Async patterns:**
```javascript
const result = await service.create(data);  // ✅ Always async/await
// service.create(data).then(...)           // ❌ Never .then() chains
```

### Phase 2: Architecture Rules

- All features in `/plugins/<module>/` — backend core handles only middleware and registry
- No direct imports between modules — use `registry.getService()`
- Controllers thin, services contain business logic
- Tests co-located: `service.test.js` next to `service.js`

### Phase 3: Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case.js` | `vendor.service.js` |
| Variables | `camelCase` | `vendorService` |
| Classes | `PascalCase` | `VendorService` |
| Functions | `camelCase` | `createVendor` |
| Constants | `UPPER_SNAKE_CASE` | `PUBLIC_ROUTES` |
| React components | `PascalCase` | `ThemeToggle` |
| API routes | `/api/v1/kebab-case` | `/api/v1/vendors` |

### Phase 4: Testing Coverage

- Minimum: > 80% line coverage
- Test framework: **Vitest** (not Jest)
- Run per module: `pnpm -C plugins/<module> test -- --coverage`

### Phase 5: Technical Debt Tracking

- Tag debt in code: `// TODO: #123 - description`
- Create GitHub issues for major items with `tech-debt` label
- Reserve 10% of sprint for debt reduction
- Extract utilities when code repeated 3x

## Quick Reference

```bash
pnpm lint              # Lint all files
pnpm lint --fix        # Auto-fix
pnpm -C plugins/vendor test -- --coverage  # Coverage
```
