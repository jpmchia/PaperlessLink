/**
 * React hooks for authentication
 */

import { useState, useCallback } from 'react'
import { apiClient } from '../client'
import { useRouter } from 'next/navigation'

export interface LoginCredentials {
  username: string
  password: string
}

export interface AuthTokenResponse {
  token: string
}

export interface RemoteUserAuthOptions {
  username: string
  headerName?: string
}

export function useAuth() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()

  const login = useCallback(async (credentials: LoginCredentials): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      // Paperless uses Django REST Framework token authentication
      // The endpoint is /api/token/ and expects form-urlencoded data
      const response = await apiClient.post<AuthTokenResponse>(
        'token/',
        {
          username: credentials.username,
          password: credentials.password,
        },
        'form-urlencoded'
      )
      
      // Store token in localStorage or cookie
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token)
        // Clear remote user if token auth succeeds
        localStorage.removeItem('remote_user')
        // Redirect to dashboard or home
        router.push('/')
      }
      
      return response.data.token
    } catch (err) {
      // Extract meaningful error message
      let errorMessage = 'Failed to login'
      if (err instanceof Error) {
        errorMessage = err.message
        // Handle CORS errors specifically
        if ((err as any).isCorsError) {
          errorMessage = err.message + 
            '\n\nTo fix this, add your frontend URL to PAPERLESS_CORS_ALLOWED_HOSTS on the backend.'
        }
        // Handle common HTTP errors
        else if ((err as any).status === 400) {
          errorMessage = 'Invalid username or password'
        } else if ((err as any).status === 401) {
          errorMessage = 'Invalid credentials'
        } else if ((err as any).status === 403) {
          errorMessage = 'Access denied'
        } else if ((err as any).status >= 500) {
          errorMessage = 'Server error. Please try again later.'
        }
      }
      const error = new Error(errorMessage)
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [router])

  /**
   * Set remote user for authentication via HTTP header
   * 
   * WARNING: This should only be used when behind a trusted reverse proxy
   * that validates and sets the Remote-User header. Do NOT allow clients
   * to set this directly as it would be a security vulnerability.
   * 
   * Typically, the reverse proxy (nginx, Apache, etc.) should set the header
   * based on SSO authentication, and this function is only needed if you need
   * to store/restore the username client-side.
   */
  const setRemoteUser = useCallback((username: string) => {
    localStorage.setItem('remote_user', username)
    // Clear token auth when using remote user
    localStorage.removeItem('auth_token')
  }, [])

  /**
   * Clear remote user authentication
   */
  const clearRemoteUser = useCallback(() => {
    localStorage.removeItem('remote_user')
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    router.push('/signin')
  }, [router])

  const isAuthenticated = useCallback((): boolean => {
    return !!(localStorage.getItem('auth_token') || localStorage.getItem('remote_user'))
  }, [])

  const getAuthMethod = useCallback((): 'token' | 'remote' | null => {
    if (localStorage.getItem('auth_token')) return 'token'
    if (localStorage.getItem('remote_user')) return 'remote'
    return null
  }, [])

  return {
    login,
    logout,
    isAuthenticated,
    getAuthMethod,
    setRemoteUser,
    clearRemoteUser,
    loading,
    error,
  }
}

