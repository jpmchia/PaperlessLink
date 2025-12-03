/**
 * React hooks for ConfigService
 * Ported from Angular ConfigService
 */

import { useState, useCallback } from 'react'
import { PaperlessConfig } from '@/app/data/paperless-config'
import { apiClient } from '../client'

export function useConfig() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getConfig = useCallback(async (): Promise<PaperlessConfig> => {
    setLoading(true)
    setError(null)
    try {
      // The API returns an array, we need the first item
      const response = await apiClient.get<[PaperlessConfig]>('config/')
      return response.data[0]
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch config')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const saveConfig = useCallback(async (config: PaperlessConfig): Promise<PaperlessConfig> => {
    setLoading(true)
    setError(null)
    try {
      // Don't pass string for app_logo - use Omit to exclude it if it's a string
      const configToSave: Partial<PaperlessConfig> = { ...config }
      if (typeof configToSave.app_logo === 'string') {
        delete (configToSave as any).app_logo
      }

      const response = await apiClient.patch<PaperlessConfig>(
        `config/${config.id}/`,
        configToSave
      )
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save config')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const uploadFile = useCallback(async (
    file: File,
    configID: number,
    configKey: string
  ): Promise<PaperlessConfig> => {
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append(configKey, file, file.name)

      const response = await apiClient.upload<PaperlessConfig>(
        `config/${configID}/`,
        formData
      )
      return response.data
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to upload file')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    getConfig,
    saveConfig,
    uploadFile,
    loading,
    error,
  }
}

