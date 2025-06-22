// Logging middleware
import morgan from 'morgan';

// Create custom logging format
const customFormat = ':method :url :status :response-time ms - :res[content-length]';

// Create logging middleware
export const loggingMiddleware = morgan(customFormat, {
  skip: (req, res) => {
    // Skip logging for health checks
    return req.path === '/health';
  },
  stream: {
    write: (message) => {
      console.log(message.trim());
    }
  }
});

// Export as default as well
export default loggingMiddleware;