# Vendor Plugin API Reference

The `vendor` plugin manages external contractors, sponsorship contacts, and B2B relations for clubs.

## 1. Overview

- **Plugin ID**: `vendor`
- **Focus**: External relations and B2B contacts.

## 2. Permissions Exported (RBAC)

The `vendor` plugin registers the following atomic permissions:

| Permission ID   | Label          | Description                                                |
| --------------- | -------------- | ---------------------------------------------------------- |
| `vendor:view`   | View Vendors   | Allows viewing vendor data                                 |
| `vendor:manage` | Manage Vendors | Allows adding or removing external sponsor/contractor data |

## 3. Services Exported

No public services are currently exposed.

## 4. Required Dependencies

Requires `club`.
