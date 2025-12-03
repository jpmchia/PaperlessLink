/**
 * React hooks for CorrespondentService
 */

import { useMemo, useState, useCallback } from 'react'
import { CorrespondentService } from '../services/correspondent.service'
import { Correspondent } from '@/app/data/correspondent'
import { ListParams } from '../base-service'

export function useCorrespondents() {
  const service = useMemo(() => new CorrespondentService(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const list = useCallback(async (params?: ListParams) => {
    setLoading(true)
    setError(null)
    try {
      return await service.list(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list correspondents')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const listFiltered = useCallback(async (
    params?: ListParams & { nameFilter?: string }
  ) => {
    setLoading(true)
    setError(null)
    try {
      return await service.listFiltered(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list filtered correspondents')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const get = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      return await service.get(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get correspondent')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const listAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      return await service.listAll()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list all correspondents')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  return {
    service,
    list,
    listFiltered,
    get,
    listAll,
    loading,
    error,
  }
}
