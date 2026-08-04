# ADR-013: Factory Pattern Services and Dependency Inversion

## Context

In earlier phases, CampusOS backend services were implemented as ES6 Classes (e.g., `class VendorService`). These classes often imported Mongoose models directly at the top of the file. As the application grew, this led to severe issues:

1. **Circular Dependencies**: Services that needed each other (e.g., Task and Event) would cause Node.js module resolution to fail due to circular imports.
2. **Tight Coupling to MongoDB**: Business logic was tightly coupled to Mongoose `Schema` methods.
3. **Hard to Test**: Testing required mocking deep Mongoose prototypes, which was brittle.
4. **Module Initialization Order**: If a service instantiated another service at module load time, the registry wasn't fully populated yet.

## Decision

We refactored all backend core plugins to use **Factory Functions** and the **Dependency Inversion Principle (DIP)**:

1. **Repository Pattern**: Database interactions are abstracted into Repository classes (e.g., `VendorRepository`).
2. **Service Factories**: Services are now created via factory functions (e.g., `export function createVendorService(repository)`).
3. **Controller Factories**: Controllers receive their service via their factory (`export function createVendorController(service)`).
4. **Composition at Initialization**: The plugin's `init()` function acts as the Composition Root, instantiating the repository, passing it to the service factory, and passing the service to the controller factory.

## Rationale

This approach eliminates ES6 circular dependency issues because dependencies are injected at runtime, not imported at module load time. It makes testing drastically simpler, as services can be tested with mock repositories without any Mongoose dependency.

## Consequences

- **Positive**: Complete elimination of circular dependencies. 100% isolated unit testability for business logic. Clear boundaries between HTTP, Business, and Database layers.
- **Negative**: Slightly more boilerplate in `index.js` to wire the dependencies together.
