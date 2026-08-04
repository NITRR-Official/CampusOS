# Admin Plugin

The Admin plugin handles system-wide configurations, overarching user management across all institutes and clubs, and global platform settings. This plugin is highly restricted.

## Architecture Layer

**1. Foundation Layer**

## Collections

- `SystemConfig`: Stores global variables (e.g., global maintenance mode, API rate limits, feature flags).

## Events

- **Emits**: `system:maintenance_mode_toggled`, `system:config_updated`.

## Permissions

- All endpoints in this plugin require the `isSuperAdmin` bypass or the `admin:manage` atomic permission, meaning they are strictly isolated to platform administrators.
