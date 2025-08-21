/**
 * Performance monitoring middleware
 * Tracks API response times and performance metrics
 */

import { apiLogger } from '../../utils/logger.js'

// Store performance metrics in memory
const performanceMetrics = {
  requests: new Map(),
  stats: {
    totalRequests: 0,
    averageResponseTime: 0,
    slowRequests: 0,
    fastRequests: 0
  }
}

/**
 * Performance monitoring middleware
 */
export const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint()
  const startMemory = process.memoryUsage()

  // Store original res.end
  const originalEnd = res.end

  res.end = function(chunk, encoding) {
    // Calculate response time
    const endTime = process.hrtime.bigint()
    const responseTime = Number(endTime - startTime) / 1000000 // Convert to milliseconds
    const endMemory = process.memoryUsage()
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed

    // Track metrics
    trackPerformanceMetric(req, res, responseTime, memoryDelta)

    // Log slow requests
    if (responseTime > 1000) { // Slow if > 1 second
      apiLogger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode,
        memoryDelta: `${(memoryDelta / 1024 / 1024).toFixed(2)}MB`
      })
    }

    // Add performance headers
    res.set({
      'X-Response-Time': `${responseTime.toFixed(2)}ms`,
      'X-Memory-Usage': `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
    })

    // Call original end
    originalEnd.call(this, chunk, encoding)
  }

  next()
}

/**
 * Track performance metric
 */
function trackPerformanceMetric(req, res, responseTime, memoryDelta) {
  const route = `${req.method} ${req.route?.path || req.path}`
  
  // Update route-specific metrics
  if (!performanceMetrics.requests.has(route)) {
    performanceMetrics.requests.set(route, {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0
    })
  }

  const routeMetrics = performanceMetrics.requests.get(route)
  routeMetrics.count++
  routeMetrics.totalTime += responseTime
  routeMetrics.avgTime = routeMetrics.totalTime / routeMetrics.count
  routeMetrics.minTime = Math.min(routeMetrics.minTime, responseTime)
  routeMetrics.maxTime = Math.max(routeMetrics.maxTime, responseTime)
  
  if (res.statusCode >= 400) {
    routeMetrics.errors++
  }

  // Update global stats
  performanceMetrics.stats.totalRequests++
  
  if (responseTime > 500) {
    performanceMetrics.stats.slowRequests++
  } else {
    performanceMetrics.stats.fastRequests++
  }

  // Calculate rolling average
  const totalTime = Array.from(performanceMetrics.requests.values())
    .reduce((sum, metrics) => sum + metrics.totalTime, 0)
  const totalCount = Array.from(performanceMetrics.requests.values())
    .reduce((sum, metrics) => sum + metrics.count, 0)
  
  performanceMetrics.stats.averageResponseTime = totalTime / totalCount
}

/**
 * Get performance statistics
 */
export const getPerformanceStats = () => {
  const routes = Array.from(performanceMetrics.requests.entries()).map(([route, metrics]) => ({
    route,
    ...metrics,
    errorRate: metrics.count > 0 ? (metrics.errors / metrics.count) * 100 : 0
  }))

  return {
    summary: performanceMetrics.stats,
    routes: routes.sort((a, b) => b.avgTime - a.avgTime), // Sort by average response time
    memory: process.memoryUsage(),
    uptime: process.uptime()
  }
}

/**
 * Reset performance metrics
 */
export const resetPerformanceStats = () => {
  performanceMetrics.requests.clear()
  performanceMetrics.stats = {
    totalRequests: 0,
    averageResponseTime: 0,
    slowRequests: 0,
    fastRequests: 0
  }
}

export default performanceMiddleware