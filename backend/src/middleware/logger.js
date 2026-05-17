/**
 * Logger Middleware
 * Logs all incoming HTTP requests with method, path, and response time
 */

export function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId = generateRequestId();

  // Attach request ID to request for tracing
  req.id = requestId;

  // Hook into res.end to capture response details
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path;

    // Log format: [TRACE_ID] METHOD PATH STATUS (duration)ms
    const logLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
    console.log(
      `[${requestId}] ${logLevel} | ${method} ${path} | ${status} | ${duration}ms`
    );

    originalEnd.apply(res, args);
  };

  next();
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId() {
  return `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export default loggerMiddleware;
