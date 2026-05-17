---
name: release-notes-generation
description: 'Automated changelog, version summaries, release announcements, feature highlights. Use when: creating release announcements, automating release notes, publishing updates.'
argument-hint: 'release-version, highlights'
---

# Release Notes Generation

## When to Use

- Automating release notes from commits
- Creating user-friendly release summaries
- Publishing announcements to multiple channels
- Highlighting breaking changes and migrations
- Coordinating release communications

## What This Skill Does

Automates release notes generation for CampusOS releases with user-friendly summaries and multi-channel announcements.

## Procedure

### Phase 1: Conventional Commits Enforcement

1. Use commit message format: `type(scope): description`
2. Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`
3. Scope: Area of codebase (api, ui, db, etc.)
4. Examples:
   ```
   feat(api): add activity duplicate endpoint
   fix(ui): resolve form submission race condition
   docs: update API documentation
   perf(db): add index on user_id column
   BREAKING CHANGE: /activities/*/comments endpoint deprecated, use /courses/*/discussions
   ```
5. Enforce with commitizen: `pnpm exec git-cz` (interactive commit)
6. CI should reject non-compliant commits

### Phase 2: Automatic Changelog Generation

1. Install changelog generator: `pnpm add --save-dev standard-changelog`
2. Configure in `package.json`:
   ```json
   {
     "standard-changelog": { "sign": false }
   }
   ```
3. Generate changelog: `pnpm exec standard-changelog`
4. Output adds to `CHANGELOG.md`:

   ```markdown
   ## [v2.1.0] - 2024-03-15

   ### Features

   - **api**: Add activity duplicate endpoint (#548)
   - **ui**: Improve form validation messages (#551)

   ### Bug Fixes

   - **db**: Fix missing index on user_id (#545)

   ### Breaking Changes

   - `/activities/*/comments` endpoint removed, use `/courses/*/discussions`

   ### Contributors

   - [@alice](github.com/alice) (3 commits)
   - [@bob](github.com/bob) (1 commit)
   ```

5. Commit changelog: `git add CHANGELOG.md && git commit -m "chore: update changelog"`
6. Include changelog in GitHub release

### Phase 3: Release Notes Formatting

1. Create structured release notes for non-technical audience:

   ````markdown
   # CampusOS v2.1.0 - March 15, 2024

   ## What's New

   - **Activity Duplication**: Quickly duplicate existing activities for faster course setup
   - **Better Form Validation**: Clear error messages guide users through form corrections

   ## Improvements

   - API performance improved by 30% with optimized database queries
   - Reduced submission lag on high-traffic courses

   ## Fixed Issues

   - Resolved issue where grades weren't updating in real-time (#545)
   - Fixed form submission race condition that lost data (#551)

   ## Migration Guide

   If you're using the `/activities/*/comments` endpoint, update to:

   ```http
   GET /courses/:courseId/discussions
   ```
   ````

   ```

   ```

2. Highlight:
   - New features (user-facing)
   - Performance improvements (with metrics)
   - Fixed bugs
   - Migration steps (breaking changes)
3. Include links to detailed docs
4. Keep language simple, non-technical

### Phase 4: Multi-Channel Announcements

1. Create announcements for:
   - **GitHub**: Release tag + release notes
   - **Twitter/X**: 280-char summary with link
   - **Slack**: #announcements channel with release link
   - **Email**: Newsletter to users
   - **Blog**: Detailed post with screenshots
2. Announcement template:

   ```
   🎉 CampusOS v2.1.0 is here!

   Highlights:
   • Activity Duplication feature
   • 30% API performance boost
   • Bug fixes for form submissions

   Migrate from /activities/*/comments to /courses/*/discussions

   [Full Release Notes](github.com/.../releases/v2.1.0)
   ```

3. Schedule posts across channels (same day, coordinated)
4. Include links to documentation and migration guides
5. Track engagement: Retweets, reactions, feedback
6. Gather bugs from community feedback (reply monitoring)

### Phase 5: Release Notification Automation

1. Trigger on GitHub release creation:
   ```yaml
   on:
     release:
       types: [published]
   ```
2. GitHub Actions workflow:
   ```yaml
   - name: Post to Twitter
     run: node scripts/post-twitter.js
   - name: Post to Slack
     run: node scripts/post-slack.js
   ```
3. Secrets for API credentials: `TWITTER_API_KEY`, `SLACK_TOKEN`
4. Template variables:
   ```
   {version} = 2.1.0
   {date} = March 15, 2024
   {changelog_link} = https://github.com/.../releases/v2.1.0
   ```
5. Dry-run announcements before production release
6. Monitor replies for critical feedback

### Phase 6: Post-Release Monitoring

1. Track adoption:
   - Download counts (if npm published)
   - Error rates in new version
   - Bug reports mentioning new version
2. Create issue for version if critical bugs emerge
3. Plan hotfix if needed
4. Update blog post with community feedback
5. Thank contributors in follow-up post
6. Plan next release based on feedback

## Quick Reference

```bash
# Write conventional commit
git cz # Interactive prompt

# Generate changelog
pnpm exec standard-changelog

# Preview release notes before publishing
cat CHANGELOG.md | head -50

# Create GitHub release (after tagging)
gh release create v2.1.0 \
  --title "CampusOS v2.1.0" \
  --notes-file CHANGELOG.md

# Post to Slack
node scripts/post-slack.js --version 2.1.0

# Preview Twitter post
node scripts/preview-twitter.js --version 2.1.0
```

## Troubleshooting

| Issue                                       | Solution                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Changelog missing commits                   | Check commits follow `feat:`, `fix:` format; regenerate from git log                 |
| Release notes too long                      | Summarize features; move detailed docs to blog post; link for full details           |
| Announcement not posted                     | Check API credentials (`TWITTER_API_KEY` set); verify CI logs for errors             |
| Version mismatch between tools              | Sync: `pnpm version 2.1.0 && git tag v2.1.0 && gh release create v2.1.0`             |
| Community reports missing features in notes | Add feedback process: #release-feedback channel; update notes if valid               |
| Release published before notes ready        | Use `--draft` flag; publish once notes ready: `gh release edit v2.1.0 --draft=false` |
