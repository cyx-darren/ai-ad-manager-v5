/**
 * Debounce function to limit the rate of function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to execute immediately on the leading edge
 * @returns {Function} - The debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }
    
    const callNow = immediate && !timeout
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func(...args)
  }
}

/**
 * Throttle function to limit the rate of function calls
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} - The throttled function
 */
export function throttle(func, limit) {
  let inThrottle
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Memoization utility for expensive computations
 * @param {Function} fn - The function to memoize
 * @param {Function} keySelector - Function to generate cache key from arguments
 * @returns {Function} - The memoized function
 */
export function memoize(fn, keySelector = (...args) => JSON.stringify(args)) {
  const cache = new Map()
  
  return function memoized(...args) {
    const key = keySelector(...args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}