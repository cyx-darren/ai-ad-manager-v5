// src/utils/logger.js
/**
 * Logging utility with different levels and formatting
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

const LOG_COLORS = {
  ERROR: '\x1b[31m', // Red
  WARN: '\x1b[33m',  // Yellow
  INFO: '\x1b[36m',  // Cyan
  DEBUG: '\x1b[32m', // Green
  TRACE: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'
};

class Logger {
  constructor(context = 'App', level = 'INFO') {
    this.context = context;
    this.level = LOG_LEVELS[level.toUpperCase()] ?? LOG_LEVELS.INFO;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Format log message with timestamp and context
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const color = this.isDevelopment ? LOG_COLORS[level] : '';
    const reset = this.isDevelopment ? LOG_COLORS.RESET : '';
    
    let formattedMessage = `${color}[${timestamp}] [${level}] [${this.context}] ${message}${reset}`;
    
    if (data) {
      formattedMessage += `\n${color}Data: ${JSON.stringify(data, null, 2)}${reset}`;
    }
    
    return { formattedMessage, timestamp, level, context: this.context, message, data };
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    return LOG_LEVELS[level] <= this.level;
  }

  /**
   * Log error message
   */
  error(message, data = null) {
    if (!this.shouldLog('ERROR')) return;
    
    const formatted = this.formatMessage('ERROR', message, data);
    console.error(formatted.formattedMessage);
    
    // Send to error tracking
    if (typeof window !== 'undefined' && window.errorTracker) {
      window.errorTracker.logError(new Error(message), data);
    }
    
    return formatted;
  }

  /**
   * Log warning message
   */
  warn(message, data = null) {
    if (!this.shouldLog('WARN')) return;
    
    const formatted = this.formatMessage('WARN', message, data);
    console.warn(formatted.formattedMessage);
    
    return formatted;
  }

  /**
   * Log info message
   */
  info(message, data = null) {
    if (!this.shouldLog('INFO')) return;
    
    const formatted = this.formatMessage('INFO', message, data);
    console.info(formatted.formattedMessage);
    
    return formatted;
  }

  /**
   * Log debug message
   */
  debug(message, data = null) {
    if (!this.shouldLog('DEBUG')) return;
    
    const formatted = this.formatMessage('DEBUG', message, data);
    console.debug(formatted.formattedMessage);
    
    return formatted;
  }

  /**
   * Log trace message
   */
  trace(message, data = null) {
    if (!this.shouldLog('TRACE')) return;
    
    const formatted = this.formatMessage('TRACE', message, data);
    console.trace(formatted.formattedMessage);
    
    return formatted;
  }

  /**
   * Log performance metrics
   */
  performance(operation, duration, data = null) {
    const message = `${operation} completed in ${duration}ms`;
    
    if (duration > 1000) {
      this.warn(message, data);
    } else {
      this.info(message, data);
    }
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext) {
    const childContext = `${this.context}:${additionalContext}`;
    const child = new Logger(childContext);
    child.level = this.level;
    return child;
  }

  /**
   * Time a function execution
   */
  time(label) {
    const start = Date.now();
    
    return {
      end: (data = null) => {
        const duration = Date.now() - start;
        this.performance(label, duration, data);
        return duration;
      }
    };
  }

  /**
   * Log HTTP request
   */
  request(method, url, statusCode, duration, data = null) {
    const message = `${method} ${url} ${statusCode} - ${duration}ms`;
    
    if (statusCode >= 400) {
      this.error(message, data);
    } else if (statusCode >= 300) {
      this.warn(message, data);
    } else {
      this.info(message, data);
    }
  }
}

/**
 * Request logging middleware for Express
 */
export function requestLogger(logger) {
  return (req, res, next) => {
    const start = Date.now();
    const { method, path, ip } = req;
    
    // Log request start
    logger.debug(`Incoming ${method} ${path}`, { ip, userAgent: req.get('User-Agent') });
    
    // Capture response
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.request(method, path, res.statusCode, duration, {
        ip,
        contentLength: res.get('Content-Length'),
        userAgent: req.get('User-Agent')
      });
    });
    
    next();
  };
}

// Create default logger instances
export const apiLogger = new Logger('API', process.env.LOG_LEVEL || 'INFO');
export const dbLogger = new Logger('Database', process.env.LOG_LEVEL || 'INFO');
export const authLogger = new Logger('Auth', process.env.LOG_LEVEL || 'INFO');
export const analyticsLogger = new Logger('Analytics', process.env.LOG_LEVEL || 'INFO');

export default Logger;