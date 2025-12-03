/**
 * Environment configuration for Paperless Link
 * 
 * Configuration can be set via environment variables (Next.js):
 * - NEXT_PUBLIC_API_BASE_URL: Backend API base URL
 * - NEXT_PUBLIC_API_VERSION: API version (default: 9)
 * - NEXT_PUBLIC_APP_TITLE: Application title (default: Paperless-ngx)
 * 
 * For development, create a .env.local file in the project root.
 * For production, set these as environment variables in your deployment platform.
 */

const getApiBaseUrl = (): string => {
  // Check for Next.js environment variable first
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  // Fallback to browser-based detection in production
  if (typeof window !== 'undefined') {
    return window.location.origin + '/api/'
  }
  
  // Default development URL
  return 'http://localhost:8000/api/'
}

const getWebSocketHost = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.host
  }
  return 'localhost:8000'
}

const getWebSocketProtocol = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  }
  return 'ws:'
}

const getWebSocketBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const baseUrl = new URL(window.location.origin)
    return baseUrl.pathname + 'ws/'
  }
  return '/ws/'
}

export const environment = {
  production: process.env.NODE_ENV === 'production',
  apiBaseUrl: getApiBaseUrl(),
  apiVersion: process.env.NEXT_PUBLIC_API_VERSION || '9',
  appTitle: process.env.NEXT_PUBLIC_APP_TITLE || 'Paperless-ngx',
  tag: process.env.NODE_ENV === 'production' ? 'prod' : 'dev',
  version: process.env.NEXT_PUBLIC_APP_VERSION || 'DEVELOPMENT',
  webSocketHost: getWebSocketHost(),
  webSocketProtocol: getWebSocketProtocol(),
  webSocketBaseUrl: getWebSocketBaseUrl(),
}

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
