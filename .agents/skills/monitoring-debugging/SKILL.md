---
name: monitoring-debugging
description: "Logging, error tracking, debugging, health checks for CampusOS. Use when setting up logging, tracking errors, debugging production issues, or monitoring service health."
---

# Monitoring & Debugging

## When to Use

- Setting up or troubleshooting logging
- Debugging backend issues
- Monitoring service availability
- Analyzing error patterns

## Procedure

### Phase 1: Built-in Logging

CampusOS has a request logger middleware (`middleware/logger.js`):
- Assigns `req.id` as a trace ID for each request
- Logs: method, path, status code, duration
- Use `req.id` to correlate logs across a request lifecycle

### Phase 2: Error Handling

Error middleware (`middleware/error.js`) provides two handlers:

**404 Handler** — catches unmatched routes:
```json
{ "error": "Route /api/v1/unknown not found" }
```

**Error Handler** — catches all thrown errors:
- Validation errors → 400 with field-level details
- Other errors → status from `err.status` or 500
- Stack traces only in development (`NODE_ENV === 'development'`)
- Includes `requestId` for tracing

### Phase 3: Health Check

```bash
curl http://localhost:4000/health
```

Returns 200 if server is running. No auth required.

### Phase 4: Debug Workflow

1. Check health endpoint — is the server up?
2. Check logs for `requestId` — trace the failing request
3. Check MongoDB connection: `isDBConnected()` in `database/connection.js`
4. Enable Mongoose debug: `mongoose.set('debug', true)` for query logging
5. Check middleware order — auth must come before routes

### Phase 5: Common Debug Commands

```bash
# Check backend is running
curl http://localhost:4000/health

# Check MongoDB
mongosh mongodb://localhost:27017/campusos --eval "db.stats()"

# Watch backend logs
pnpm dev  # Backend logs to stdout with --watch

# Check for port conflicts
netstat -ano | findstr :4000
```

## Common Issues

| Issue | Solution |
|-------|----------|
| 500 errors with no details | Check `NODE_ENV` — set to `development` for stack traces |
| Request ID missing | Ensure logger middleware is before routes in `app.js` |
| MongoDB not responding | `docker start mongodb`; check `MONGODB_URI` |
| Sensitive data in logs | Never log passwords, tokens, or PII |
