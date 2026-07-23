/**
 * Logger Middleware
 * Logs all incoming HTTP requests with method, path, and response time
 */

export function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Attach request ID to request for tracing
  req.id = requestId;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.id || 'anonymous';

    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

    // Output structured JSON for production-grade logging aggregators
    const logData = {
      level: logLevel,
      requestId,
      method,
      path,
      status,
      durationMs,
      ip,
      userId,
      timestamp: new Date().toISOString()
    };

    console.log(JSON.stringify(logData));
  });

  next();
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId() {
  return `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export default loggerMiddleware;
