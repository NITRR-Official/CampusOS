/**
 * Logger Middleware
 * Attaches request-scoped child logger (req.logger) and logs all incoming HTTP requests
 */

import { rootLogger } from '../core/logger.js';

export function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const requestId =
    req.headers?.['x-request-id'] || req.id || generateRequestId();

  // Attach request ID and scoped logger to request for tracing
  req.id = requestId;
  req.logger = rootLogger.child({ requestId });

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const status = res.statusCode;
    const method = req.method;
    const path = req.path || req.originalUrl || req.url || '/';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userId = req.user?.id || req.user?._id || 'anonymous';

    const logMeta = {
      method,
      path,
      status,
      durationMs,
      ip,
      userId
    };

    const message = `HTTP ${method} ${path} ${status} (${durationMs}ms)`;

    if (status >= 500) {
      req.logger.error(message, logMeta);
    } else if (status >= 400) {
      req.logger.warn(message, logMeta);
    } else {
      req.logger.info(message, logMeta);
    }
  });

  next();
}

/**
 * Generate unique request ID for tracing
 */
export function generateRequestId() {
  return `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export default loggerMiddleware;
