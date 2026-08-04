# Auth Plugin API Reference

The `auth` plugin manages user authentication, session tokens, and basic user profiles. It is a critical core dependency for almost all other plugins.

## 1. Overview

- **Plugin ID**: `auth`
- **Exposed Routes**:
  - `POST /api/v1/auth/signup`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/auth/me`

## 2. Services Exported

Currently, the `auth` plugin does not export dedicated registry services for 3rd-party consumption. Instead, the `auth` plugin operates at the middleware layer via the core Express `app.js` (injecting `req.user` globally).

## 3. Events Emitted

The `auth` plugin manages its state internally and currently does not emit EventBus events.

## 4. Required Dependencies

None. The `auth` plugin is foundational.
