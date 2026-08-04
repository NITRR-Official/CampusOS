---
name: release-management
description: "Semantic versioning, changelog generation, release tags, version bumping for CampusOS. Use when preparing releases, bumping versions, creating release branches, or generating changelogs."
---

# Release Management

## When to Use

- Preparing production releases
- Bumping semantic versions
- Generating changelogs
- Creating GitHub releases

## Procedure

### Phase 1: Semantic Versioning

Format: `MAJOR.MINOR.PATCH`
- MAJOR: Breaking API changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes only

```bash
pnpm version patch   # 2.1.3 → 2.1.4
pnpm version minor   # 2.1.3 → 2.2.0
pnpm version major   # 2.1.3 → 3.0.0
```

### Phase 2: Release Process

1. Create release branch: `git checkout -b release/v2.1.0`
2. Bump version: `pnpm version minor`
3. Run full test suite:
   ```bash
   pnpm -C plugins/vendor test -- --run
   pnpm -C plugins/resource test -- --run
   pnpm -C plugins/scheduling test -- --run
   pnpm -C plugins/budget test -- --run
   ```
4. Build: `pnpm build`
5. Generate changelog from conventional commits
6. Create PR to `main`

### Phase 3: GitHub Release

```bash
git tag -a v2.1.0 -m "Release v2.1.0"
git push origin v2.1.0
gh release create v2.1.0 --title "v2.1.0" --notes-file CHANGELOG.md
```

### Phase 4: Post-Release

1. Merge `main` back to `develop`
2. Bump to next pre-release: `pnpm version prepatch`
3. Push tags: `git push origin main --tags`
4. Monitor error tracking for regressions

## Quick Reference

```bash
pnpm version minor                # Bump version
git tag -a v2.1.0 -m "Release"   # Tag
gh release create v2.1.0          # GitHub release
git tag --list                     # List all tags
```

## Common Issues

| Issue | Solution |
|-------|----------|
| Version already tagged | `git tag -d v2.1.0 && git push -d origin v2.1.0` |
| Changelog missing commits | Verify commits follow `feat:`, `fix:` format |
| Version mismatch | Re-sync tag with package.json version |
