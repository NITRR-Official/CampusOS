# ADR 002: Multi-Tenant Architecture Design

## Status

**DEPRECATED** (See ADR-005: Removing Multi-Tenant Architecture)

## Context (Historical)

CampusOS needs to serve multiple colleges/institutes from a single backend deployment.

## Decision

### Single Backend → Multiple Institutes

- One backend instance serves all institutes
- Each institute is a tenant with isolated data

### Each Institute Has

- Users (with roles specific to that institute)
- Clubs (organization structure)
- Events (club-specific)
- Modules enabled/disabled per institute

### Data Isolation Strategy

1. **Tenant Identifier** — Every entity includes `instituteId`
2. **Middleware** — Extract tenant from authentication
3. **Queries** — All database queries filtered by `instituteId`
4. **Feature Toggles** — Modules enabled/disabled per tenant

## Rationale

1. **Cost Efficiency** — Single deployment vs multiple servers
2. **Easier Updates** — Update once, all institutes benefit
3. **Simplified Operations** — Centralized monitoring and backups
4. **Data Sharing** — Can enable inter-institute features later

## Consequences

### Positive

- Scalable to 100+ institutes
- Low operational overhead
- Easier to manage

### Negative

- Must be careful with query filters (security risk)
- Data leakage if not properly isolated
- Backup/restore affects all tenants

## Risk Mitigation

1. Middleware enforces `instituteId` on all queries
2. Database-level constraints check `instituteId`
3. Audit logging captures all data access
4. Regular security reviews of tenant isolation
