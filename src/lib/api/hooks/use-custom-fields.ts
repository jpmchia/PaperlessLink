/**
 * React hooks for CustomFieldsService with React Query caching
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CustomFieldsService } from '../services/custom-fields.service'
import { CustomField } from '@/app/data/custom-field'
import { ListParams } from '../base-service'
import { Results } from '@/app/data/results'

// Query keys for React Query
export const customFieldsKeys = {
  all: ['customFields'] as const,
  lists: () => [...customFieldsKeys.all, 'list'] as const,
  list: (params?: ListParams) => [...customFieldsKeys.lists(), params] as const,
  details: () => [...customFieldsKeys.all, 'detail'] as const,
  detail: (id: number) => [...customFieldsKeys.details(), id] as const,
  allList: () => [...customFieldsKeys.all, 'all'] as const,
}

export function useCustomFields() {
  const service = useMemo(() => new CustomFieldsService(), [])
  const queryClient = useQueryClient()

  // Query for listing all custom fields (most common use case)
  const listAllQuery = useQuery<Results<CustomField>>({
    queryKey: customFieldsKeys.allList(),
    queryFn: () => service.listAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

  // Wrapper functions for backward compatibility
  const list = async (params?: ListParams) => {
    return service.list(params)
  }

  const get = async (id: number) => {
    // Check cache first
    const cached = queryClient.getQueryData<CustomField>(customFieldsKeys.detail(id))
    if (cached) return cached
    return service.get(id)
  }

  const listAll = async () => {
    // Return cached data if available, otherwise fetch
    const cached = queryClient.getQueryData<Results<CustomField>>(customFieldsKeys.allList())
    if (cached) return cached
    return listAllQuery.refetch().then((result) => result.data!)
  }

  return {
    service,
    list,
    get,
    listAll,
    loading: listAllQuery.isLoading,
    error: listAllQuery.error,
    // Expose query data for direct access
    data: listAllQuery.data,
  }
}
