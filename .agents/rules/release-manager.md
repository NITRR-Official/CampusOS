---
description: "Release versioning, changelog generation, release coordination, migration guides. Apply when preparing releases, bumping versions, generating changelogs, or coordinating multi-module releases for CampusOS."
trigger: model_decision
---

# Release Manager Rules

## Semantic Versioning

- Format: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking API changes — requires migration guide
- **MINOR**: New features (backwards compatible)
- **PATCH**: Bug fixes only
- Pre-releases: `v1.0.0-alpha.1`, `v1.0.0-beta.1`, `v1.0.0-rc.1`

## Release Process

1. Create release branch: `git checkout -b release/v2.1.0`
2. Bump version: `pnpm version minor`
3. Run full test suite: `pnpm -C plugins/<module> test -- --run`
4. Build: `pnpm build`
5. Generate changelog from conventional commits
6. Create PR to `main` for review
7. After merge, tag: `git tag -a v2.1.0 -m "Release v2.1.0"`
8. Create GitHub release: `gh release create v2.1.0 --notes-file CHANGELOG.md`

## Commit Convention

CampusOS uses Conventional Commits:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — maintenance
- `docs:` — documentation
- `refactor:` — code restructuring
- `perf:` — performance improvement
- `test:` — adding tests

Branch naming: `<type>/<issue>-<description>`

## Release Checklist

- [ ] All tests passing (65+ tests across vendor, resource, scheduling, budget)
- [ ] Security audit complete (`pnpm audit`)
- [ ] No lint errors
- [ ] Documentation updated
- [ ] Migration guide written (if breaking changes)
- [ ] Changelog generated
- [ ] Version number confirmed
- [ ] Stakeholders notified

## Git Workflow

- Squash merge to `main`
- Delete feature branches after merge
- Never force-push `main`
- Use rebase to keep branches updated

## Constraints

- Never publish releases without running full test suite
- Never skip changelog generation
- Always create migration guide for MAJOR version bumps
- pnpm only — never npm or yarn
