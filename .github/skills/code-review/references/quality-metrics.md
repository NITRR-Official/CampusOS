# Code Quality Metrics & Baselines

Expected quality thresholds for CampusOS codebase.

## Test Coverage

| Layer      | Minimum Coverage | Target | Priority |
| ---------- | ---------------- | ------ | -------- |
| Foundation | 90%              | 95%    | Critical |
| Execution  | 85%              | 90%    | High     |
| Operations | 75%              | 85%    | High     |
| Growth     | 70%              | 80%    | Medium   |
| System     | 60%              | 75%    | Medium   |

**How to check:**

```bash
pnpm run test:coverage
```

## Linting Standards

**ESLint Config**: `.eslintrc.json` (project root)

- ❌ Errors: 0 (blocking)
- ⚠️ Warnings: 0 (blocking for release, can merge with documentation)

**Rules enforced:**

- `no-console` - Use logger instead
- `no-var` - Use const/let
- `prefer-const` - Const when not reassigned
- `no-unused-vars` - Clean imports/declares
- `eqeqeq` - Use === not ==

## Type Checking

**TypeScript**: `tsconfig.json` (project root)

Settings:

- ✅ `strict: true` — Full type safety
- ✅ `noImplicitAny` — All values typed
- ✅ `noImplicitThis` — Explicit this typing
- ✅ `strictNullChecks` — Handle null/undefined

**Errors**: 0 (blocking)

## Code Formatting

**Prettier**: `.prettierrc` (project root)

- Line width: 100 characters
- Tab size: 2 spaces
- Semicolons: true
- Single quotes: false
- Trailing commas: es5

**Auto-fix with:**

```bash
pnpm run format
```

## Security Scanning

### Dependency Vulnerabilities

```bash
pnpm audit
```

| Severity | Max Allowed | Action                |
| -------- | ----------- | --------------------- |
| Critical | 0           | Block immediately     |
| High     | 0           | Block before release  |
| Medium   | 5           | Fix in next sprint    |
| Low      | 10          | Document in tech debt |

### Secrets Detection

**Patterns scanned:**

- AWS keys: `AKIA[0-9A-Z]{16}`
- Private keys: `-----BEGIN.*PRIVATE KEY-----`
- API tokens: Bearer token patterns
- Database credentials: Connection strings

**Auto-scan:**

```bash
pnpm run scan:secrets
```

**Found secrets?**

1. Remove from codebase immediately
2. Rotate the credential
3. Use `.env.local` (gitignored) for sensitive data
4. Add pattern to `.gitignore`

## Documentation Quality

| Check               | Standard             | Pass Criteria                                                        |
| ------------------- | -------------------- | -------------------------------------------------------------------- |
| **README**          | Up-to-date commands  | Every command runs without error                                     |
| **Humanet**         | Valid YAML           | `humanet validate` exit code 0                                       |
| **ADRs**            | Decisions documented | Code changes have corresponding ADR                                  |
| **Comments**        | Technical decisions  | Non-obvious logic has comments                                       |
| **Commit messages** | Clear, descriptive   | Follows [Conventional Commits](https://www.conventionalcommits.org/) |

## Performance Baselines

| Metric               | Target           | Tool                  |
| -------------------- | ---------------- | --------------------- |
| **Build time**       | <30s             | `pnpm run build`      |
| **Bundle size**      | <200KB (gzipped) | Build output analysis |
| **API response**     | <500ms P95       | Application metrics   |
| **Database queries** | <100ms median    | Query profiling       |

## Automated Checks

```bash
# Run all checks
pnpm run review:all

# Individual checks
pnpm run lint              # ESLint
pnpm run type:check        # TypeScript
pnpm run format:check      # Prettier
pnpm run test              # Jest
pnpm run test:coverage     # Coverage report
pnpm audit                 # Vulnerability scan
```

## Gradual Improvement Plan

If current state doesn't meet targets:

1. **Month 1**: Fix critical issues (breaking from existing tests)
2. **Month 2**: Increase coverage 10% across layers
3. **Month 3**: Resolve all medium-priority issues
4. **Ongoing**: New code always meets full standards

---

**Last Updated**: March 31, 2026
