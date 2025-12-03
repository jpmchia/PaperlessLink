/**
 * React hooks for DocumentService
 */

import { useMemo, useState, useCallback } from 'react'
import { DocumentService } from '../services/document.service'
import { Document } from '@/app/data/document'
import { FilterRule } from '@/app/data/filter-rule'
import { ListParams } from '../base-service'

export function useDocuments() {
  const service = useMemo(() => new DocumentService(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const list = useCallback(async (params?: ListParams) => {
    setLoading(true)
    setError(null)
    try {
      return await service.list(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list documents')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const listFiltered = useCallback(async (
    params?: ListParams & { filterRules?: FilterRule[] }
  ) => {
    setLoading(true)
    setError(null)
    try {
      return await service.listFiltered(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list filtered documents')
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
      const error = err instanceof Error ? err : new Error('Failed to get document')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const create = useCallback(async (data: Partial<Document>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.create(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create document')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const update = useCallback(async (id: number, data: Partial<Document>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.update(id, data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update document')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const deleteDocument = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await service.delete(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete document')
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
    create,
    update,
    delete: deleteDocument,
    loading,
    error,
  }
}

