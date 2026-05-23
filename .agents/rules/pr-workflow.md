---
trigger: model_decision
description: "Commit and PR workflow rule: Triggered when user asks for commit details or PR titles."
---

# PR Workflow Rule

Whenever the user asks for "commit details", "PR titles", or similar information after a code change, it indicates they are about to push their changes.

Before providing the commit messages or PR details, you MUST automatically run the following code quality checks (as defined in `docs/contributing/CONTRIBUTING.md`) to ensure the codebase is ready to be pushed:

1. `pnpm format` - Auto-fix formatting
2. `pnpm lint` - Linting checks
3. `pnpm type-check` - TypeScript checks
4. `pnpm build` - Build check
5. `pnpm test` - Unit tests

Only provide the commit and PR details after confirming these commands pass successfully. If any command fails, help the user fix the issues first.