# Development Strategy

## Status

Accepted

## Approach: Vertical Slicing

Build features vertically: backend + frontend + database together, not layer by layer.

## System Development Workflow

1. **Understand Feature**
   - Read problem statement
   - Check scope for phase
   - Review existing modules

2. **Check Humanet**
   - Read problem_statement.md
   - Read idea.md
   - Read scope.md
   - Check discussions/ for related decisions

3. **Build Module**
   - Create module directory in `/apps/`
   - Implement: routes → controller → service → schema
   - Create plugin.js entry file
   - Write tests

4. **Integrate**
   - Register in plugin loader
   - Test with other modules
   - Ensure no direct dependencies

5. **Update Humanet**
   - Document any new decisions in discussions/
   - Update CHANGELOG.md
   - Update scope.md if scope changed

## Core Development Rules

### Architecture Rules

- **Modularity** — Everything is a module
- **Independence** — No direct module-to-module dependencies
- **Communication** — Via shared services or database
- **Plugin System** — All modules loaded dynamically

### Code Rules

- Backend: Express routers + middleware
- Controllers: Thin, validation logic
- Services: Business logic
- Schemas: Data models and validation

### Package Management

- **Install via CLI only** — Never directly edit package.json
- Use `pnpm install <pkg>` for dependencies
- Use `pnpm install -D <pkg>` for dev dependencies

### Documentation Rules

- Update COPILOT.md for new constraints
- Update .humanet/ for new decisions
- Every architectural decision documented

## Definition of Done

Each feature/module is done when:

✅ All features implemented and tested
✅ Documentation updated
✅ Humanet records updated
✅ Code reviewed and merged
✅ Deployed to staging
✅ User acceptance testing passed

---

## Related ADRs

- ADR-001: Technology Stack Selection
- ADR-002: Multi-Tenant Architecture (DEPRECATED)
- ADR-003: System Layers
- ADR-005: Removing Multi-Tenant Architecture
