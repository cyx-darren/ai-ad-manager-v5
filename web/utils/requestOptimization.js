// web/utils/requestOptimization.js
/**
 * Request optimization utilities for improving performance
 */

/**
 * Creates a debounced version of an async function
 * Prevents rapid repeated calls by waiting for a delay before executing
 */
export function debounceAsync(func, delay = 300) {
  let timeoutId;
  let pendingPromise = null;

  return function (...args) {
    // Clear any existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create a new promise for this call
    if (!pendingPromise) {
      pendingPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await func.apply(this, args);
            resolve(result);
          } catch (error) {
            reject(error);
          } finally {
            pendingPromise = null;
            timeoutId = null;
          }
        }, delay);
      });
    }

    return pendingPromise;
  };
}

/**
 * Creates a throttled version of an async function
 * Ensures function is not called more than once per specified interval
 */
export function throttleAsync(func, interval = 1000) {
  let lastCallTime = 0;
  let pendingPromise = null;

  return async function (...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall >= interval) {
      lastCallTime = now;
      return func.apply(this, args);
    }

    // If called too soon, return pending promise or create new one
    if (!pendingPromise) {
      const waitTime = interval - timeSinceLastCall;
      pendingPromise = new Promise((resolve) => {
        setTimeout(async () => {
          lastCallTime = Date.now();
          const result = await func.apply(this, args);
          pendingPromise = null;
          resolve(result);
        }, waitTime);
      });
    }

    return pendingPromise;
  };
}

/**
 * Batch multiple requests into a single call
 * Useful for aggregating multiple data fetches
 */
export class RequestBatcher {
  constructor(batchFunction, delay = 50, maxBatchSize = 10) {
    this.batchFunction = batchFunction;
    this.delay = delay;
    this.maxBatchSize = maxBatchSize;
    this.queue = [];
    this.timeoutId = null;
  }

  add(item) {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });

      // Process immediately if batch is full
      if (this.queue.length >= this.maxBatchSize) {
        this.processBatch();
      } else {
        // Otherwise, schedule batch processing
        this.scheduleBatch();
      }
    });
  }

  scheduleBatch() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.processBatch();
    }, this.delay);
  }

  async processBatch() {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, this.maxBatchSize);
    const items = batch.map(b => b.item);

    try {
      const results = await this.batchFunction(items);
      
      // Resolve individual promises with their results
      batch.forEach((b, index) => {
        b.resolve(results[index]);
      });
    } catch (error) {
      // Reject all promises in the batch
      batch.forEach(b => {
        b.reject(error);
      });
    }

    // Process remaining items if any
    if (this.queue.length > 0) {
      this.scheduleBatch();
    }
  }
}

/**
 * Cache API responses in memory with TTL
 */
export class ResponseCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  generateKey(url, options = {}) {
    return `${url}:${JSON.stringify(options)}`;
  }

  get(url, options) {
    const key = this.generateKey(url, options);
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < this.ttl) {
      console.log(`[Cache HIT] ${url}`);
      return cached.data;
    }

    if (cached) {
      this.cache.delete(key);
    }

    return null;
  }

  set(url, options, data) {
    const key = this.generateKey(url, options);
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean up old entries
    this.cleanup();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

// Create a singleton instance for the app
export const apiCache = new ResponseCache();

/**
 * Fetch with caching support
 */
export async function fetchWithCache(url, options = {}) {
  // Check cache first
  const cached = apiCache.get(url, options);
  if (cached) {
    return cached;
  }

  // Make the request
  const response = await fetch(url, options);
  const data = await response.json();

  // Cache successful responses
  if (response.ok) {
    apiCache.set(url, options, data);
  }

  return data;
}