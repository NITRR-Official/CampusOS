---
name: release-management
description: 'Semantic versioning, changelog generation, release tags, version bumping. Use when: preparing releases, bumping versions, managing release branches, automating version updates.'
argument-hint: 'version-type, release-branch'
---

# Release Management

## When to Use

- Preparing production releases
- Bumping semantic versions
- Creating release branches
- Generating changelogs
- Creating GitHub releases with release notes
- Tagging versions in git

## What This Skill Does

Implements semantic versioning (SemVer) for CampusOS releases, automating version bumping, changelog generation, and GitHub release creation.

## Procedure

### Phase 1: Semantic Versioning Setup

1. Define version format: `MAJOR.MINOR.PATCH` (e.g., 2.1.3)
2. Store version in `package.json`: `"version": "2.1.3"`
3. Increment rules:
   - MAJOR: Breaking API changes
   - MINOR: New features (backwards compatible)
   - PATCH: Bug fixes
4. Start at `0.1.0` until 1.0.0 (stable API)
5. Tag releases: `git tag v2.1.3`
6. Push tags: `git push origin v2.1.3`

### Phase 2: Version Bumping

1. Use `pnpm version` to bump automatically:
   - `pnpm version patch` → 2.1.3 → 2.1.4
   - `pnpm version minor` → 2.1.3 → 2.2.0
   - `pnpm version major` → 2.1.3 → 3.0.0
2. Command creates git commit + tag
3. Verify `package.json` and `package-lock.yaml` updated
4. Run tests before bumping: `pnpm test`
5. Update migration guides if MAJOR version
6. Verify version command: `node -e "console.log(require('./package.json').version)"`

### Phase 3: Changelog Generation

1. Install `commitizen` and `standard-changelog`:
   - `pnpm add --save-dev commitizen standard-changelog`
2. Configure commit convention in `package.json`:
   ```json
   "commitizen": {"path": "cz-conventional-changelog"}
   ```
3. Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
4. Generate changelog: `pnpm exec standard-changelog`
5. Review generated `CHANGELOG.md`
6. Manually add context/migration notes

### Phase 4: Release Branch & Staging

1. Create release branch: `git checkout -b release/v2.1.0`
2. Bump version on release branch only
3. Update changelog/release notes
4. Run full test suite: `pnpm test && pnpm test:integration`
5. Build artifacts: `pnpm build && pnpm build:web`
6. Create PR to main branch for review

### Phase 5: GitHub Release Creation

1. Merge release PR to main
2. Tag commit: `git tag -a v2.1.0 -m "Release v2.1.0"`
3. Create GitHub release:
   - `gh release create v2.1.0 --title "v2.1.0" --notes-file RELEASE_NOTES.md`
4. Include changelog section in release body
5. Attach build artifacts (if applicable)
6. Mark as prerelease if beta: `--prerelease`

### Phase 6: Post-Release

1. Merge main back to develop
2. Bump develop version to next patch: `pnpm version prepatch`
3. Push changes: `git push origin main develop --tags`
4. Verify npm/package registry updated (if published)
5. Announce release in `#announcements` channel
6. Monitor error tracking for regression issues

## Quick Reference

```bash
# Bump version interactively
pnpm version

# Bump to specific version
pnpm version 2.1.0

# Generate changelog
pnpm exec standard-changelog

# View upcoming changes (not yet tagged)
git log --oneline main...HEAD

# Create GitHub release
gh release create v2.1.0 \
  --title "Version 2.1.0" \
  --notes-file CHANGELOG.md

# List all tags
git tag --list

# Delete local/remote tag
git tag -d v2.0.0
git push origin --delete v2.0.0
```

## Troubleshooting

| Issue                                             | Solution                                                                        |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| Version already tagged                            | Delete tag: `git tag -d v2.1.0 && git push -d origin v2.1.0`                    |
| Changelog generator missing commits               | Verify commits follow conventional format: `feat:`, `fix:`                      |
| pnpm version didn't create tag                    | Run `git config core.hookspath .githooks` to enable hooks                       |
| Release on wrong branch                           | Undo: `git reset --hard HEAD~1; git push -f` (only if not published)            |
| Version mismatch between package.json and git tag | Re-sync: `git tag v$(node -e "console.log(require('./package.json').version)")` |
| Cannot push tags                                  | Verify git permissions: `git push --dry-run origin main --tags`                 |
