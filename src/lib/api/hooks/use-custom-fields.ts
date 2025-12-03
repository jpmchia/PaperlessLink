/**
 * React hooks for CustomFieldsService
 */

import { useMemo, useState, useCallback } from 'react'
import { CustomFieldsService } from '../services/custom-fields.service'
import { CustomField } from '@/app/data/custom-field'
import { ListParams } from '../base-service'

export function useCustomFields() {
  const service = useMemo(() => new CustomFieldsService(), [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const list = useCallback(async (params?: ListParams) => {
    setLoading(true)
    setError(null)
    try {
      return await service.list(params)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to list custom fields')
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
      const error = err instanceof Error ? err : new Error('Failed to get custom field')
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
      const error = err instanceof Error ? err : new Error('Failed to list all custom fields')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [service])

  return {
    service,
    list,
    get,
    listAll,
    loading,
    error,
  }
}

