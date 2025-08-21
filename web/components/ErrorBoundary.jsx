'use client'

import { Component } from 'react'
import { AlertCircle, RefreshCcw, Home } from 'lucide-react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorId: null
    }
  }
  
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    }
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
    
    // Send error to tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }
  
  logErrorToService = (error, errorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      errorId: this.state.errorId
    }
    
    // Send to API error tracking endpoint
    fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'javascript_error',
        error: errorData,
        context: {
          url: window.location.href,
          timestamp: new Date().toISOString()
        }
      })
    }).catch(err => {
      console.error('Failed to log error to service:', err)
    })
  }
  
  handleRefresh = () => {
    window.location.reload()
  }
  
  handleGoHome = () => {
    window.location.href = '/dashboard'
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="mb-6">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Oops! Something went wrong
                </h1>
                <p className="text-gray-600 mb-4">
                  We're sorry for the inconvenience. An unexpected error occurred.
                </p>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                    <h3 className="text-sm font-medium text-red-800 mb-2">
                      Error Details (Development Only):
                    </h3>
                    <p className="text-xs text-red-700 font-mono break-all">
                      {this.state.error.message}
                    </p>
                    {this.state.errorId && (
                      <p className="text-xs text-red-600 mt-2">
                        Error ID: {this.state.errorId}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                <button 
                  onClick={this.handleRefresh}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Refresh Page
                </button>
                
                <button 
                  onClick={this.handleGoHome}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </button>
              </div>
              
              <div className="mt-6 text-xs text-gray-500">
                <p>If this problem persists, please contact support.</p>
                {this.state.errorId && (
                  <p className="mt-1">Reference ID: {this.state.errorId}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    }
    
    return this.props.children
  }
}

export default ErrorBoundary