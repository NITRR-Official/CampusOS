/**
 * Error Handling Middleware
 *
 * Catches all errors and formats them consistently
 *
 * MUST be placed last in middleware chain
 */

import { ZodError } from 'zod';

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  console.error('Error caught:', err);

  // Extract error details
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const requestId = req.id || 'UNKNOWN';

  // Validation errors (Zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message
      })),
      requestId
    });
  }

  // Legacy Validation errors (e.g., from Joi or manual)
  if (err.details) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Request validation failed',
      details: err.details,
      requestId
    });
  }

  // Custom Domain errors (from services)
  if (err.code && typeof err.code === 'string') {
    let statusCode = 400; // Default to Bad Request for domain errors

    if (err.code.includes('NOT_FOUND')) statusCode = 404;
    else if (
      err.code.includes('EXISTS') ||
      err.code.includes('CONFLICT') ||
      err.code === 'ALREADY_REGISTERED' ||
      err.code === 'EVENT_CAPACITY_REACHED'
    )
      statusCode = 409;
    else if (err.code.includes('UNAUTHORIZED')) statusCode = 401;
    else if (err.code.includes('FORBIDDEN') || err.code.includes('ESCALATION'))
      statusCode = 403;

    // Use err.status if specifically provided
    if (err.status) statusCode = err.status;

    return res.status(statusCode).json({
      success: false,
      error: err.code,
      message,
      requestId
    });
  }

  // Standard error response
  res.status(status).json({
    success: false,
    error: err.name || 'Error',
    message,
    requestId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

/**
 * 404 Not Found Middleware
 * Handles routes that don't exist
 */
export function notFoundMiddleware(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route '${req.method} ${req.path}' not found`,
    requestId: req.id || 'UNKNOWN'
  });
}

export default errorMiddleware;
