---
name: api-design
description: "RESTful API patterns, request/response formatting, authentication flows, versioning for CampusOS. Use when designing API endpoints, planning request bodies, structuring error responses, or implementing authentication."
---

# API Design

## When to Use

- Designing API endpoints for new features
- Planning request and response formats
- Structuring error handling responses
- Implementing authentication flows
- Documenting API contracts

## Procedure

### Phase 1: Endpoint Planning

1. Identify resource (e.g., `/vendors`, `/events`, `/resources`)
2. Define standard HTTP methods:
   - GET /api/v1/resource — List all
   - GET /api/v1/resource/:id — Get single
   - POST /api/v1/resource — Create
   - PUT /api/v1/resource/:id — Full update
   - PATCH /api/v1/resource/:id — Partial update
   - DELETE /api/v1/resource/:id — Delete
3. Always prefix with version: `/api/v1/`
4. Use plural nouns: `/vendors` not `/vendor`
5. Nested resources for relationships: `/events/:eventId/vendors`

### Phase 2: Response Format

CampusOS uses two patterns depending on the module:

**Pattern A — Wrapped (auth, club, institute, event, checkin, task, calendar):**
```json
{ "success": true, "data": { "id": "abc", "title": "Tech Fest" } }
```

**Pattern B — Unwrapped (vendor, resource, scheduling, budget):**
```json
{ "_id": "abc", "name": "Catering Co", "status": "active" }
```

For lists in Pattern B: `{ "count": 5, "vendors": [...] }`

### Phase 3: Error Handling

Use appropriate HTTP status codes:
- 200 OK — Successful GET, PUT, PATCH, DELETE
- 201 Created — Successful POST
- 400 Bad Request — Invalid input, missing fields
- 401 Unauthorized — Missing/invalid auth token
- 403 Forbidden — Insufficient role permissions
- 404 Not Found — Resource not found
- 409 Conflict — Duplicate email, capacity reached
- 500 Internal Server Error

Pattern A error response:
```json
{
  "success": false,
  "error": "Validation Error",
  "code": "VALIDATION_ERROR",
  "details": [{ "field": "email", "message": "Invalid format" }],
  "requestId": "REQ-..."
}
```

Pattern B error response:
```json
{ "error": "Vendor not found" }
```

### Phase 4: Authentication

1. Use Bearer tokens: `Authorization: Bearer <jwt-token>`
2. JWT verified by `middleware/auth.js`
3. After auth: `req.user = { id, email, role }`
4. Public routes (no auth): signup, login, event listing/detail, event registration, health check
5. RBAC via `requireRoles('admin', 'coordinator')` middleware

### Phase 5: Filtering & Pagination

Query parameters for list endpoints:
```
GET /api/v1/vendors?category=catering&status=active
GET /api/v1/resources?type=venue&condition=good
```

Controller extracts recognized query params and passes as filter object to service.

## Quick Reference

```bash
# Test endpoint (backend runs on port 4000)
curl -X GET http://localhost:4000/api/v1/vendors \
  -H "Authorization: Bearer <token>"

# Create resource
curl -X POST http://localhost:4000/api/v1/vendors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name":"Catering Co","category":"catering","email":"info@catering.co"}'

# Health check (no auth)
curl http://localhost:4000/health
```

## Common Issues

| Issue | Solution |
|-------|----------|
| 400 Bad Request | Check request body, verify required fields present |
| 401 Unauthorized | Verify Bearer token format and validity |
| 403 Forbidden | Check user role matches `requireRoles()` guard |
| Inconsistent response format | Check which pattern the module uses (A or B) |
| Missing pagination | Add query param filtering in controller, return count |
