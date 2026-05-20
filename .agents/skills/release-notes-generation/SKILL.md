---
name: release-notes-generation
description: "Automated changelog, version summaries, release announcements for CampusOS. Use when creating release announcements, automating release notes, or publishing updates."
---

# Release Notes Generation

## When to Use

- Automating release notes from commits
- Creating user-friendly release summaries
- Publishing announcements
- Highlighting breaking changes

## Procedure

### Phase 1: Conventional Commits

CampusOS uses Conventional Commits: `type(scope): description`
- `feat(api): add vendor assignment endpoint`
- `fix(auth): handle expired token gracefully`
- `BREAKING CHANGE: /old-endpoint deprecated, use /new-endpoint`

### Phase 2: Changelog Generation

```bash
pnpm add -D standard-changelog
pnpm exec standard-changelog
```

Output adds to `CHANGELOG.md`:
```markdown
## [v2.1.0] - 2026-03-15

### Features
- **api**: Add vendor assignment endpoint (#548)
- **ui**: Improve form validation messages (#551)

### Bug Fixes
- **db**: Fix missing index on category (#545)

### Breaking Changes
- `/activities/*/comments` endpoint removed, use `/courses/*/discussions`
```

### Phase 3: Release Notes for Users

Create user-friendly summary:
```markdown
# CampusOS v2.1.0

## What's New
- **Vendor Assignment**: Assign vendors directly to events
- **Better Forms**: Clearer validation error messages

## Fixed Issues
- Fixed slow loading on vendor list page (#545)

## Migration Guide
If you're using `/activities/*/comments`, update to:
GET /courses/:courseId/discussions
```

### Phase 4: Publishing

```bash
# Create GitHub release
gh release create v2.1.0 \
  --title "CampusOS v2.1.0" \
  --notes-file CHANGELOG.md
```

## Quick Reference

```bash
git cz                     # Interactive commit
pnpm exec standard-changelog  # Generate changelog
gh release create v2.1.0      # Publish release
```
