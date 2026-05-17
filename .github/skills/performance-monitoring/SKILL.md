---
name: performance-monitoring
description: 'Performance metrics, alerting, SLAs, dashboards, latency tracking. Use when: tracking service metrics, setting SLOs/SLIs, monitoring latency, identifying bottlenecks.'
argument-hint: 'metric-type, threshold'
---

# Performance Monitoring

## When to Use

- Tracking response times and throughput
- Monitoring resource usage (CPU, memory)
- Setting Service Level Objectives (SLOs)
- Identifying and alerting on performance degradation
- Monitoring database query performance
- Tracking frontend performance metrics

## What This Skill Does

Implements performance monitoring for CampusOS using metrics collection, SLO tracking, and targeted alerting.

## Procedure

### Phase 1: Metrics Collection Setup

1. Install metrics library: `pnpm add prom-client` (Prometheus format)
2. Create `src/utils/metrics.ts`:
   ```typescript
   import promClient from 'prom-client';
   export const httpRequestDuration = new promClient.Histogram({
     name: 'http_request_duration_seconds',
     help: 'HTTP request latency',
     buckets: [0.1, 0.5, 1, 2, 5],
     labelNames: ['method', 'route']
   });
   ```
3. Register default metrics: `promClient.collectDefaultMetrics()`
4. Expose metrics endpoint: `GET /metrics` returns Prometheus format
5. Collect: Request latency, error rate, database query time, cache hit rate
6. Use histogram buckets: [10ms, 50ms, 100ms, 500ms, 1s, 5s]

### Phase 2: Middleware & Auto-Instrumentation

1. Add metrics middleware:
   ```typescript
   app.use((req, res, next) => {
     const start = Date.now();
     res.on('finish', () => {
       const duration = (Date.now() - start) / 1000;
       httpRequestDuration.labels(req.method, req.route.path).observe(duration);
     });
     next();
   });
   ```
2. Track database operations:
   ```typescript
   mongoose.set('debug', (coll, method, query) => {
     const start = Date.now();
     // Log execution time
   });
   ```
3. Monitor cache performance: hits vs misses
4. Track queue depth (e.g., Bull job queue)
5. Monitor memory usage: `process.memoryUsage()`
6. CPU usage: `os.cpus()` average load

### Phase 3: SLO/SLI Definition

1. Define Service Level Objectives:
   - Availability: 99.9% uptime (max 43 minutes/month downtime)
   - Latency SLO: 95th percentile < 500ms
   - Error rate SLO: < 0.1% of requests
2. Define SLI (Service Level Indicators):
   - **Availability**: `uptime_seconds / total_seconds`
   - **Latency**: `requests_under_500ms / total_requests`
   - **Error rate**: `error_requests / total_requests`
3. Calculate SLO attainment:
   ```
   Latency SLI = count(latency < 500ms) / count(total requests)
   Target SLI = 0.95
   ```
4. Track budget remaining: `(SLO - current_SLI) / days_remaining`
5. Alert if SLI drops below target
6. Monthly review: Adjust SLO if consistently exceeded/missed

### Phase 4: Dashboard Configuration

1. Create Grafana dashboard with panels:
   - **Latency**: p50, p95, p99 percentile lines
   - **Throughput**: QPS (requests per second)
   - **Error rate**: 5xx errors as % of total
   - **Resource**: CPU %, memory % used
   - **Availability**: Uptime % (green/red status)
2. Use time range selector: 1h, 6h, 24h, 7d, 30d
3. Add service selector: Filter by backend/web/api
4. Include annotations: Deployments, incidents
5. Link dashboard to alert definitions
6. Share dashboard URL in #monitoring Slack channel

### Phase 5: Alerting Rules

1. Create alert rules in DataDog/Prometheus:
   ```
   alert: HighErrorRate
   expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
   for: 5m
   annotations:
     summary: "Error rate >5% for 5 minutes"
   ```
2. Define alert conditions:
   - **Error rate** > 5% for 5 minutes
   - **Latency** p95 > 1000ms for 10 minutes
   - **Uptime** < 95% in last 24 hours
   - **Memory** > 90% for 5 minutes
3. Set escalation: Warn → Page → Emergency page
4. Include runbook link in alert: Debugging steps
5. Tune to minimize false positives
6. Route to on-call engineer via PagerDuty

### Phase 6: Performance Optimization Workflow

1. Monitor metrics daily for anomalies
2. Identify slow endpoints: `query latencies by route`
3. Profile bottleneck: Database, API call, compute
4. Optimize: Add index, batch query, cache response
5. A/B test change: Compare latency before/after
6. Re-baseline SLO if significant improvement

## Quick Reference

```bash
# View metrics endpoint (Prometheus format)
curl http://localhost:3000/metrics

# Query Prometheus (if available)
curl 'http://prometheus:9090/api/v1/query?query=http_request_duration_seconds'

# Calculate latency percentile
curl http://prometheus/api/v1/query?query='histogram_quantile(0.95, http_request_duration_seconds)'

# View current memory usage
node -e "console.log(process.memoryUsage())"

# Test high load locally
pnpm add --save-dev autocannon
npx autocannon http://localhost:3000 -c 100 -d 60

# Export metrics to CSV
prom2csv http://prometheus:9090 --output metrics.csv
```

## Troubleshooting

| Issue                                    | Solution                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| Metrics endpoint 404                     | Verify middleware added before routes; ensure `GET /metrics` handler   |
| Prometheus can't scrape metrics          | Check `--scrape_interval` alignment; verify firewall allows access     |
| Dashboard shows no data                  | Query time range may be too narrow; verify metrics are being emitted   |
| Alert firing constantly (false positive) | Increase `for:` threshold (e.g., `for: 10m`) or reduce alert threshold |
| SLO budget exhausted                     | Prioritize stability; reduce deployments; increase alert threshold     |
| Memory metrics missing                   | Ensure `prom-client` default metrics enabled; check memory pressure    |
