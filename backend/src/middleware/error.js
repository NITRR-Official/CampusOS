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

  // Safely log errors, as ZodError deep inspect can sometimes crash Node's util.inspect
  if (err instanceof ZodError) {
    console.error('Validation Error caught:', err.errors);
  } else {
    console.error('Error caught:', err);
  }

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

  // Generic Domain errors (using AppError or explicitly thrown HTTP errors)
  if (err.code && typeof err.code === 'string') {
    return res.status(err.statusCode || err.status || 400).json({
      success: false,
      error: err.code,
      message: err.message,
      details: err.details,
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
