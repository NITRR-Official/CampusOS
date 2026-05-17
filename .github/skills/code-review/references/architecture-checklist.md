# Architecture Consistency Checklist

Use this checklist when reviewing code for adherence to CampusOS architecture patterns defined in ADR-003.

## System Layers Validation

- [ ] **Foundation Layer**
  - [ ] Core utilities in `/apps/foundation/src/utils/`
  - [ ] No business logic in foundation
  - [ ] Reusable across all layers

- [ ] **Event Layer**
  - [ ] Event definitions in `/apps/events/src/`
  - [ ] Event emitters properly typed
  - [ ] No event flow to Foundation

- [ ] **Execution Layer**
  - [ ] Core services in `/apps/execution/src/`
  - [ ] Service methods are pure functions
  - [ ] No direct database queries (use repos)

- [ ] **Operations Layer**
  - [ ] API routes in `/apps/operations/src/routes/`
  - [ ] Controllers handle HTTP concerns only
  - [ ] Business logic delegated to Execution

- [ ] **Growth Layer**
  - [ ] Analytics in `/apps/growth/src/`
  - [ ] No mutation of parent layer data
  - [ ] Aggregation queries only

- [ ] **System Layer**
  - [ ] Admin operations in `/apps/system/src/`
  - [ ] Infrastructure concerns only
  - [ ] No feature-specific logic

## Module Structure

- [ ] All code within `/apps/<module-name>/` structure
- [ ] No modules in `/backend/` or `/frontend/` root
- [ ] `package.json` exists in each module
- [ ] Module name matches folder name (kebab-case)
- [ ] Each module has `src/index.js` entry point

## Plugin System Compliance

- [ ] Plugin loader called in `/backend/src/plugin-loader.js`
- [ ] All modules exported as objects with `init()` method
- [ ] Plugin registration documented in `ROADMAP.md`
- [ ] No hardcoded module imports (use plugin registry)
- [ ] Module dependencies resolved at runtime

## Data Flow Validation

- [ ] No direct module-to-module imports
  - ❌ `import { userService } from '../auth/src'`
  - ✅ Communicate via database or shared services
- [ ] Database schema consistent with modules
- [ ] Foreign keys properly defined
- [ ] No circular dependencies via database

## Documentation Alignment

- [ ] Code structure matches [PROJECT_STRUCTURE.md](../../../.humanet/PROJECT_STRUCTURE.md)
- [ ] New modules documented in `ROADMAP.md`
- [ ] Architecture decisions updated in `discussions/` if changed
- [ ] Module README updated if significant changes

## Common Violations

| Violation                      | Impact                    | Fix                                |
| ------------------------------ | ------------------------- | ---------------------------------- |
| Code outside `/apps/`          | Plugin loader breaks      | Move to module or create new app   |
| Direct imports between modules | Runtime coupling          | Use event/database communication   |
| Missing `index.js` exports     | Plugin registration fails | Create entry point with init()     |
| Circular dependencies          | Bundle size, performance  | Refactor shared code to Foundation |
| Business logic in routes       | Hard to test              | Move to Execution services         |

## Review Checklist Questions

Ask yourself:

1. **Can this code live in `/apps/`?** If no, it shouldn't exist in this repo
2. **Does another module depend on this?** If yes, is it via database/events only?
3. **Could this be a plugin?** If yes, should it be in `plugin-loader.js`?
4. **Is this tested?** If no, add tests before review
5. **Does this align with an ADR?** If unclear, check discussions or create ADR

---

**Reference**: See [ADR-003: System Layers](../../../.humanet/discussions/003-system-layers.md) and [ADR-004: Development Strategy](../../../.humanet/discussions/004-development-strategy.md)
