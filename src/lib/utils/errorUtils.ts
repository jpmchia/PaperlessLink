/**
 * Utility functions for error detection and user-friendly error messages
 */

export interface ErrorInfo {
  type: 'network' | 'backend-unavailable' | 'auth' | 'not-found' | 'server-error' | 'unknown'
  message: string
  userMessage: string
  actionable: boolean
  service?: 'paperless-link-service' | 'paperless-ngx' | 'unknown'
}

/**
 * Detects the type of error and provides user-friendly information
 */
export function detectError(error: any): ErrorInfo {
  // Network/connection errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Unable to connect to the backend service. Please check that the service is running and accessible.',
      actionable: true,
      service: 'unknown',
    }
  }

  // CORS errors (usually indicate backend is on different origin)
  if (error?.isCorsError || error?.message?.includes('CORS')) {
    return {
      type: 'network',
      message: error.message || 'CORS error',
      userMessage: 'Connection blocked due to CORS policy. The backend may be running on a different address. Please check your configuration.',
      actionable: true,
      service: 'unknown',
    }
  }

  // HTTP status-based errors
  if (error?.status) {
    const status = error.status

    if (status === 401 || status === 403) {
      return {
        type: 'auth',
        message: error.message || `HTTP ${status}`,
        userMessage: 'Authentication failed. Please check your credentials and try again.',
        actionable: true,
        service: 'unknown',
      }
    }

    if (status === 404) {
      // Check if it's a specific service endpoint
      const url = error?.url || error?.message || ''
      if (url.includes('custom_views') || url.includes('paperless-link-service')) {
        return {
          type: 'backend-unavailable',
          message: error.message || `HTTP ${status}`,
          userMessage: 'Paperless Link Service is not available. Please ensure the service is running and configured correctly.',
          actionable: true,
          service: 'paperless-link-service',
        }
      }
      return {
        type: 'not-found',
        message: error.message || `HTTP ${status}`,
        userMessage: 'The requested resource was not found.',
        actionable: false,
        service: 'unknown',
      }
    }

    if (status >= 500) {
      return {
        type: 'server-error',
        message: error.message || `HTTP ${status}`,
        userMessage: 'The server encountered an error. Please try again later.',
        actionable: false,
        service: 'unknown',
      }
    }
  }

  // Check error message for common patterns
  const errorMessage = error?.message || error?.toString() || 'Unknown error'

  if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
    return {
      type: 'network',
      message: errorMessage,
      userMessage: 'Network error: Unable to reach the backend service. Please check your network connection and ensure the service is running.',
      actionable: true,
      service: 'unknown',
    }
  }

  if (errorMessage.includes('paperless-link-service') || errorMessage.includes('Custom views API endpoint')) {
    return {
      type: 'backend-unavailable',
      message: errorMessage,
      userMessage: 'Paperless Link Service is not available. Please ensure the service is running on the correct address and port.',
      actionable: true,
      service: 'paperless-link-service',
    }
  }

  if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection refused')) {
    return {
      type: 'backend-unavailable',
      message: errorMessage,
      userMessage: 'Connection refused. The backend service may not be running or may be on a different address. Please check your configuration.',
      actionable: true,
      service: 'unknown',
    }
  }

  // Default unknown error
  return {
    type: 'unknown',
    message: errorMessage,
    userMessage: errorMessage.length > 100 ? `${errorMessage.substring(0, 100)}...` : errorMessage,
    actionable: false,
    service: 'unknown',
  }
}

/**
 * Gets a user-friendly error message for display
 */
export function getUserErrorMessage(error: any): string {
  return detectError(error).userMessage
}

/**
 * Checks if an error indicates the backend is unavailable
 */
export function isBackendUnavailable(error: any): boolean {
  const errorInfo = detectError(error)
  return errorInfo.type === 'network' || errorInfo.type === 'backend-unavailable'
}

