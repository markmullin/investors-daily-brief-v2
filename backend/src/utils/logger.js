import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory
const logsDir = path.join(__dirname, '../../logs');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let msg = `${timestamp} [${service || 'app'}] ${level}: ${message}`;
    
    // Add metadata if present
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    if (metaStr) {
      msg += `\n${metaStr}`;
    }
    
    return msg;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'market-dashboard-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    }),
    
    // API request log
    new winston.transports.File({
      filename: path.join(logsDir, 'api.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat,
    level: 'debug'
  }));
}

// Create specific loggers for different components
export const apiLogger = logger.child({ component: 'api' });
export const dbLogger = logger.child({ component: 'database' });
export const authLogger = logger.child({ component: 'auth' });
export const marketDataLogger = logger.child({ component: 'market-data' });
export const portfolioLogger = logger.child({ component: 'portfolio' });
export const calculationLogger = logger.child({ component: 'calculations' });

// Log levels helper
export const logLevels = {
  error: 'error',
  warn: 'warn', 
  info: 'info',
  http: 'http',
  verbose: 'verbose',
  debug: 'debug',
  silly: 'silly'
};

// Structured logging helpers
export const logApiRequest = (req, res, responseTime) => {
  apiLogger.info('API Request', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id,
    contentLength: res.get('Content-Length')
  });
};

export const logApiError = (error, req, res) => {
  apiLogger.error('API Error', {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
};

export const logDatabaseOperation = (operation, table, duration, success = true, error = null) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`,
    success
  };
  
  if (error) {
    logData.error = error.message;
    logData.stack = error.stack;
    dbLogger.error('Database Operation Failed', logData);
  } else {
    dbLogger.info('Database Operation', logData);
  }
};

export const logMarketDataFetch = (symbol, dataType, source, duration, success = true, error = null) => {
  const logData = {
    symbol,
    dataType,
    source,
    duration: `${duration}ms`,
    success
  };
  
  if (error) {
    logData.error = error.message;
    marketDataLogger.error('Market Data Fetch Failed', logData);
  } else {
    marketDataLogger.info('Market Data Fetched', logData);
  }
};

export const logCalculationPerformance = (calculationType, inputSize, duration, accuracy = null) => {
  calculationLogger.info('Financial Calculation', {
    calculationType,
    inputSize,
    duration: `${duration}ms`,
    accuracy: accuracy ? `${accuracy}%` : null
  });
};

export const logSecurityEvent = (eventType, userId, details) => {
  authLogger.warn('Security Event', {
    eventType,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Performance monitoring helper
export const createPerformanceTimer = (component, operation) => {
  const start = Date.now();
  
  return {
    end: (success = true, error = null) => {
      const duration = Date.now() - start;
      
      const logData = {
        component,
        operation,
        duration: `${duration}ms`,
        success
      };
      
      if (error) {
        logData.error = error.message;
        logger.error('Performance Timer', logData);
      } else {
        logger.info('Performance Timer', logData);
      }
      
      return duration;
    }
  };
};

// Memory usage logger
export const logMemoryUsage = () => {
  const memUsage = process.memoryUsage();
  logger.info('Memory Usage', {
    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(memUsage.external / 1024 / 1024)} MB`
  });
};

// System health logger
export const logSystemHealth = (healthStatus) => {
  logger.info('System Health Check', healthStatus);
};

// Export main logger as default
export default logger;