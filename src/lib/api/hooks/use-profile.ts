/**
 * React hooks for ProfileService
 * Ported from Angular ProfileService
 */

import { useState, useCallback } from 'react'
import {
  PaperlessUserProfile,
  SocialAccountProvider,
  TotpSettings,
} from '@/app/data/user-profile'
import { apiClient } from '../client'

export function useProfile() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const get = useCallback(async (): Promise<PaperlessUserProfile> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<PaperlessUserProfile>('profile/')
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch profile')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const update = useCallback(async (profile: PaperlessUserProfile): Promise<PaperlessUserProfile> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.patch<PaperlessUserProfile>('profile/', profile)
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const generateAuthToken = useCallback(async (): Promise<string> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<string>('profile/generate_auth_token/', {})
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate auth token')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const disconnectSocialAccount = useCallback(async (id: number): Promise<number> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<number>('profile/disconnect_social_account/', { id })
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to disconnect social account')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getSocialAccountProviders = useCallback(async (): Promise<SocialAccountProvider[]> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<SocialAccountProvider[]>(
        'profile/social_account_providers/'
      )
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch social account providers')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const getTotpSettings = useCallback(async (): Promise<TotpSettings> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<TotpSettings>('profile/totp/')
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch TOTP settings')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const activateTotp = useCallback(async (
    totpSecret: string,
    totpCode: string
  ): Promise<{ success: boolean; recovery_codes: string[] }> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.post<{ success: boolean; recovery_codes: string[] }>(
        'profile/totp/',
        {
          secret: totpSecret,
          code: totpCode,
        }
      )
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to activate TOTP')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const deactivateTotp = useCallback(async (): Promise<boolean> => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.delete<boolean>('profile/totp/')
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to deactivate TOTP')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    get,
    update,
    generateAuthToken,
    disconnectSocialAccount,
    getSocialAccountProviders,
    getTotpSettings,
    activateTotp,
    deactivateTotp,
    loading,
    error,
  }
}

