/**
 * React hooks for DocumentTypeService
 */

import { useMemo, useState, useCallback } from 'react'
import { DocumentTypeService } from '../services/document-type.service'
import { DocumentType } from '@/app/data/document-type'
import { ListParams } from '../base-service'

export function useDocumentTypes() {
  const service = useMemo(() => new DocumentTypeService(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const list = useCallback(async (params?: ListParams) => {
    setLoading(true)
    setError(null)
    try {
      return await service.list(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list document types')
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
      const error = err instanceof Error ? err : new Error('Failed to list filtered document types')
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
      const error = err instanceof Error ? err : new Error('Failed to get document type')
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
      const error = err instanceof Error ? err : new Error('Failed to list all document types')
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

