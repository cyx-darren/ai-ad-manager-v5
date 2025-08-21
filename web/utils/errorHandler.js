// Client-side error handling utilities

// Handle API errors with user-friendly messages
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const errorData = error.response.data?.error
    const status = error.response.status
    
    if (status === 401) {
      return 'Your session has expired. Please log in again.'
    } else if (status === 403) {
      return 'You do not have permission to perform this action.'
    } else if (status === 404) {
      return 'The requested resource was not found.'
    } else if (status === 413) {
      return 'The file you are trying to upload is too large.'
    } else if (status === 429) {
      return 'Too many requests. Please try again later.'
    } else if (status >= 500) {
      return 'Server error occurred. Please try again later.'
    } else {
      return errorData?.message || `Request failed with status ${status}`
    }
  } else if (error.request) {
    // Request made but no response received
    return 'Network error - please check your internet connection and try again.'
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred'
  }
}

// Validate form data
export const validateFormData = (data, rules) => {
  const errors = {}
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field]
    
    if (fieldRules.required && (!value || value.trim() === '')) {
      errors[field] = `${field} is required`
      continue
    }
    
    if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
      errors[field] = `${field} must be at least ${fieldRules.minLength} characters`
    }
    
    if (value && fieldRules.maxLength && value.length > fieldRules.maxLength) {
      errors[field] = `${field} must be no more than ${fieldRules.maxLength} characters`
    }
    
    if (value && fieldRules.pattern && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.message || `${field} format is invalid`
    }
    
    if (value && fieldRules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field] = 'Please enter a valid email address'
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Create error context for logging
export const createErrorContext = (additionalInfo = {}) => {
  return {
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    ...additionalInfo
  }
}

// Log client-side errors to API
export const logClientError = async (error, context = {}) => {
  try {
    const errorData = {
      type: 'client_error',
      message: error.message || 'Unknown error',
      stack: error.stack,
      context: createErrorContext(context),
      id: Math.random().toString(36).substr(2, 9)
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050'
    
    await fetch(`${apiUrl}/api/errors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    })
  } catch (logError) {
    console.error('Failed to log error to server:', logError)
  }
}

// Retry function with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Don't retry for certain error types
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error
      }
      
      // Exponential backoff: 1s, 2s, 4s...
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError
}

// Safe async handler for React components
export const safeAsync = (asyncFn) => {
  return async (...args) => {
    try {
      return await asyncFn(...args)
    } catch (error) {
      console.error('Async operation failed:', error)
      logClientError(error, { operation: asyncFn.name })
      throw error
    }
  }
}

// Error notification helper
export const showErrorNotification = (message, duration = 5000) => {
  // This would integrate with a toast notification system
  // For now, we'll just log to console and could show an alert
  console.error('User Error:', message)
  
  if (typeof window !== 'undefined') {
    // You could integrate with react-hot-toast or another notification library here
    console.warn('Error notification:', message)
  }
}

// File upload error handler
export const handleFileUploadError = (error) => {
  if (error.code === 'file-too-large') {
    return 'File is too large. Maximum size is 10MB.'
  } else if (error.code === 'file-invalid-type') {
    return 'Only PDF files are allowed.'
  } else if (error.code === 'too-many-files') {
    return 'Only one file can be uploaded at a time.'
  } else {
    return 'File upload failed. Please try again.'
  }
}

// Authentication error handler
export const handleAuthError = (error) => {
  const errorMessage = error.message?.toLowerCase() || ''
  
  if (errorMessage.includes('invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  } else if (errorMessage.includes('email not confirmed')) {
    return 'Please check your email and click the confirmation link before logging in.'
  } else if (errorMessage.includes('too many requests')) {
    return 'Too many login attempts. Please wait a few minutes before trying again.'
  } else if (errorMessage.includes('user not found')) {
    return 'No account found with this email address.'
  } else {
    return 'Login failed. Please try again.'
  }
}

export default {
  handleApiError,
  validateFormData,
  createErrorContext,
  logClientError,
  retryWithBackoff,
  safeAsync,
  showErrorNotification,
  handleFileUploadError,
  handleAuthError
}