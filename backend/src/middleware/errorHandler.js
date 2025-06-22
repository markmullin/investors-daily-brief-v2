import logger, { logApiError } from '../utils/logger.js';

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends AppError {
  constructor(message, originalError = null) {
    super(message, 500);
    this.originalError = originalError;
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class MarketDataError extends AppError {
  constructor(message, provider = null) {
    super(message, 502);
    this.provider = provider;
    this.name = 'MarketDataError';
  }
}

export class CalculationError extends AppError {
  constructor(message, calculationType = null) {
    super(message, 422);
    this.calculationType = calculationType;
    this.name = 'CalculationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded', retryAfter = null) {
    super(message, 429);
    this.retryAfter = retryAfter;
    this.name = 'RateLimitError';
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const response = {
    success: false,
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add request ID if available
  if (req.id) {
    response.requestId = req.id;
  }

  // Add specific error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.name = error.name;
  }

  // Add validation errors if present
  if (error instanceof ValidationError && error.errors) {
    response.errors = error.errors;
  }

  // Add retry after for rate limiting
  if (error instanceof RateLimitError && error.retryAfter) {
    response.retryAfter = error.retryAfter;
  }

  // Add provider info for market data errors
  if (error instanceof MarketDataError && error.provider) {
    response.provider = error.provider;
  }

  // Add calculation type for calculation errors
  if (error instanceof CalculationError && error.calculationType) {
    response.calculationType = error.calculationType;
  }

  return response;
};

// Main error handling middleware
export const errorHandler = (error, req, res, next) => {
  // Ensure we have an error object
  if (!error) {
    return next();
  }

  // Set default status code if not set
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';

  // Handle specific error types
  if (error.name === 'ValidationError' && error.errors) {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    // MongoDB cast error
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.code === 'ENOTFOUND') {
    // DNS lookup failed
    statusCode = 502;
    message = 'Service temporarily unavailable';
  } else if (error.code === 'ECONNREFUSED') {
    // Connection refused
    statusCode = 503;
    message = 'Service unavailable';
  } else if (error.code === 'ETIMEDOUT') {
    // Request timeout
    statusCode = 504;
    message = 'Request timeout';
  } else if (error.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.code === '23503') {
    // PostgreSQL foreign key constraint violation
    statusCode = 400;
    message = 'Invalid reference to related resource';
  } else if (error.code === '23502') {
    // PostgreSQL not null constraint violation
    statusCode = 400;
    message = 'Required field is missing';
  }

  // Log the error
  logApiError(error, req, { statusCode });

  // Set response headers
  res.status(statusCode);

  // Add rate limit headers if applicable
  if (error instanceof RateLimitError && error.retryAfter) {
    res.set('Retry-After', error.retryAfter);
  }

  // Don't expose sensitive errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error';
  }

  // Create error response
  const errorResponse = formatErrorResponse({ 
    ...error, 
    statusCode, 
    message 
  }, req);

  res.json(errorResponse);
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Resource not found: ${req.originalUrl}`, 404);
  next(error);
};

// Async error wrapper
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error helper
export const createValidationError = (message, errors = []) => {
  return new ValidationError(message, errors);
};

// Database error helper
export const handleDatabaseError = (error, operation) => {
  logger.error(`Database error during ${operation}:`, {
    error: error.message,
    stack: error.stack,
    code: error.code
  });

  if (error.code === 'ECONNREFUSED') {
    return new DatabaseError('Database connection failed');
  } else if (error.code === '23505') {
    return new DatabaseError('Resource already exists');
  } else if (error.code === '23503') {
    return new DatabaseError('Invalid reference to related resource');
  } else if (error.code === '23502') {
    return new DatabaseError('Required field is missing');
  } else {
    return new DatabaseError(`Database operation failed: ${operation}`);
  }
};

// Market data error helper
export const handleMarketDataError = (error, provider, symbol) => {
  logger.error(`Market data error from ${provider} for ${symbol}:`, {
    error: error.message,
    provider,
    symbol,
    stack: error.stack
  });

  if (error.response?.status === 401) {
    return new MarketDataError('Market data provider authentication failed', provider);
  } else if (error.response?.status === 429) {
    return new RateLimitError('Market data rate limit exceeded');
  } else if (error.response?.status === 404) {
    return new MarketDataError(`Symbol ${symbol} not found`, provider);
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return new MarketDataError('Market data provider temporarily unavailable', provider);
  } else {
    return new MarketDataError(`Failed to fetch market data for ${symbol}`, provider);
  }
};

// Calculation error helper
export const handleCalculationError = (error, calculationType, data) => {
  logger.error(`Calculation error for ${calculationType}:`, {
    error: error.message,
    calculationType,
    dataSize: Array.isArray(data) ? data.length : 'unknown',
    stack: error.stack
  });

  return new CalculationError(`Financial calculation failed: ${calculationType}`, calculationType);
};

// Global error handlers for uncaught exceptions
export const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
      error: error.message,
      stack: error.stack
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
      reason: reason instanceof Error ? reason.message : reason,
      stack: reason instanceof Error ? reason.stack : 'No stack trace',
      promise: promise.toString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });

  // Handle SIGTERM
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};

export default {
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  MarketDataError,
  CalculationError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  catchAsync,
  createValidationError,
  handleDatabaseError,
  handleMarketDataError,
  handleCalculationError,
  setupGlobalErrorHandlers
};