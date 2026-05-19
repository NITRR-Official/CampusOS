# Code Review Guide

What reviewers check and common mistakes to avoid, based on actual CampusOS patterns.

## Architecture Checks

### Module isolation

```javascript
// ❌ Importing from another module — creates tight coupling
import { UserService } from '../../auth/src/service/auth.service.js';

// ✅ Use the registry
const requireRoles = registry.getService('requireRoles');
```

### Code in the right place

| Code type         | Goes in                      | Not in               |
| ----------------- | ---------------------------- | -------------------- |
| Business logic    | `service/*.service.js`       | Controllers          |
| Request handling  | `controller/*.controller.js` | Services             |
| Route definitions | `routes/*.routes.js`         | Index or controllers |
| Mongoose schemas  | `schema/*.schema.js`         | Services             |
| Plugin setup      | `index.js` (exports `init`)  | Anywhere else        |

### Plugin entry point

Every module must export an `init` function:

```javascript
// ✅ Correct
export async function init(app, registry) {
  const requireRoles = registry.getService('requireRoles');
  registerRoutes(app, requireRoles);
  registry.registerModule('my-module', { routes: [...] });
}
```

## Controller Pattern

### Correct pattern (from the actual codebase)

```javascript
async createVendor(req, res, next) {
  try {
    // 1. Extract specific fields (not ...req.body)
    const { name, category, email } = req.body;

    // 2. Call service
    const result = await vendorService.createVendor({ name, category, email });

    // 3. Check service result
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // 4. Return data
    return res.status(201).json(result.vendor);
  } catch (error) {
    // 5. Always forward to error middleware
    return next(error);
  }
}
```

### Common mistakes

```javascript
// ❌ Business logic in controller
if (amount > budget.totalAllocation) {
  return res.status(400).json({ error: 'Over budget' });
}

// ✅ Business logic in service
const result = await budgetService.logExpense(budgetId, { amount });
if (!result.success) {
  return res.status(400).json({ error: result.error });
}
```

```javascript
// ❌ Swallowing errors
try { await service.create(data); } catch(e) { /* nothing */ }

// ✅ Forward to error middleware
try { ... } catch (error) { return next(error); }
```

```javascript
// ❌ Passing entire req.body to service
const result = await service.create(req.body);

// ✅ Extract specific fields
const { name, category } = req.body;
const result = await service.create({ name, category });
```

## Service Pattern

Services return result objects — they don't throw for business errors:

```javascript
// In service
createVendor(data) {
  if (!data.name) {
    return { success: false, error: 'Name is required' };
  }
  // ... create vendor
  return { success: true, vendor };
}
```

## Route Pattern

Routes use `requireRoles()` for RBAC and register directly on `app`:

```javascript
export function registerVendorRoutes(app, requireRoles) {
  app.post(
    '/api/v1/vendors',
    requireRoles('admin', 'coordinator'),
    controller.create
  );
  app.get('/api/v1/vendors', controller.list);
  app.delete(
    '/api/v1/vendors/:vendorId',
    requireRoles('admin'),
    controller.delete
  );
}
```

## Pre-Submit Checklist

Run these before pushing:

```bash
pnpm lint              # Must pass
pnpm build             # Must pass
pnpm test              # If tests exist for your module
```

## Review Decision Guide

| Finding                                  | Severity    | Action                  |
| ---------------------------------------- | ----------- | ----------------------- |
| Direct import between modules            | 🔴 Blocking | Must fix                |
| Business logic in controller             | 🔴 Blocking | Move to service         |
| Missing `next(error)` in catch           | 🔴 Blocking | Must fix                |
| Missing `requireRoles` on write endpoint | 🔴 Blocking | Add role check          |
| Hardcoded secret                         | 🔴 Blocking | Use env var             |
| Passing `req.body` directly to service   | ⚠️ Warning  | Extract specific fields |
| No test coverage for service             | ⚠️ Warning  | Add tests               |
| Missing JSDoc on service methods         | ℹ️ Info     | Nice to have            |

---

**See Also**: [Git Workflow](./GIT_WORKFLOW.md) · [API Standards](./API_STANDARDS.md) · [Security Guidelines](./SECURITY.md)
