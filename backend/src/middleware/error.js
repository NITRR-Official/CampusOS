/**
 * Error Handling Middleware
 * 
 * Catches all errors and formats them consistently
 * 
 * MUST be placed last in middleware chain
 */

export function errorMiddleware(err, req, res, next) {
  console.error('Error caught:', err);

  // Extract error details
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const requestId = req.id || 'UNKNOWN';

  // Validation errors (e.g., from Joi)
  if (err.details) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Request validation failed',
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
