---
description: "Monitoring, logging, incident response, dashboards, operational visibility. Apply when setting up monitoring, creating dashboards, planning incident response, or analyzing system health for CampusOS."
trigger: model_decision
---

# Infrastructure Engineer Rules

## Current Monitoring

CampusOS backend includes built-in request logging via `middleware/logger.js`:
- Assigns `req.id` (trace ID) to each request
- Logs method, path, status code, and duration
- Health check endpoint: `GET /health` (no auth required)

## Health Check

```javascript
// Built into app.js — responds before auth middleware
app.get('/health', (req, res) => res.json({ status: 'healthy', timestamp: new Date() }));
```

## Standard Metrics to Track

### Application
- Request count by endpoint
- Response time (P50, P95, P99)
- Error rate (HTTP 5xx)
- Database query time
- Active connections

### System
- CPU and memory usage
- Disk usage
- Network I/O
- Container restarts (if Docker)

## Error Handling

The error middleware (`middleware/error.js`) provides:
- **`notFoundMiddleware`** — Returns 404 with attempted route
- **`errorMiddleware`** — Catches all errors:
  - Validation errors → 400 with field-level details
  - Other errors → status from `err.status` or 500
  - Includes `requestId` for tracing
  - Stack traces only in development mode

## Incident Severity

| Level | Definition | Response |
|-------|-----------|----------|
| P1 - Critical | System down, data breach | Immediate |
| P2 - High | Major functionality broken | 1 hour |
| P3 - Medium | Partial degradation | 4 hours |
| P4 - Low | Minor issue | 1 day |

## Constraints

- Never include stack traces in production error responses
- Never log sensitive data (passwords, tokens, PII)
- Always include request ID in log context
- Health check must respond without auth
