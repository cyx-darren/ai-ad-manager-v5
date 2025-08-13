// src/utils/errorTracker.js
/**
 * Simple error tracking utility
 * Alternative to Sentry for basic error monitoring
 */

class ErrorTracker {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // Keep last 100 errors
    this.enabled = process.env.NODE_ENV === 'production';
  }

  /**
   * Log an error with context
   */
  logError(error, context = {}) {
    if (!this.enabled) {
      console.error('[ErrorTracker]', error, context);
      return;
    }

    const errorData = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: error.message || error.toString(),
      stack: error.stack,
      type: error.name || 'Error',
      context: {
        ...context,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
        url: typeof window !== 'undefined' ? window.location.href : context.url,
        userId: context.userId || 'anonymous'
      },
      level: context.level || 'error'
    };

    this.errors.push(errorData);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorTracker]', errorData);
    }

    // Send to server if configured
    this.sendToServer(errorData);
  }

  /**
   * Log a warning
   */
  logWarning(message, context = {}) {
    this.logError(new Error(message), { ...context, level: 'warning' });
  }

  /**
   * Log info message
   */
  logInfo(message, context = {}) {
    this.logError(new Error(message), { ...context, level: 'info' });
  }

  /**
   * Generate unique error ID
   */
  generateErrorId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Send error to server endpoint
   */
  async sendToServer(errorData) {
    try {
      // Only send in production
      if (process.env.NODE_ENV !== 'production') return;

      const endpoint = process.env.ERROR_TRACKING_ENDPOINT || '/api/errors';
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      });
    } catch (e) {
      // Fail silently to avoid recursive errors
      console.warn('Failed to send error to server:', e.message);
    }
  }

  /**
   * Get error statistics
   */
  getStats() {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    const dayAgo = now - (24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(e => new Date(e.timestamp).getTime() > hourAgo);
    const dailyErrors = this.errors.filter(e => new Date(e.timestamp).getTime() > dayAgo);

    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      dailyErrors: dailyErrors.length,
      errorsByType: this.getErrorsByType(),
      errorsByLevel: this.getErrorsByLevel()
    };
  }

  /**
   * Get errors grouped by type
   */
  getErrorsByType() {
    return this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get errors grouped by level
   */
  getErrorsByLevel() {
    return this.errors.reduce((acc, error) => {
      acc[error.level] = (acc[error.level] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    return this.errors
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
  }

  /**
   * Set up global error handlers
   */
  setupGlobalHandlers() {
    // Handle unhandled promises
    if (typeof process !== 'undefined') {
      process.on('unhandledRejection', (reason, promise) => {
        this.logError(reason, {
          type: 'unhandledRejection',
          promise: promise.toString()
        });
      });

      process.on('uncaughtException', (error) => {
        this.logError(error, {
          type: 'uncaughtException'
        });
      });
    }

    // Handle browser errors
    if (typeof window !== 'undefined') {
      window.onerror = (message, source, lineno, colno, error) => {
        this.logError(error || new Error(message), {
          type: 'windowError',
          source,
          lineno,
          colno
        });
      };

      window.onunhandledrejection = (event) => {
        this.logError(event.reason, {
          type: 'unhandledPromise'
        });
      };
    }
  }
}

// Create singleton instance
const errorTracker = new ErrorTracker();

// Set up global handlers
errorTracker.setupGlobalHandlers();

export default errorTracker;
export { ErrorTracker };