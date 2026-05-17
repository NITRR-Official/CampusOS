---
name: api-design
description: 'RESTful API patterns, request/response formatting, authentication flows, versioning. Use when: designing API endpoints, planning request bodies, structuring error responses, implementing authentication.'
argument-hint: 'endpoint-path, http-method, request-schema'
---

# API Design

## When to Use

- Designing API endpoints for new features
- Planning request and response formats
- Structuring error handling responses
- Implementing authentication flows
- Versioning API changes
- Documenting API contracts

## What This Skill Does

Establishes CampusOS REST API design patterns, request/response conventions, authentication requirements, HTTP status codes, and versioning strategy.

## Procedure

### Phase 1: Endpoint Planning

1. Identify resource (e.g., `/activities`, `/submissions`, `/users`)
2. Define standard HTTP methods:
   - GET /resource - List all
   - GET /resource/:id - Get single
   - POST /resource - Create
   - PATCH /resource/:id - Update
   - DELETE /resource/:id - Delete
3. Prefix with version: `/api/v1/activities`
4. Use plural nouns: `/activities` not `/activity`

### Phase 2: Request Schema

1. Define request body shape (JSON)
2. Specify required vs optional fields
3. Include data types and constraints:
   - Strings: min/max length, format
   - Numbers: min/max values
   - Dates: ISO 8601 format
   - Enums: allowed values
4. Document query parameters for filtering/pagination

### Phase 3: Response Format

1. Standardize response structure:
   ```json
   {
     "status": "success|error",
     "data": { ... },
     "meta": { "total": 100, "page": 1, "limit": 10 }
   }
   ```
2. Include HTTP metadata headers:
   - `Content-Type: application/json`
   - `X-Total-Count: 100` (for pagination)
3. Wrap single objects and arrays consistently

### Phase 4: Error Handling

1. Use appropriate HTTP status codes:
   - 200 OK - Success
   - 201 Created - Resource created
   - 400 Bad Request - Invalid input
   - 401 Unauthorized - Missing/invalid auth
   - 403 Forbidden - Insufficient permissions
   - 404 Not Found - Resource not found
   - 500 Internal Server Error
2. Include error response format:
   ```json
   {
     "status": "error",
     "code": "VALIDATION_ERROR",
     "message": "Invalid request",
     "details": [{ "field": "email", "message": "Invalid format" }]
   }
   ```

### Phase 5: Authentication

1. Use Bearer tokens in Authorization header: `Authorization: Bearer <token>`
2. Validate token on protected endpoints
3. Return 401 for missing/invalid tokens
4. Include user context in request (`req.user`)
5. Document which endpoints require authentication

### Phase 6: Pagination & Filtering

1. Query parameters: `?page=1&limit=10&sort=created_at&order=desc`
2. Return metadata: `meta: { total, page, limit, hasMore }`
3. Support common filters: status, role, date range
4. Validate limit range (max 100)

## Quick Reference

```bash
# Test endpoint
curl -X GET http://localhost:3000/api/v1/activities \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"

# POST with body
curl -X POST http://localhost:3000/api/v1/activities \
  -H "Content-Type: application/json" \
  -d '{"name":"Activity 1","description":"..."}'
```

## Common Issues

| Issue                        | Solution                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| 400 Bad Request              | Check request body schema, verify required fields present    |
| 401 Unauthorized             | Verify token format and validity, check Authorization header |
| 403 Forbidden                | Check user permissions/role, verify resource ownership       |
| Inconsistent response format | Standardize all responses with status/data/meta structure    |
| Missing pagination           | Add limit/offset to list endpoints, return total count       |
| No error details             | Include `code` and `details` array in error responses        |
| Missing API documentation    | Document in OpenAPI/Swagger spec alongside code              |
