import { register, Counter, Histogram, Gauge, Registry } from 'prom-client';

// Create a custom registry
const metricsRegistry = new Registry();

// Enable default metrics (CPU, memory, etc.)
import { collectDefaultMetrics } from 'prom-client';
collectDefaultMetrics({ register: metricsRegistry });

// HTTP Request Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [metricsRegistry]
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry]
});

// Business Metrics
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [metricsRegistry]
});

export const totalSpendProcessed = new Counter({
  name: 'total_spend_processed',
  help: 'Total advertising spend processed',
  labelNames: ['currency'],
  registers: [metricsRegistry]
});

export const pdfUploadsTotal = new Counter({
  name: 'pdf_uploads_total',
  help: 'Total number of PDF uploads',
  labelNames: ['status'],
  registers: [metricsRegistry]
});

export const googleAdsApiCalls = new Counter({
  name: 'google_ads_api_calls_total',
  help: 'Total Google Ads API calls',
  labelNames: ['endpoint', 'status'],
  registers: [metricsRegistry]
});

export const googleAnalyticsApiCalls = new Counter({
  name: 'google_analytics_api_calls_total',
  help: 'Total Google Analytics API calls',
  labelNames: ['endpoint', 'status'],
  registers: [metricsRegistry]
});

// Cache Metrics
export const cacheHits = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
  registers: [metricsRegistry]
});

export const cacheMisses = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
  registers: [metricsRegistry]
});

export const cacheHitRate = new Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage',
  labelNames: ['cache_name'],
  registers: [metricsRegistry]
});

// Error Metrics
export const errorCounter = new Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'severity'],
  registers: [metricsRegistry]
});

// Database Metrics
export const databaseQueryDuration = new Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [metricsRegistry]
});

export const databaseConnections = new Gauge({
  name: 'database_connections_active',
  help: 'Number of active database connections',
  registers: [metricsRegistry]
});

// Performance Metrics
export const memoryUsage = new Gauge({
  name: 'nodejs_memory_usage_bytes',
  help: 'Node.js memory usage',
  labelNames: ['type'],
  registers: [metricsRegistry]
});

// Authentication Metrics
export const loginAttempts = new Counter({
  name: 'login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['status'],
  registers: [metricsRegistry]
});

export const activeSessionsGauge = new Gauge({
  name: 'active_sessions',
  help: 'Number of active user sessions',
  registers: [metricsRegistry]
});

// Google Analytics Metrics
export const gaLastSuccessfulFetch = new Gauge({
  name: 'ga_last_successful_fetch_timestamp',
  help: 'Timestamp of last successful Google Analytics data fetch',
  registers: [metricsRegistry]
});

// Middleware for Express to track HTTP metrics
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Intercept the response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const status = res.statusCode;
    
    // Record metrics
    httpRequestsTotal.labels(method, route, status).inc();
    httpRequestDuration.labels(method, route, status).observe(duration);
    
    // Update memory usage
    const memUsage = process.memoryUsage();
    memoryUsage.labels('rss').set(memUsage.rss);
    memoryUsage.labels('heapTotal').set(memUsage.heapTotal);
    memoryUsage.labels('heapUsed').set(memUsage.heapUsed);
    memoryUsage.labels('external').set(memUsage.external);
    
    originalEnd.apply(res, args);
  };
  
  next();
};

// Endpoint to expose metrics
export const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.end(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
};

// Helper functions to update business metrics
export const recordPdfUpload = (status) => {
  pdfUploadsTotal.labels(status).inc();
};

export const recordGoogleAdsApiCall = (endpoint, status) => {
  googleAdsApiCalls.labels(endpoint, status).inc();
};

export const recordGoogleAnalyticsApiCall = (endpoint, status) => {
  googleAnalyticsApiCalls.labels(endpoint, status).inc();
  if (status === 'success') {
    gaLastSuccessfulFetch.set(Date.now() / 1000);
  }
};

export const recordCacheHit = (cacheName) => {
  cacheHits.labels(cacheName).inc();
  updateCacheHitRate(cacheName);
};

export const recordCacheMiss = (cacheName) => {
  cacheMisses.labels(cacheName).inc();
  updateCacheHitRate(cacheName);
};

const updateCacheHitRate = (cacheName) => {
  const hits = cacheHits.labels(cacheName);
  const misses = cacheMisses.labels(cacheName);
  const total = hits + misses;
  if (total > 0) {
    const hitRate = hits / total;
    cacheHitRate.labels(cacheName).set(hitRate);
  }
};

export const recordError = (type, severity) => {
  errorCounter.labels(type, severity).inc();
};

export const recordDatabaseQuery = (queryType, table, duration) => {
  databaseQueryDuration.labels(queryType, table).observe(duration);
};

export const updateActiveUsers = (count) => {
  activeUsers.set(count);
};

export const updateDatabaseConnections = (count) => {
  databaseConnections.set(count);
};

export const recordLogin = (status) => {
  loginAttempts.labels(status).inc();
};

export const updateActiveSessions = (count) => {
  activeSessionsGauge.set(count);
};

export const recordSpend = (amount, currency = 'USD') => {
  totalSpendProcessed.labels(currency).inc(amount);
};

// Export the registry for testing
export { metricsRegistry };

export default {
  metricsMiddleware,
  metricsEndpoint,
  recordPdfUpload,
  recordGoogleAdsApiCall,
  recordGoogleAnalyticsApiCall,
  recordCacheHit,
  recordCacheMiss,
  recordError,
  recordDatabaseQuery,
  updateActiveUsers,
  updateDatabaseConnections,
  recordLogin,
  updateActiveSessions,
  recordSpend,
  metricsRegistry
};