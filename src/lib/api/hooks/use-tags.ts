/**
 * React hooks for TagService
 */

import { useMemo, useState, useCallback } from 'react'
import { TagService } from '../services/tag.service'
import { Tag } from '@/app/data/tag'
import { ListParams } from '../base-service'

export function useTags() {
  const service = useMemo(() => new TagService(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const list = useCallback(async (params?: ListParams) => {
    setLoading(true)
    setError(null)
    try {
      return await service.list(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list tags')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const listFiltered = useCallback(async (
    params?: ListParams & { nameFilter?: string; fullPerms?: boolean }
  ) => {
    setLoading(true)
    setError(null)
    try {
      return await service.listFiltered(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list filtered tags')
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
      const error = err instanceof Error ? err : new Error('Failed to get tag')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const create = useCallback(async (data: Partial<Tag>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.create(data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to create tag')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const update = useCallback(async (id: number, data: Partial<Tag>) => {
    setLoading(true)
    setError(null)
    try {
      return await service.update(id, data)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update tag')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  const deleteTag = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await service.delete(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete tag')
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
      const error = err instanceof Error ? err : new Error('Failed to list all tags')
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
    delete: deleteTag,
    listAll,
    loading,
    error,
  }
}

