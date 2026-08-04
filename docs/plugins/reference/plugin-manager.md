# Plugin Manager API Reference

The `plugin-manager` is a core architectural plugin. It exposes the registry UI and handles runtime tracking of what is loaded.

## 1. Overview

- **Plugin ID**: `plugin-manager`
- **Focus**: System health and extensibility tracking.

## 2. Permissions Exported (RBAC)

None. Interacting with the plugin manager is strictly reserved for global super-administrators.

## 3. Services Exported

It interacts deeply with the core `registry` object injected by `app.js` during boot.

## 4. Required Dependencies

None.
