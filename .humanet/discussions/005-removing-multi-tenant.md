# ADR 005: Removing Multi-Tenant Architecture

## Status

Accepted

## Context

Initially, CampusOS was designed as a multi-tenant platform with:

- Single backend instance serving multiple institutes
- Each institute as a separate tenant
- Data isolation via `instituteId` in every entity

Upon further analysis, multi-tenancy introduces complexity that:

- Hinders scaling and query optimization
- Adds data isolation risks (security concerns)
- Increases operational overhead
- Complicates the development workflow

## Decision

**Remove multi-tenant architecture entirely.**

CampusOS will be:

- Single-instance per deployment
- Serve one organization/institute per deployment
- Simpler operational model
- Easier to scale horizontally (multiple independ deployments)

## Rationale

1. **Simpler Queries** — No need to filter by `instituteId` everywhere
2. **Better Performance** — Direct queries without tenant filtering
3. **Security** — Eliminates multi-tenant data isolation risks
4. **Scalability** — Deploy independent instances instead of managing one complex instance
5. **Development Speed** — No need for tenant middleware and complexities

## Consequences

### Positive

- Faster query performance (no tenant filtering)
- Simpler codebase (less middleware logic)
- Better security (no cross-tenant data risks)
- Easier to understand and debug
- Horizontal scaling via new deployments

### Negative

- Each institute needs separate deployment
- Higher operational overhead per institute
- No shared data between instances
- More infrastructure cost per instance

## Migration Path

- Remove all `instituteId` filtering from queries
- Remove multi-tenant middleware
- Simplify auth to user-based only (no tenant extraction)
- Update documentation and architecture

## Related ADRs

- ADR-002: Multi-Tenant Architecture (DEPRECATED)
- ADR-003: System Layers
- ADR-004: Development Strategy
