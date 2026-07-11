# ADR-011: Comprehensive Automated Testing Strategy

## Status

Accepted

## Context

As CampusOS transitions from in-memory repositories to MongoDB schemas for all its plugins, it became critical to have an automated way to verify plugin functionality without impacting a live database. Additionally, as we implement more robust architectural patterns (e.g., event-driven cascade deletes, decoupled plugins), we need tests to catch regressions. Testing needs to be isolated per plugin but consistently configured across the monorepo.

## Decision

We have decided to adopt the following testing strategy for the CampusOS backend:

1. **Test Runner Framework:** We are using **Vitest**. It provides an API compatible with Jest but operates significantly faster due to Vite's modern build pipeline. Vitest also integrates seamlessly with our TypeScript/ESM configurations.
2. **Database Mocking:** Instead of connecting to a real MongoDB instance or trying to mock Mongoose models directly, we use **MongoDB Memory Server**. This provides an actual MongoDB instance that runs in memory, ensuring that all our Mongoose schemas, hooks, validations, and constraints are executed authentically without disk overhead or cross-test contamination.
3. **Test Colocation:** Tests are colocated with the services they verify (e.g., `event.service.test.js` lives alongside `event.service.js`).
4. **Lifecycle Management:** Each test file explicitly spins up its own MongoDB Memory Server instance before tests run and shuts it down afterward. This guarantees complete isolation between test suites.
5. **Mongoose Best Practices:** All database tests enforce strict validation. Recent updates replaced deprecated Mongoose flags (e.g., `{ new: true }`) with modern equivalents (e.g., `{ returnDocument: 'after' }`).

## Consequences

- **Positive:** We now have a robust, high-confidence suite of automated tests for all plugins.
- **Positive:** Developers can refactor internals and test API logic natively without spinning up Docker or external databases.
- **Negative/Risk:** MongoDB Memory Server requires downloading the MongoDB binaries upon first run, which can slow down the initial `pnpm install` or test run in CI environments.
- **Mitigation:** We will cache the MongoDB Memory Server binaries in our CI pipeline.
