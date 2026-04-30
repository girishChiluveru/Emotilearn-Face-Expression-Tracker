/**
 * errorHandler.js
 * ==============
 * Centralized error handling middleware
 * Consistent error responses across all endpoints
 */

class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }
}

/**
 * Error handling middleware
 * Should be registered LAST in middleware stack
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log error server-side
  const errorLog = {
    timestamp: new Date(),
    method: req.method,
    url: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack,
    user: req.user?.id || 'anonymous',
  };

  console.error('[ERROR]', errorLog);

  // Don't expose stack trace in production
  const responseError = {
    error: err.message || 'Internal Server Error',
    statusCode,
    timestamp: err.timestamp || new Date(),
  };

  if (isDevelopment) {
    responseError.details = err.details;
    responseError.stack = err.stack;
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details,
      timestamp: new Date(),
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed',
      timestamp: new Date(),
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      message: 'Please log in again',
      timestamp: new Date(),
    });
  }

  // MongoDB errors
  if (err.name === 'MongoError' || err.code === 11000) {
    return res.status(409).json({
      error: 'Database error',
      message: 'Resource already exists or database conflict',
      timestamp: new Date(),
    });
  }

  // Return generic response
  res.status(statusCode).json(responseError);
}

/**
 * Not found handler
 * Should be registered before error handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date(),
  });
}

/**
 * Async route wrapper
 * Catches errors in async route handlers
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
