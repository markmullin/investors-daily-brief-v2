import errorHandler from '../utils/errorHandler.js';

export default function errorMiddleware(err, req, res, next) {
  // Log the error with context
  const errorLog = errorHandler.logError(err, {
    method: req.method,
    url: req.url,
    params: req.params,
    query: req.query,
    body: req.body,
    headers: req.headers
  });
  
  // Determine the error type and create appropriate response
  let errorResponse;
  
  // Check if it's an API error
  if (err.isAxiosError) {
    const apiName = err.config?.baseURL?.includes('eod') ? 'EOD Historical Data' :
                   err.config?.baseURL?.includes('brave') ? 'Brave Search' :
                   err.config?.baseURL?.includes('mistral') ? 'Mistral AI' :
                   'External API';
    
    errorResponse = errorHandler.handleApiError(err, apiName);
  } 
  // Check for specific error codes
  else if (err.code === 'INVALID_SYMBOL') {
    errorResponse = errorHandler.createErrorResponse('INVALID_SYMBOL', {
      details: err.message
    });
  } 
  else if (err.code === 'NO_DATA') {
    errorResponse = errorHandler.createErrorResponse('NO_DATA_AVAILABLE', {
      details: err.message
    });
  }
  // Handle timeout errors
  else if (err.timeout || err.code === 'ECONNABORTED') {
    errorResponse = errorHandler.createErrorResponse('NETWORK_TIMEOUT');
  }
  // Default error handling
  else {
    errorResponse = {
      error: true,
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      userMessage: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred. Please try again.'
        : err.message,
      severity: 'error',
      timestamp: new Date().toISOString()
    };
  }
  
  // Set appropriate status code
  const statusCode = err.status || err.statusCode || 
                    (err.response && err.response.status) || 
                    500;
  
  // Add request ID for tracking
  errorResponse.requestId = req.id || Date.now().toString();
  
  // In development, add stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}