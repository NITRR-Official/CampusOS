---
name: code-quality-at-scale
description: 'Linting rules, architecture enforcement, code patterns, tech debt tracking. Use when: enforcing code conventions, managing tech debt, refactoring, scaling code patterns.'
argument-hint: 'pattern-type, architecture-rule'
---

# Code Quality at Scale

## When to Use

- Enforcing ESLint/TypeScript rules across codebase
- Detecting code smell and architectural violations
- Managing technical debt
- Refactoring for consistency
- Onboarding new team members to code standards
- Preventing regressions in code quality

## What This Skill Does

Establishes code quality standards for CampusOS through linting, architecture rules, and automated enforcement.

## Procedure

### Phase 1: ESLint Configuration

1. Install ESLint & plugins: `pnpm add --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-import`
2. Create `.eslintrc.json`:
   ```json
   {
     "env": { "node": true, "browser": true, "es2021": true },
     "extends": ["eslint:recommended", "plugin:react/recommended"],
     "rules": {
       "no-console": ["warn", { "allow": ["warn", "error"] }],
       "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
       "prefer-const": "error",
       "eqeqeq": ["error", "always"],
       "quotes": ["error", "single"]
     }
   }
   ```
3. Key rules:
   - Disallow `console.log` (use logger instead)
   - Require variable declaration (`const` > `let` > `var`)
   - Strict equality (`===` not `==`)
   - No unused variables
   - Consistent quotes (single)
4. Override per file/directory:
   ```json
   {
     "overrides": [
       { "files": ["**/*.test.ts"], "rules": { "no-console": "off" } }
     ]
   }
   ```
5. Run: `pnpm lint`
6. Auto-fix: `pnpm lint --fix`

### Phase 2: TypeScript Strict Mode

1. Enable strict TypeScript in `tsconfig.json`:
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true,
       "strictFunctionTypes": true,
       "strictBindCallApply": true,
       "strictPropertyInitialization": true,
       "noImplicitThis": true,
       "alwaysStrict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noImplicitReturns": true,
       "noFallthroughCasesInSwitch": true
     }
   }
   ```
2. Benefits: Catch type errors at compile time
3. Run type check: `pnpm typecheck`
4. Integrate in CI: Fail build if type errors
5. Add optional type annotations (not required, inferred)
6. Set `skipLibCheck: false` in dev, true in production

### Phase 3: Architecture & Dependency Rules

1. Use `eslint-plugin-import` for import rules:
   ```json
   {
     "rules": {
       "import/no-cycle": "error",
       "import/no-relative-packages": "error",
       "import/order": [
         "error",
         {
           "groups": ["builtin", "external", "parent", "sibling", "index"],
           "alphabeticalOrder": true
         }
       ]
     }
   }
   ```
2. Enforce project structure:
   - Components in `src/components/**`
   - Utils in `src/utils/**`
   - No cross-directory imports between features
3. Restrict imports:
   - Frontend: No backend service imports
   - Utils: No component imports
   - Directives enforcable via linting
4. Detect circular dependencies: `madge src/`
5. Document why rules exist in comments
6. Monthly review: Are rules catching bugs? Adjust if needed.

### Phase 4: Testing & Coverage Requirements

1. Enforce test co-location:
   - File: `src/utils/parser.ts`
   - Test: `src/utils/parser.test.ts`
   - Rule: `"jest/require-to-throw-message": "error"`
2. Minimum coverage requirements:
   - Lines: 80%
   - Branches: 80%
   - Functions: 80%
   - Statements: 80%
3. Track coverage over time:
   ```bash
   pnpm test --coverage --coverageReporters=html
   ```
4. Fail CI if coverage drops:
   ```bash
   if [ $(coverage) -lt 80 ]; then exit 1; fi
   ```
5. Exempt certain files (migrations, seeds)
6. Review coverage trends monthly

### Phase 5: Git Hooks & Pre-commit Checks

1. Install `husky`: `pnpm add --save-dev husky`
2. Setup hooks: `npx husky install`
3. Create pre-commit hook (`.husky/pre-commit`):
   ```bash
   #!/bin/sh
   pnpm lint-staged
   ```
4. Configure `lint-staged` in `package.json`:
   ```json
   {
     "lint-staged": {
       "*.ts": ["eslint --fix", "prettier --write"],
       "*.{json,yml}": ["prettier --write"]
     }
   }
   ```
5. Pre-push hook to run tests
6. Enforce no secrets: `pnpm exec git-secrets --install`

### Phase 6: Technical Debt Tracking

1. Tag tech debt in code comments:
   ```typescript
   // TODO: https://github.com/...#123 - Refactor after API v2 released
   // DEBT: O(n²) loop, optimize after metrics show impact
   ```
2. Create GitHub issues for major debt items
3. Track in tech-debt label: `label: tech-debt, priority: p2`
4. Sprint allocation: Reserve 10% of sprint for debt reduction
5. Refactoring patterns:
   - Extract utilities: When code repeated 3x
   - Extract components: When component >300 lines
   - Extract services: When business logic mixed with UI
6. Retire old code: Legacy endpoints after 3-month deprecation period

## Quick Reference

```bash
# Lint all files
pnpm lint

# Auto-fix lint errors
pnpm lint --fix

# Type checking
pnpm typecheck

# Check test coverage
pnpm test --coverage

# Check for circular deps
npx madge --extensions ts src/

# Find code duplicates
npx jscpd src/

# Setup pre-commit hooks
npx husky install && npx husky add .husky/pre-commit "pnpm lint-staged"
```

## Troubleshooting

| Issue                              | Solution                                                                                  |
| ---------------------------------- | ----------------------------------------------------------------------------------------- |
| ESLint too strict, many violations | Gradually enable rules; use `eslint --ignore-pattern`; migrate existing code over sprints |
| Type errors from legacy code       | Use `@ts-ignore` (with reason) temporarily; incrementally add types                       |
| Pre-commit slow on large files     | Optimize `lint-staged` to only check changed portions                                     |
| Coverage gap in new features       | Add unit + integration tests; ensure >80% before merge                                    |
| Circular dependency detected       | Use `madge --graph deps.svg` to visualize; refactor imports                               |
| Too many TODO comments             | Review and close; convert stale todos to issues                                           |
