/**
 * React hook for Remote User Authentication
 * 
 * Remote user authentication allows authentication via HTTP headers set by
 * a reverse proxy or SSO system. This is useful for integrating Paperless
 * with external authentication systems.
 * 
 * SECURITY WARNING:
 * The Remote-User header should NEVER be set by the client directly.
 * It must be set by a trusted reverse proxy (nginx, Apache, etc.) that
 * validates the user's identity through SSO or other trusted mechanisms.
 * 
 * This hook is primarily for:
 * 1. Storing/retrieving the username when the reverse proxy sets the header
 * 2. Making API requests that include the Remote-User header
 * 3. Managing the remote user session state
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '../client'

export interface RemoteUserAuthConfig {
  /**
   * The HTTP header name to use for remote user authentication
   * Default: 'Remote-User' (Django converts this to HTTP_REMOTE_USER)
   */
  headerName?: string
  
  /**
   * Whether to automatically detect the username from server headers
   * This requires the reverse proxy to set the header
   */
  autoDetect?: boolean
}

export function useRemoteUserAuth(config: RemoteUserAuthConfig = {}) {
  const [username, setUsernameState] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const router = useRouter()
  
  const headerName = config.headerName || process.env.NEXT_PUBLIC_REMOTE_USER_HEADER_NAME || 'Remote-User'

  // Initialize username from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('remote_user')
      if (stored) {
        setUsernameState(stored)
      }
    }
  }, [])

  /**
   * Set the remote user username
   * 
   * NOTE: In a production setup, the username should come from the
   * reverse proxy's Remote-User header, not from user input.
   */
  const setRemoteUser = useCallback((user: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('remote_user', user)
      setUsernameState(user)
      // Clear token auth when using remote user
      localStorage.removeItem('auth_token')
    }
  }, [])

  /**
   * Clear remote user authentication
   */
  const clearRemoteUser = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('remote_user')
      setUsernameState(null)
    }
  }, [])

  /**
   * Test if remote user authentication is working
   * Makes a test API call to verify authentication
   */
  const testAuth = useCallback(async (): Promise<boolean> => {
    if (!username) {
      setError(new Error('No remote user set'))
      return false
    }

    setLoading(true)
    setError(null)
    try {
      // Try to fetch user profile to verify auth works
      const response = await apiClient.get('profile/')
      return !!response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Remote user authentication failed')
      setError(error)
      return false
    } finally {
      setLoading(false)
    }
  }, [username])

  /**
   * Logout - clears remote user and redirects
   */
  const logout = useCallback(() => {
    clearRemoteUser()
    router.push('/signin')
  }, [clearRemoteUser, router])

  /**
   * Check if currently authenticated via remote user
   */
  const isAuthenticated = useCallback((): boolean => {
    return !!username
  }, [username])

  return {
    username,
    setRemoteUser,
    clearRemoteUser,
    testAuth,
    logout,
    isAuthenticated,
    loading,
    error,
    headerName,
  }
}

