# RBAC & Security Guardrails

CampusOS employs a strictly enforced, Discord-style Role-Based Access Control (RBAC) system.

Instead of hardcoding "Owner" or "Member" checks in your routes, your plugin should register **atomic permissions** (e.g. `recruitment:manage`) and protect your Express endpoints with those permissions.

## 1. Registering Atomic Permissions

Inside your `init` block, declare any custom permissions your plugin needs.

```javascript
export async function init(app, registry, eventBus) {
  if (registry.permissions) {
    registry.permissions.register({
      id: 'recruitment:manage',
      module: 'recruitment',
      label: 'Manage Recruitment',
      description: 'Allows reviewing applications and scheduling interviews'
    });
  }
}
```

> [!NOTE]
> Registering a permission makes it automatically appear in the CampusOS Frontend Role Editor! Club owners can now check a box to assign this capability to specific roles.

## 2. Protecting Routes

To protect a route, you must fetch the `requirePermissions` middleware from the registry and inject it into your Express routes.

```javascript
// Fetch the middleware (ensure 'auth' is in your plugin.json dependencies!)
const requirePermissions = registry.getService('requirePermissions');

const router = express.Router({ mergeParams: true });

// Protect the endpoint
router.get(
  '/clubs/:clubId/applications',
  requirePermissions('recruitment:manage'),
  async (req, res) => {
    // If execution reaches here, the user is authenticated,
    // belongs to :clubId, AND possesses a role with the 'recruitment:manage' permission.

    // The user's metadata is injected into req.user
    const userId = req.user.id;

    res.json({ applications: [] });
  }
);
```

## 3. Hierarchy Guardrails

CampusOS employs strict hierarchical guardrails to prevent privilege escalation. A user can never create, assign, or modify a role that has a higher `hierarchyLevel` than their own highest role.

This logic is enforced at the core level, so as a plugin developer, as long as you rely on the native `requirePermissions` middleware, you are completely protected from escalation exploits!
