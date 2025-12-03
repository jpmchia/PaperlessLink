/**
 * Base HTTP client for React services
 * Replaces Angular's HttpClient
 */

import { environment } from '../../environments/environment'

export interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, string | number | boolean | null | undefined>
  contentType?: 'json' | 'form-urlencoded' | 'multipart-form-data'
}

class ApiClient {
  public baseUrl: string = environment.apiBaseUrl

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
      contentType = 'json',
    } = options

    // Build URL with query parameters
    const url = new URL(endpoint, this.baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value != null && value !== '') {
          url.searchParams.append(key, String(value))
        }
      })
    }

    // Determine Content-Type based on contentType option
    let contentHeader = 'application/json'
    if (contentType === 'form-urlencoded') {
      contentHeader = 'application/x-www-form-urlencoded'
    } else if (contentType === 'multipart-form-data') {
      contentHeader = 'multipart/form-data'
    }

    // Default headers
    const defaultHeaders: Record<string, string> = {
      'Content-Type': contentHeader,
      ...headers,
    }

    // Add authentication headers
    if (typeof window !== 'undefined') {
      const authToken = localStorage.getItem('auth_token')
      const remoteUser = localStorage.getItem('remote_user')
      
      // Token authentication takes precedence
      if (authToken) {
        defaultHeaders['Authorization'] = `Token ${authToken}`
      } 
      // Support remote user authentication (for SSO/reverse proxy setups)
      // Note: This should only be used when behind a trusted reverse proxy
      // that sets the Remote-User header. Do NOT allow clients to set this directly.
      else if (remoteUser) {
        // Only use remote user if token auth is not available
        // The header name can be configured via environment variable
        // Django converts HTTP headers: Remote-User -> HTTP_REMOTE_USER
        const headerName = process.env.NEXT_PUBLIC_REMOTE_USER_HEADER_NAME || 'Remote-User'
        defaultHeaders[headerName] = remoteUser
      }
    }

    // Prepare request config
    const config: RequestInit = {
      method,
      headers: defaultHeaders,
      // Don't include credentials for token auth (avoids CORS preflight issues)
      // credentials: 'include', // Only needed if using cookies/session auth
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Remove Content-Type header for FormData (browser will set it with boundary)
        delete defaultHeaders['Content-Type']
        config.body = body
      } else if (contentType === 'form-urlencoded') {
        // Convert object to URL-encoded string
        const formBody = new URLSearchParams()
        Object.entries(body).forEach(([key, value]) => {
          if (value != null && value !== '') {
            formBody.append(key, String(value))
          }
        })
        config.body = formBody.toString()
      } else {
        config.body = JSON.stringify(body)
      }
    }

    try {
      const response = await fetch(url.toString(), config)

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type')
      let data: T

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        // For non-JSON responses (like text), return as-is
        data = (await response.text()) as unknown as T
      }

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          if (contentType && contentType.includes('application/json')) {
            const errorData = data as any
            if (errorData.detail) {
              errorMessage = errorData.detail
            } else if (errorData.non_field_errors) {
              errorMessage = Array.isArray(errorData.non_field_errors)
                ? errorData.non_field_errors[0]
                : errorData.non_field_errors
            } else if (errorData.message) {
              errorMessage = errorData.message
            }
          }
        } catch {
          // If parsing fails, use default message
        }
        const error = new Error(errorMessage)
        ;(error as any).status = response.status
        throw error
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
      }
    } catch (error) {
      // Improve error messages for common issues
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // This usually indicates a CORS issue or network problem
        const origin = typeof window !== 'undefined' ? window.location.origin : 'unknown'
        const corsError = new Error(
          `Failed to fetch from ${url.toString()}. ` +
          `This is likely a CORS issue. ` +
          `Make sure ${origin} is added to PAPERLESS_CORS_ALLOWED_HOSTS on the backend. ` +
          `Original error: ${error.message}`
        )
        ;(corsError as any).originalError = error
        ;(corsError as any).isCorsError = true
        console.error('CORS or network error:', {
          url: url.toString(),
          origin,
          method,
          headers: defaultHeaders,
        })
        throw corsError
      }
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T>(endpoint: string, body?: any, contentType?: 'json' | 'form-urlencoded'): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'POST', body, contentType })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }

  async patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE', params })
  }

  // Helper for FormData uploads
  async upload<T>(
    endpoint: string,
    formData: FormData
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: formData,
      headers: {}, // Let browser set Content-Type with boundary
    })
  }
}

export const apiClient = new ApiClient()

