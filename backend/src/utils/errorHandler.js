// Comprehensive error handler for the dashboard
class DashboardErrorHandler {
  constructor() {
    this.errorCodes = {
      // API Errors
      EOD_API_ERROR: {
        code: 'EOD_001',
        message: 'Unable to fetch market data from EOD Historical Data',
        userMessage: 'Market data temporarily unavailable. Please try again later.',
        severity: 'warning'
      },
      BRAVE_API_ERROR: {
        code: 'BRAVE_001',
        message: 'Unable to fetch news insights from Brave Search',
        userMessage: 'News insights are temporarily unavailable.',
        severity: 'info'
      },
      MISTRAL_API_ERROR: {
        code: 'AI_001',
        message: 'Unable to generate AI market analysis',
        userMessage: 'AI analysis is temporarily unavailable.',
        severity: 'info'
      },
      
      // Network Errors
      NETWORK_TIMEOUT: {
        code: 'NET_001',
        message: 'Network request timed out',
        userMessage: 'Connection timeout. Please check your internet connection.',
        severity: 'error'
      },
      CORS_ERROR: {
        code: 'NET_002',
        message: 'CORS policy blocked the request',
        userMessage: 'Unable to access external resources. Please contact support.',
        severity: 'error'
      },
      
      // Data Errors
      INVALID_SYMBOL: {
        code: 'DATA_001',
        message: 'Invalid stock symbol provided',
        userMessage: 'Invalid stock symbol. Please check and try again.',
        severity: 'warning'
      },
      NO_DATA_AVAILABLE: {
        code: 'DATA_002',
        message: 'No data available for the requested period',
        userMessage: 'No data available for this time period.',
        severity: 'info'
      },
      
      // Service Errors
      MONITORING_UNAVAILABLE: {
        code: 'SVC_001',
        message: 'Market monitoring service is unavailable',
        userMessage: 'Real-time monitoring is temporarily unavailable.',
        severity: 'warning'
      },
      WEBSOCKET_ERROR: {
        code: 'SVC_002',
        message: 'WebSocket connection failed',
        userMessage: 'Real-time updates are temporarily unavailable.',
        severity: 'warning'
      }
    };
  }
  
  /**
   * Handle API errors with appropriate user feedback
   */
  handleApiError(error, apiName = 'External API') {
    console.error(`${apiName} Error:`, error);
    
    // Check for specific error patterns
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      // Handle specific status codes
      if (status === 401 || status === 403) {
        return {
          error: true,
          code: 'AUTH_ERROR',
          message: `Authentication failed for ${apiName}`,
          userMessage: 'API authentication error. Please contact support.',
          severity: 'error'
        };
      } else if (status === 429) {
        return {
          error: true,
          code: 'RATE_LIMIT',
          message: `Rate limit exceeded for ${apiName}`,
          userMessage: 'Too many requests. Please wait a moment and try again.',
          severity: 'warning'
        };
      } else if (status === 422) {
        return {
          error: true,
          code: 'INVALID_REQUEST',
          message: `Invalid request to ${apiName}`,
          userMessage: 'Invalid request parameters. Please try again.',
          severity: 'warning'
        };
      } else if (status >= 500) {
        return {
          error: true,
          code: 'SERVER_ERROR',
          message: `${apiName} server error`,
          userMessage: `${apiName} is experiencing issues. Please try again later.`,
          severity: 'error'
        };
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return this.errorCodes.NETWORK_TIMEOUT;
    }
    
    // Default error response
    return {
      error: true,
      code: 'UNKNOWN_ERROR',
      message: error.message,
      userMessage: `Unable to connect to ${apiName}. Please try again later.`,
      severity: 'error'
    };
  }
  
  /**
   * Create user-friendly error response
   */
  createErrorResponse(errorCode, additionalInfo = {}) {
    const errorDef = this.errorCodes[errorCode] || {
      code: 'UNKNOWN',
      message: 'Unknown error occurred',
      userMessage: 'An unexpected error occurred. Please try again.',
      severity: 'error'
    };
    
    return {
      error: true,
      ...errorDef,
      ...additionalInfo,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Log error with context
   */
  logError(error, context = {}) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code
      },
      context,
      environment: process.env.NODE_ENV
    };
    
    // In production, you might want to send this to a logging service
    console.error('Dashboard Error:', JSON.stringify(errorLog, null, 2));
    
    return errorLog;
  }
  
  /**
   * Handle graceful degradation for services
   */
  handleServiceDegradation(serviceName, fallbackData = null) {
    console.warn(`Service degradation: ${serviceName} is unavailable`);
    
    return {
      data: fallbackData,
      degraded: true,
      service: serviceName,
      message: `${serviceName} is temporarily unavailable. Showing cached or default data.`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create frontend error notification
   */
  createNotification(error) {
    return {
      id: Date.now().toString(),
      type: error.severity || 'error',
      title: error.userMessage || 'An error occurred',
      message: error.details || '',
      duration: error.severity === 'error' ? 0 : 5000, // Errors stay until dismissed
      timestamp: new Date().toISOString()
    };
  }
}

export default new DashboardErrorHandler();
