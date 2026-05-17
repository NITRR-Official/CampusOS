# Backend Architecture Overview

The backend follows a modular and minimal architecture built around a few core components.
Each component has a clearly defined responsibility, making the system easier to maintain, extend, and debug.

---

# Core Components

The backend primarily consists of the following files:

- `index.js`
- `server.js`
- `app.js`
- `registry.js`

---

# `index.js`

The `index.js` file acts as the main entry point of the backend application.

## Responsibilities

- Establishes the database connection
- Imports the assembled application instance from `app.js`
- Starts the HTTP server using `server.js`
- Uses port `4000` as the default server port (unless overridden)

## Purpose

This file is responsible for bootstrapping the entire backend application.

---

# `server.js`

The `server.js` file contains the logic responsible for creating and managing the Node.js server instance.

## Responsibilities

- Starts the HTTP server
- Handles graceful shutdown procedures
- Manages server lifecycle events

## Purpose

This file isolates server-specific logic from application logic, improving separation of concerns and maintainability.

---

# `app.js`

The `app.js` file is responsible for assembling and configuring the backend application.

It can be considered the central orchestration layer of the backend since most request processing flows through this file.

## Responsibilities

- Creates the Express application instance
- Configures CORS
- Loads global middleware
- Loads plugins and application extensions
- Configures error handling mechanisms
- Assembles application modules

## Purpose

This file serves as the heart of the backend architecture by bringing together all application-level configurations and integrations into a single initialized app instance.

---

# `registry.js`

The `registry.js` file defines the Module Registry system used throughout the backend.

This registry acts as a centralized dependency management layer for dynamically accessible application components.

## Responsibilities

The registry allows registration and retrieval of:

- Modules
- Services
- Authenticators
- Resolvers

Internally, these components are stored using a `Map`-based structure and are later exposed through `app.locals`.

## Purpose

The registry system helps:

- Reduce repetitive import statements
- Centralize dependency access
- Improve modularity
- Simplify service discovery across the application
- Enable cleaner plugin/module integration patterns

## Why It Matters

Instead of importing dependencies across multiple files repeatedly, components can retrieve them directly from the registry, resulting in a cleaner and more scalable architecture.

Example conceptually:

```js
const userService = app.locals.registry.getService('user');
```

This pattern keeps the codebase organized and reduces tight coupling between modules.

---

# Architectural Philosophy

The backend architecture is designed with the following principles in mind:

- **Separation of Concerns** — Each file handles a dedicated responsibility
- **Modularity** — Components can be extended independently
- **Scalability** — Registry-driven architecture supports future expansion
- **Maintainability** — Centralized configuration and dependency management reduce complexity
- **Extensibility** — Plugins, services, and modules can be integrated cleanly
