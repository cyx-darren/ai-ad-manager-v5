// src/api/middleware/cache.js
// Cache middleware for API responses to improve performance

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache statistics for monitoring
const cacheStats = {
  hits: 0,
  misses: 0,
  totalRequests: 0
};

/**
 * Middleware to cache API responses
 * Caches GET requests for CACHE_TTL milliseconds
 */
export const cacheMiddleware = (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  // Generate cache key from path and query params
  const key = `${req.path}:${JSON.stringify(req.query)}`;
  const cached = cache.get(key);
  
  cacheStats.totalRequests++;
  
  // Check if cached data exists and is not expired
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    cacheStats.hits++;
    console.log(`[CACHE HIT] ${req.path} - Hit rate: ${((cacheStats.hits / cacheStats.totalRequests) * 100).toFixed(2)}%`);
    
    // Add cache headers
    res.set('X-Cache', 'HIT');
    res.set('X-Cache-TTL', Math.floor((CACHE_TTL - (Date.now() - cached.timestamp)) / 1000));
    
    return res.json(cached.data);
  }
  
  cacheStats.misses++;
  console.log(`[CACHE MISS] ${req.path}`);
  
  // Store original json method
  const originalJson = res.json;
  
  // Override json method to cache the response
  res.json = function(data) {
    // Only cache successful responses
    if (res.statusCode === 200) {
      cache.set(key, { 
        data, 
        timestamp: Date.now() 
      });
      
      // Clean up old cache entries periodically
      if (cache.size > 100) {
        cleanupCache();
      }
    }
    
    // Add cache headers
    res.set('X-Cache', 'MISS');
    res.set('X-Cache-TTL', CACHE_TTL / 1000);
    
    // Call original json method
    originalJson.call(this, data);
  };
  
  next();
};

/**
 * Clean up expired cache entries
 */
function cleanupCache() {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
      deletedCount++;
    }
  }
  
  console.log(`[CACHE CLEANUP] Removed ${deletedCount} expired entries. Current size: ${cache.size}`);
}

/**
 * Clear all cache entries
 */
export function clearCache() {
  const size = cache.size;
  cache.clear();
  console.log(`[CACHE CLEAR] Cleared ${size} entries`);
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    ...cacheStats,
    cacheSize: cache.size,
    hitRate: cacheStats.totalRequests > 0 
      ? ((cacheStats.hits / cacheStats.totalRequests) * 100).toFixed(2) + '%'
      : '0%'
  };
}

// Clear cache periodically (every hour)
setInterval(() => {
  cleanupCache();
}, 60 * 60 * 1000);

export default cacheMiddleware;