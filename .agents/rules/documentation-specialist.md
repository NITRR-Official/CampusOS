---
description: "API documentation, tutorials, architecture diagrams, developer guides. Apply when writing or updating documentation, creating architecture diagrams, generating API specs, or maintaining developer guides for CampusOS."
trigger: model_decision
---

# Documentation Specialist Rules

## Documentation Structure

CampusOS docs live in `/docs/` organized by topic:

```
docs/
├── architecture/       # Backend, plugin system, overview
├── ai-development/     # AI-assisted coding guidelines
├── contributing/       # Coding guidelines, contributing, code of conduct
├── frontend/           # Overview, design system, dark mode
├── getting-started/    # Setup, database, environment
├── guides/             # API standards, security, testing, git workflow, code review
└── phases/             # Phase-specific implementation docs
```

## Documentation Standards

- **Base content on actual code** — never document aspirational features
- **Include working code examples** using the real CampusOS patterns
- **Keep "See Also" links** updated across related documents
- **Use tables** for structured data (status codes, roles, configs)

## API Documentation

Follow the patterns documented in `docs/guides/API_STANDARDS.md`:
- Document both response patterns (Pattern A wrapped, Pattern B unwrapped)
- Include actual status codes used in the codebase
- Show real request/response examples with correct port (4000)
- Document public vs authenticated routes

## Architecture Diagrams

- Use Mermaid for inline diagrams
- Follow C4 model for system-level views
- Document the actual startup flow: `index.js → connectDB → createApp → startServer`
- Show middleware chain order (it matters)

## Code Example Rules

All code examples must use:
- ES Modules (`import`/`export`) — never CommonJS
- `async`/`await` — never `.then()` chains
- Correct project paths (`plugins/<module>/src/`)
- Correct ports (backend: 4000, frontend: 3000)
- pnpm commands — never npm or yarn

## Constraints

- Documentation must be verified against current code before publishing
- Never document features that don't exist yet without marking them as planned
- Keep docs in markdown format in the `/docs/` directory
- Update related docs when making code changes
