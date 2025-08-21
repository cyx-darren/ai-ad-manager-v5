import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { GoogleAnalyticsCore } from '../core/analytics-core.js';
import { verifySupabaseToken } from './middleware/auth.js';
import { cacheMiddleware, getCacheStats } from './middleware/cache.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { performanceMiddleware, getPerformanceStats } from './middleware/performance.js';
import { paginationMiddleware } from './middleware/pagination.js';
import { apiLogger, requestLogger } from '../utils/logger.js';

// Import route modules
import analyticsRoutes from './routes/analytics.js';
import uploadRoutes from './routes/upload.js';
import dashboardRoutes from './routes/dashboard.js';
import googleAdsRoutes from './routes/google-ads.js';

// Load environment variables
dotenv.config();

class APIServer {
  constructor() {
    this.app = express();
    this.port = process.env.API_PORT || 5000;
    this.analyticsCore = new GoogleAnalyticsCore();
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Compression middleware - should be first
    this.app.use(compression({
      level: 6, // Good balance between compression ratio and speed
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req, res) => {
        // Don't compress responses with this request header
        if (req.headers['x-no-compression']) {
          return false
        }
        // Use compression filter
        return compression.filter(req, res)
      }
    }));

    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // requests per window
      message: {
        error: 'Too many requests from this IP',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use(requestLogger(apiLogger));
    
    // Performance monitoring middleware
    this.app.use(performanceMiddleware);
    
    // Pagination middleware for API routes
    this.app.use('/api/', paginationMiddleware(25, 100)); // Default 25 items, max 100

    // Cache middleware for GET requests (improves performance)
    this.app.use('/api/analytics', cacheMiddleware);
    this.app.use('/api/dashboard', cacheMiddleware);

    // Make analytics core available to routes
    this.app.use((req, res, next) => {
      req.analyticsCore = this.analyticsCore;
      next();
    });
  }

  initializeRoutes() {
    // Cache stats endpoint
    this.app.get('/api/cache/stats', (req, res) => {
      res.json(getCacheStats());
    });

    // Performance stats endpoint
    this.app.get('/api/performance', (req, res) => {
      const stats = getPerformanceStats();
      res.json({
        timestamp: new Date().toISOString(),
        ...stats
      });
    });

    // Error tracking endpoint
    this.app.post('/api/errors', (req, res) => {
      const errorData = req.body;
      
      // Log error server-side
      console.error('[CLIENT ERROR]', {
        timestamp: errorData.timestamp,
        message: errorData.message,
        type: errorData.type,
        url: errorData.context?.url,
        userId: errorData.context?.userId
      });
      
      // In production, you might want to store these in a database
      // For now, we'll just acknowledge receipt
      res.json({ success: true, id: errorData.id });
    });

    // Health check endpoint
    this.app.get('/api/health', async (req, res) => {
      try {
        // Skip analytics core test for now
        // await this.analyticsCore.initialize();
        
        const health = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          version: '1.0.0',
          services: {
            analyticsCore: 'connected',
            supabase: 'connected',
          },
          memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          }
        };

        res.status(200).json(health);
      } catch (error) {
        const health = {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message,
          services: {
            analyticsCore: 'disconnected',
            supabase: 'unknown',
          }
        };

        res.status(503).json(health);
      }
    });

    // Dashboard endpoints are handled by dashboardRoutes

    // API routes
    this.app.use('/api/upload', uploadRoutes);
    this.app.use('/api/dashboard', dashboardRoutes);
    this.app.use('/api/google-ads', googleAdsRoutes);
    // this.app.use('/api/analytics', analyticsRoutes); // temporarily disabled

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        name: 'Google Analytics MCP Dashboard API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: 'GET /api/health',
          analytics: 'GET /api/analytics/*',
          dashboard: 'GET /api/dashboard/metrics (protected)',
        },
        documentation: '/api/docs (not implemented)',
      });
    });

    // 404 handler for API routes
    this.app.use('/api/*', notFoundHandler);
  }

  initializeErrorHandling() {
    // Use the comprehensive error handler middleware
    this.app.use(errorHandler);

    // Graceful shutdown handlers
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      this.server?.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      this.server?.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  }

  async start() {
    try {
      // Skip analytics core initialization for now
      apiLogger.info('Skipping Google Analytics Core initialization for testing...');

      // Start HTTP server
      this.server = this.app.listen(this.port, () => {
        apiLogger.info(`API Server running on port ${this.port}`);
        apiLogger.info(`Health check: http://localhost:${this.port}/api/health`);
        apiLogger.info(`Cache stats: http://localhost:${this.port}/api/cache/stats`);
        apiLogger.info(`Upload API: http://localhost:${this.port}/api/upload`);
        apiLogger.info(`Dashboard API: http://localhost:${this.port}/api/dashboard`);
        apiLogger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      return this.server;
    } catch (error) {
      apiLogger.error('Failed to start API server', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => {
        this.server.close(resolve);
      });
      console.log('🛑 API Server stopped');
    }
  }
}

// Create and export server instance
const apiServer = new APIServer();

// Start server if this file is run directly
// Check if this module is the main module
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].endsWith('server.js')) {
  apiServer.start().catch(console.error);
}

export default apiServer;
export { APIServer };