---
name: monitoring-debugging
description: 'Logging systems, error tracking, debug sessions, dashboards. Use when: setting up logging, tracking errors, debugging production issues, monitoring service health.'
argument-hint: 'log-level, service-name'
---

# Monitoring & Debugging

## When to Use

- Setting up centralized logging
- Implementing error tracking (Sentry, DataDog)
- Debugging production issues
- Monitoring service availability
- Analyzing error patterns
- Setting up debug dashboards

## What This Skill Does

Establishes comprehensive logging and error tracking infrastructure for CampusOS, enabling production debugging and issue diagnosis.

## Procedure

### Phase 1: Logging Infrastructure

1. Install logging library: `pnpm add winston` (or pino for performance)
2. Configure logger in `src/utils/logger.ts`:
   ```typescript
   import winston from 'winston';
   export const logger = winston.createLogger({
     level: process.env.LOG_LEVEL || 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({
         filename: 'logs/error.log',
         level: 'error'
       }),
       new winston.transports.File({ filename: 'logs/combined.log' })
     ]
   });
   ```
3. Log levels: `error`, `warn`, `info`, `debug`, `trace`
4. Use structured logging (JSON): `logger.info({msg, userId, action})`
5. Never log sensitive data (passwords, tokens, PII)
6. Add request ID to all logs: `req.id = uuid()`

### Phase 2: Error Tracking (Sentry)

1. Install: `pnpm add @sentry/node @sentry/tracing`
2. Initialize in `src/index.ts`:
   ```typescript
   import * as Sentry from '@sentry/node';
   Sentry.init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 0.1 });
   app.use(Sentry.Handlers.requestHandler());
   ```
3. Capture errors in middleware:
   ```typescript
   app.use((err, req, res, next) => {
     Sentry.captureException(err);
     logger.error({ msg: err.message, stack: err.stack });
     res.status(500).json({ error: 'Internal server error' });
   });
   ```
4. Set environment: `Sentry.init({...environment: 'production'})`
5. Add release tracking: `Sentry.init({...release: process.env.APP_VERSION})`
6. Monitor error aggregation in Sentry dashboard

### Phase 3: Request Tracing & Debugging

1. Add request logging middleware:
   ```typescript
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       const duration = Date.now() - start;
       logger.info({
         method: req.method,
         path: req.path,
         status: res.statusCode,
         duration
       });
     });
     next();
   });
   ```
2. Log database queries:
   ```typescript
   db.on('query', (q) => logger.debug({ query: q.toString() }));
   ```
3. Performance profiling: Track endpoints >500ms
4. Add context to logs:
   ```typescript
   logger.info('Action completed', {
     userId: req.user.id,
     feature: 'submission'
   });
   ```
5. Use correlation IDs across service calls
6. Enable debug mode locally: `DEBUG=campusos:* npm start`

### Phase 4: Health Checks & Uptime Monitoring

1. Implement health endpoint: `GET /health`
   ```typescript
   app.get('/health', async (req, res) => {
     const dbHealthy = await mongoose.connection.db.admin().ping();
     res.json({ status: dbHealthy ? 'healthy' : 'unhealthy', ts: new Date() });
   });
   ```
2. Check: database connectivity, redis cache, external APIs
3. Return 200 (healthy) or 503 (unhealthy)
4. Monitor with uptime service (UptimeRobot, Pingdom)
5. Alert if endpoint down for >5 minutes
6. Log health checks separately to avoid noise

### Phase 5: Dashboards & Alerting

1. Use DataDog or Grafana for logs/metrics visualization
2. Create dashboards:
   - Error rate (% of requests returning 5xx)
   - Response time (p50, p95, p99 latency)
   - Request volume (QPS: queries per second)
   - Database connection pool usage
3. Set alert thresholds:
   - Error rate > 5%
   - Response time > 1000ms
   - Downtime > 5 minutes
4. Send alerts to Slack: `#alerts` channel
5. Include context: `[ERROR] User service down - Error rate 12%`
6. Link to logs/trace for investigation

### Phase 6: Debug Session Workflow

1. Receive alert → Fetch correlation ID from dashboard
2. Query logs: `logger.search({correlationId, service: 'backend'})`
3. View trace: Full request path through services
4. Check errors: Sentry event details, stack trace
5. Database query logs: Slow queries causing latency
6. Rollback or hotfix, redeploy, monitor recovery

## Quick Reference

```bash
# View logs
tail -f logs/combined.log

# Search logs for error
grep "ERROR" logs/combined.log | tail -20

# Test logging setup
node -e "const logger = require('./src/utils/logger'); logger.info('Test log')"

# Check service health
curl http://localhost:3000/health

# Enable debug mode
DEBUG=campusos:* pnpm dev

# Ship logs to DataDog
export DD_API_KEY=xxx
dd-logger -f logs/combined.log
```

## Troubleshooting

| Issue                            | Solution                                                                  |
| -------------------------------- | ------------------------------------------------------------------------- |
| Logs too verbose                 | Increase `LOG_LEVEL`: `LOG_LEVEL=warn` to reduce info/debug logs          |
| Sensitive data in error messages | Sanitize error messages; use `Sentry.beforeSend()` to filter              |
| Sentry not capturing errors      | Verify `SENTRY_DSN` set; check error handler middleware positioned last   |
| Health check timeout             | Increase timeout; verify database connection healthy: `pnpm exec mongosh` |
| Correlation ID not propagating   | Pass `req.id` to services; include in log context on each log statement   |
| Logs lost during deployment      | Use persistent log files or external service (DataDog, Papertrail)        |
