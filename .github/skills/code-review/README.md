# Code Review Skill

Comprehensive code review workflow for CampusOS that validates security, architecture, code quality, and documentation in one integrated process.

## Quick Start

### Using the Skill via Copilot

Type `/code-review` in VS Code Copilot chat to access this skill. Copilot will guide you through the review process interactively.

### Running Standalone Scripts

All scripts are executable independently:

```bash
# Comprehensive review (all checks)
bash .github/skills/code-review/scripts/review-all.sh

# Individual checks
bash .github/skills/code-review/scripts/security-check.sh
bash .github/skills/code-review/scripts/architecture-check.sh
bash .github/skills/code-review/scripts/quality-check.sh
bash .github/skills/code-review/scripts/docs-check.sh
```

### Recommended npm Scripts

Add these to your `package.json` for easier access:

```json
{
  "scripts": {
    "review:all": "bash .github/skills/code-review/scripts/review-all.sh",
    "review:security": "bash .github/skills/code-review/scripts/security-check.sh",
    "review:architecture": "bash .github/skills/code-review/scripts/architecture-check.sh",
    "review:quality": "bash .github/skills/code-review/scripts/quality-check.sh",
    "review:docs": "bash .github/skills/code-review/scripts/docs-check.sh",
    "audit:security": "pnpm audit",
    "lint": "eslint . --ext .js,.ts",
    "type:check": "tsc --noEmit",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "test": "jest",
    "test:coverage": "jest --coverage"
  }
}
```

Then use:

```bash
pnpm run review:all
pnpm run review:security
pnpm run review:architecture
pnpm run review:quality
pnpm run review:docs
```

## File Structure

```
.github/skills/code-review/
├── SKILL.md                          # Main skill definition
├── scripts/
│   ├── review-all.sh                # Master orchestrator
│   ├── security-check.sh            # Security audit
│   ├── architecture-check.sh         # Architecture validation
│   ├── quality-check.sh             # Code quality checks
│   └── docs-check.sh                # Documentation validation
└── references/
    ├── architecture-checklist.md    # Manual architecture review
    ├── quality-metrics.md           # Quality baselines
    └── SECURITY.md                  # Security best practices
```

## Review Dimensions

### 1. Security Review

- Dependency vulnerability scanning
- Secrets and credentials detection
- Authentication pattern validation
- Environment variable usage

### 2. Architecture Review

- Module structure compliance
- System layer adherence
- Plugin system validation
- Cross-module dependency analysis

### 3. Code Quality Review

- ESLint configuration and rules
- TypeScript type checking
- Code formatting (Prettier)
- Test coverage and passing tests
- File size and complexity analysis

### 4. Documentation Review

- Humanet YAML validation
- ADR alignment with code
- README command accuracy
- Environment documentation
- Commit message quality

## Exit Codes

- `0` — All checks passed
- `1` — Critical issues found

## Customization

Each script is independent and can be modified for your specific needs:

- Edit `scripts/` files to add/remove checks
- Update `references/` guides with your project standards
- Add new scripts following the existing pattern

## CI/CD Integration

To run reviews in your CI pipeline:

```yaml
# .github/workflows/review.yml
name: Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      - run: pnpm install
      - run: bash .github/skills/code-review/scripts/review-all.sh
```

## Troubleshooting

### Script permissions denied

```bash
chmod +x .github/skills/code-review/scripts/*.sh
```

### ESLint/Prettier not found

```bash
pnpm install --save-dev eslint prettier
```

### TypeScript errors

```bash
pnpm install -D typescript
```

### Humanet validation fails

```bash
pnpm install -g create-humanet
humanet validate
```

## Learn More

- [SKILL.md](./SKILL.md) — Full procedure and decision points
- [Architecture Checklist](./references/architecture-checklist.md) — Detailed architecture validation
- [Quality Metrics](./references/quality-metrics.md) — Code quality standards and baselines

---

**Created**: March 31, 2026  
**Project**: CampusOS  
**Keywords**: code-review, security, architecture, quality, documentation
