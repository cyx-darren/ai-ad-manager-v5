import { apiLogger } from '../../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  // Log error with full details for debugging
  apiLogger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // Determine error type and status
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let errorCode = err.code;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Invalid request data';
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || status === 401) {
    status = 401;
    message = 'Authentication required';
    errorCode = 'UNAUTHORIZED';
  } else if (err.name === 'ForbiddenError' || status === 403) {
    status = 403;
    message = 'Access denied';
    errorCode = 'FORBIDDEN';
  } else if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service temporarily unavailable';
    errorCode = 'SERVICE_UNAVAILABLE';
  } else if (err.code === 'ENOTFOUND') {
    status = 503;
    message = 'External service unreachable';
    errorCode = 'EXTERNAL_SERVICE_ERROR';
  } else if (err.name === 'TimeoutError') {
    status = 408;
    message = 'Request timeout';
    errorCode = 'TIMEOUT';
  } else if (err.name === 'PayloadTooLargeError') {
    status = 413;
    message = 'File too large';
    errorCode = 'PAYLOAD_TOO_LARGE';
  }
  
  // Don't leak sensitive error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const errorResponse = {
    error: {
      message,
      status,
      code: errorCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // Include detailed error info only in development
  if (isDevelopment) {
    errorResponse.error.details = err.message;
    if (err.stack) {
      errorResponse.error.stack = err.stack.split('\n').slice(0, 10); // Limit stack trace
    }
  }

  // Send error response
  res.status(status).json(errorResponse);
};

// Async error wrapper to catch async route errors
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Not found handler for undefined routes
export const notFoundHandler = (req, res) => {
  const message = `Route ${req.originalUrl} not found`;
  apiLogger.warn('Route not found', {
    path: req.originalUrl,
    method: req.method,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: {
      message,
      status: 404,
      code: 'NOT_FOUND',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      availableEndpoints: [
        'GET /api/health',
        'GET /api/dashboard/metrics',
        'POST /api/upload/pdf',
        'GET /api/upload/history',
        'GET /api/google-ads/*'
      ]
    }
  });
};