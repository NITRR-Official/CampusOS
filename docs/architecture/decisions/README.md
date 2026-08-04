# Architecture Decision Records (ADRs)

This directory contains the key architectural decisions made for CampusOS. Each ADR documents the context, decision, rationale, and consequences of a significant technical choice.

## Index

| ADR                                                                   | Title                                           | Status        | Date       |
| --------------------------------------------------------------------- | ----------------------------------------------- | ------------- | ---------- |
| [ADR-000](./ADR-000-CORE_PRINCIPLES.md)                               | Core Principles                                 | ✅ Accepted   | 2026-03-15 |
| [ADR-001](./ADR-001-TECH_STACK.md)                                    | Tech Stack Selection                            | ✅ Accepted   | 2026-03-15 |
| [ADR-002](./ADR-002-MULTI_TENANT.md)                                  | Multi-Tenant Architecture                       | ⚠️ Deprecated | 2026-03-15 |
| [ADR-003](./ADR-003-SYSTEM_LAYERS.md)                                 | System Layers                                   | ✅ Accepted   | 2026-03-15 |
| [ADR-004](./ADR-004-DEV_STRATEGY.md)                                  | Development Strategy                            | ✅ Accepted   | 2026-03-15 |
| [ADR-005](./ADR-005-REMOVE_MULTI_TENANT.md)                           | Remove Multi-Tenant                             | ✅ Accepted   | 2026-04-01 |
| [ADR-006](./ADR-006-PLUGIN_MANAGER_RESTART.md)                        | Plugin Manager Restart                          | ✅ Accepted   | 2026-06-03 |
| [ADR-007](./ADR-007-FRONTEND_PLUGIN_ARCHITECTURE.md)                  | Frontend Plugin Architecture                    | ✅ Accepted   | 2026-06-03 |
| [ADR-008](./ADR-008-CORE_EVENT_BUS.md)                                | Core Event Bus                                  | ✅ Accepted   | 2026-06-05 |
| [ADR-009](./ADR-009-FRONTEND_DECOUPLING_STANDARDIZATION.md)           | Standardize Frontend Decoupling within Plugins  | ✅ Accepted   | 2026-07-11 |
| [ADR-010](./ADR-010-CENTRALIZED_ZOD_VALIDATION_AND_ERROR_HANDLING.md) | Centralized Zod Validation and Error Handling   | ✅ Accepted   | 2026-07-11 |
| [ADR-011](./ADR-011-TESTING_STRATEGY.md)                              | Comprehensive Automated Testing Strategy        | ✅ Accepted   | 2026-07-11 |
| [ADR-012](./ADR-012-DYNAMIC_ATOMIC_RBAC.md)                           | Dynamic Atomic Role-Based Access Control        | ✅ Accepted   | 2026-08-04 |
| [ADR-013](./ADR-013-FACTORY_PATTERN_SERVICES.md)                      | Factory Pattern Services & Dependency Inversion | ✅ Accepted   | 2026-08-04 |

## What is an ADR?

An Architecture Decision Record documents a significant architectural decision:

- **Context**: What led to the decision
- **Decision**: What was decided
- **Rationale**: Why this option was chosen
- **Consequences**: The trade-offs involved

## When to Create a New ADR

Create a new ADR when:

- Introducing a new technology or framework
- Changing the system architecture
- Making a cross-cutting decision that affects multiple modules
- Deprecating a previous decision

## ADR Template

See [ADR Template](./ADR-000-CORE_PRINCIPLES.md) for the format.

---

**See Also**: [Architecture Overview](../OVERVIEW.md) · [Project Roadmap](../../project/ROADMAP.md)
