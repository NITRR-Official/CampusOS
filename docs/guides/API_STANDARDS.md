# API Standards

REST API design conventions for CampusOS, based on the actual patterns in the codebase.

> **Note**: CampusOS runs on Express **v5** (5.2.1), not v4.

## Endpoint Design

### URL Structure

All endpoints follow this pattern:

```
/api/v1/<resource>                         # Collection
/api/v1/<resource>/:id                     # Single resource
/api/v1/<resource>/:id/<sub-resource>      # Nested resource
```

- **Version prefix**: Always `/api/v1/`
- **Plural nouns**: `/vendors`, `/events`, `/resources`
- **Nested resources**: `/events/:eventId/vendors` for relationships

### HTTP Methods

| Method   | Purpose          | Example                            | Success Code |
| -------- | ---------------- | ---------------------------------- | ------------ |
| `GET`    | List or retrieve | `GET /api/v1/vendors`              | `200`        |
| `POST`   | Create           | `POST /api/v1/vendors`             | `201`        |
| `PUT`    | Full update      | `PUT /api/v1/vendors/:vendorId`    | `200`        |
| `PATCH`  | Partial update   | `PATCH /api/v1/events/:eventId`    | `200`        |
| `DELETE` | Remove           | `DELETE /api/v1/vendors/:vendorId` | `200`        |

## Response Patterns

> **Important**: The codebase has two different response patterns depending on when the module was built.

### Pattern A: Wrapped responses (Foundation/Event layers)

Used by: `auth`, `club`, `institute`, `event`, `checkin`, `task`, `calendar`

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "title": "Tech Fest 2026",
    "status": "draft"
  }
}
```

Auth responses include token info:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc",
      "name": "John",
      "email": "john@example.com",
      "role": "volunteer"
    },
    "accessToken": "eyJhbG...",
    "tokenType": "Bearer"
  }
}
```

### Pattern B: Unwrapped responses (Operations layer)

Used by: `vendor`, `resource`, `scheduling`, `budget`

Single resource:

```json
{
  "_id": "abc123",
  "name": "Catering Co",
  "category": "catering",
  "status": "active"
}
```

List:

```json
{
  "count": 5,
  "vendors": [{ "_id": "abc123", "name": "Catering Co" }]
}
```

### Errors

Operations layer (bare error):

```json
{
  "error": "Vendor not found"
}
```

Foundation/Event layer (structured error with code):

```json
{
  "success": false,
  "error": "Validation Error",
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": [{ "field": "name", "message": "Name is required" }],
  "requestId": "REQ-1716123456-a1b2c3"
}
```

Common error codes from auth/event controllers:

- `VALIDATION_ERROR` — Invalid request body
- `EMAIL_ALREADY_EXISTS` (409) — Duplicate email on signup
- `INVALID_CREDENTIALS` (401) — Wrong email or password
- `EVENT_NOT_FOUND` (404) — Event doesn't exist
- `EVENT_CAPACITY_REACHED` (409) — Event is full
- `ALREADY_REGISTERED` (409) — Duplicate registration

## Status Codes

### Actual codes used in the codebase

| Code  | When                                                             |
| ----- | ---------------------------------------------------------------- |
| `200` | Successful GET, PUT, PATCH, DELETE                               |
| `201` | Successful POST (resource created)                               |
| `400` | Missing required fields, invalid data, business rule violation   |
| `401` | Missing token, invalid/expired token, wrong credentials          |
| `403` | Valid token but insufficient role                                |
| `404` | Resource not found, route not found                              |
| `409` | Conflict — duplicate email, already registered, capacity reached |
| `500` | Unhandled server errors                                          |

## Filtering

List endpoints support query parameter filtering:

```
GET /api/v1/vendors?category=catering&status=active
GET /api/v1/resources?type=venue&condition=good
```

The controller extracts recognized query params and passes them to the service as a filter object.

## Authentication

### Bearer Token

All non-public endpoints require a JWT token:

```
Authorization: Bearer <jwt-token>
```

### Public routes (no token required)

These are hardcoded in `middleware/auth.js`:

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/events` (listing)
- `GET /api/v1/events/:id` (single event)
- `POST /api/v1/events/:id/registrations`
- `GET /health`

### `req.user` shape

After auth middleware, the request object contains:

```javascript
req.user = {
  id: 'user_id', // from JWT sub or id claim
  email: 'user@example.com',
  role: 'coordinator' // admin | coordinator | volunteer
};
```

## RBAC

Role checks happen at the route level using `requireRoles()`:

```javascript
// In route definitions:
app.post(
  '/api/v1/vendors',
  requireRoles('admin', 'coordinator'),
  controller.create
);
app.delete('/api/v1/vendors/:id', requireRoles('admin'), controller.delete);
```

| Role          | Typical access                                |
| ------------- | --------------------------------------------- |
| `admin`       | Full access — create, update, delete, approve |
| `coordinator` | Create, update, assign resources              |
| `volunteer`   | View, participate, submit                     |

## Controller Pattern

Every controller follows this pattern:

```javascript
async createVendor(req, res, next) {
  try {
    const result = await vendorService.createVendor(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.vendor);
  } catch (error) {
    return next(error);   // Goes to error middleware
  }
}
```

Key patterns:

- **try/catch** wraps every handler
- **`next(error)`** on unexpected errors — sends to error middleware
- **Service returns `{ success, error }` or `{ success, data }`** — controller checks and responds
- **No business logic** in controllers — just extract params, call service, send response

## Testing Endpoints

```bash
# List vendors
curl -X GET http://localhost:4000/api/v1/vendors \
  -H "Authorization: Bearer <token>"

# Create vendor
curl -X POST http://localhost:4000/api/v1/vendors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Catering Co", "category": "catering", "email": "info@catering.co"}'

# Health check (no auth)
curl http://localhost:4000/health
```

---

**See Also**: [Backend Architecture](../architecture/BACKEND.md) · [Plugin System](../architecture/PLUGIN_SYSTEM.md) · [Security Guidelines](./SECURITY.md)
