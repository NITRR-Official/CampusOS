# Core Principles and Philosophy

## Status

Foundational (applies to entire project)

## The 5 Core Principles

### 1. Everything is Modular

- Every feature is a module
- Modules live in `/apps/`
- Modules are self-contained and independent
- No module directly depends on another module

**Why**? Modularity allows scaling, testing, and replacement without affecting the entire system.

---

### 2. Build Vertically (Backend + Frontend Together)

- Don't build all backend first, then all frontend
- Build one feature top-to-bottom: DB → Backend → Frontend
- Reduces waste and speeds feedback loops
- Ensures compatibility early

**Why**? Catches integration issues early and matches business value delivery.

---

### 3. Humanet-Driven Development (Idea Clarity First)

- Before coding ANY feature, read .humanet/ folder
- Understand the problem (problem_statement.md)
- Understand the solution (idea.md)
- Understand the boundaries (scope.md)
- Document decisions in discussions/

**Why**? Prevents over-engineering and keeps focus on what matters.

---

### 4. Copilot-Assisted Engineering (Context-Aware Coding)

- Use AI with full project context
- All architectural rules in COPILOT.md
- All decisions documented in .humanet/
- AI can enforce patterns and consistency

**Why**? Speeds development, ensures consistency, knowledge capture.

---

### 5. Usability > Perfection

- Simple UI beats complex but perfect UI
- MVP over feature-complete
- Real user feedback beats theoretical design
- Done and shipped beats perfect and delayed

**Why**? Speed to market and user feedback matter more than perfection.

---

## Non-Negotiable Rules

These rules MUST be followed:

1. ✅ **Do NOT break modular architecture**
   - Every feature must be a standalone module
   - No module-to-module imports

2. ✅ **Do NOT over-engineer**
   - Build what's needed for current phase
   - Don't build for "future flexibility"

3. ✅ **Do NOT skip phases**
   - Phases are sequenced for dependencies
   - Can't do Phase 3 without Phase 1 and 2

4. ✅ **Do NOT skip Humanet updates**
   - Every feature decision documented
   - Every architectural change recorded

5. ✅ **Do NOT skip COPILOT rules**
   - Rules exist for consistency
   - Violations must be justified and documented

---

## Decision-Making Framework

When stuck, ask:

1. Does it align with our **5 core principles**?
2. Does it violate any **non-negotiable rules**?
3. Is it documented in **.humanet/**?
4. Does it follow **COPILOT.md** rules?
5. Can it be built as a **standalone module**?

If yes to all → Proceed
If no to any → Discuss and document the trade-off

---

## Reference

- COPILOT.md — Detailed coding rules
- ROADMAP.md — Phase timeline
- .humanet/discussions/ — Architectural decisions
