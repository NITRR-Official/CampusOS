---
description: "REST API design, endpoint implementation, request/response patterns, authentication flows, RBAC. Apply when designing or implementing API endpoints, reviewing API code, or troubleshooting API issues in CampusOS."
trigger: model_decision
---

# API Engineer Rules

## API Design Constraints

- All endpoints must be prefixed with `/api/v1/`
- Use plural nouns for resources: `/vendors`, `/events`, `/resources`
- Nested resources for relationships: `/events/:eventId/vendors`
- HTTP methods: GET (list/retrieve), POST (create), PUT (full update), PATCH (partial update), DELETE (remove)

## Response Patterns

CampusOS uses two response patterns depending on the module:

### Pattern A — Wrapped responses (auth, club, institute, event, checkin, task, calendar)

```json
{ "success": true, "data": { ... } }
```

### Pattern B — Unwrapped responses (vendor, resource, scheduling, budget)

```json
{ "_id": "abc", "name": "Catering Co", "status": "active" }
```

For lists: `{ "count": 5, "vendors": [...] }`

### Error responses

Pattern A modules return structured errors with `code` and `details`:
```json
{ "success": false, "error": "Validation Error", "code": "VALIDATION_ERROR", "details": [...], "requestId": "REQ-..." }
```

Pattern B modules return bare errors: `{ "error": "Vendor not found" }`

## Controller Pattern

Controllers must be thin — extract params, call service, send response:

```javascript
async createVendor(req, res, next) {
  try {
    const { name, category, email, phone } = req.body;
    const result = await vendorService.createVendor({ name, category, email, phone });
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    return res.status(201).json(result.vendor);
  } catch (error) {
    return next(error);
  }
}
```

**Rules:**
- Extract specific fields from `req.body` — never spread the whole body
- Always wrap in `try/catch`
- Always call `next(error)` in catch blocks
- No business logic in controllers — that belongs in services

## Service Pattern

Services return result objects — never throw for business errors:

```javascript
async createVendor(data) {
  if (!data.name || !data.email) {
    return { success: false, error: 'Missing required fields' };
  }
  const vendor = new Vendor(data);
  await vendor.save();
  return { success: true, vendor: vendor.toObject() };
}
```

## Authentication & RBAC

- All non-public endpoints require `Authorization: Bearer <jwt-token>`
- Public routes (no auth): signup, login, event listing, event detail, event registration, health check
- Use `requireRoles()` middleware from the service registry for route-level RBAC
- Valid roles: `admin`, `coordinator`, `volunteer`
- `req.user` shape after auth: `{ id, email, role }`

## Route Registration

Routes register directly on the `app` object inside `init(app, registry)`:

```javascript
export function registerVendorRoutes(app, requireRoles) {
  app.post('/api/v1/vendors', requireRoles('admin', 'coordinator'), controller.create);
  app.get('/api/v1/vendors', controller.list);
  app.delete('/api/v1/vendors/:vendorId', requireRoles('admin'), controller.delete);
}
```

## Status Codes

| Code | When |
|------|------|
| 200 | Successful GET, PUT, PATCH, DELETE |
| 201 | Successful POST (resource created) |
| 400 | Missing required fields, invalid data |
| 401 | Missing/invalid/expired token |
| 403 | Valid token but insufficient role |
| 404 | Resource or route not found |
| 409 | Conflict — duplicate email, capacity reached |
| 500 | Unhandled server errors |

## Tech Stack Reminders

- **Express v5** (5.2.1) — async error handling is native
- **ES Modules only** — `import`/`export`, never `require()`
- **Backend port**: `4000` (not 3000)
- **MongoDB/Mongoose** for all modules — no in-memory storage
- **pnpm** only — never npm or yarn
