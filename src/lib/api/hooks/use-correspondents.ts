/**
 * React hooks for CorrespondentService with React Query caching
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CorrespondentService } from '../services/correspondent.service'
import { Correspondent } from '@/app/data/correspondent'
import { ListParams } from '../base-service'
import { Results } from '@/app/data/results'

// Query keys for React Query
export const correspondentsKeys = {
  all: ['correspondents'] as const,
  lists: () => [...correspondentsKeys.all, 'list'] as const,
  list: (params?: ListParams) => [...correspondentsKeys.lists(), params] as const,
  details: () => [...correspondentsKeys.all, 'detail'] as const,
  detail: (id: number) => [...correspondentsKeys.details(), id] as const,
  allList: () => [...correspondentsKeys.all, 'all'] as const,
}

export function useCorrespondents() {
  const service = useMemo(() => new CorrespondentService(), [])
  const queryClient = useQueryClient()

  // Query for listing all correspondents (most common use case)
  const listAllQuery = useQuery<Results<Correspondent>>({
    queryKey: correspondentsKeys.allList(),
    queryFn: () => service.listAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

  // Wrapper functions for backward compatibility
  const list = async (params?: ListParams) => {
    return service.list(params)
  }

  const listFiltered = async (params?: ListParams & { nameFilter?: string }) => {
    return service.listFiltered(params)
  }

  const get = async (id: number) => {
    const cached = queryClient.getQueryData<Correspondent>(correspondentsKeys.detail(id))
    if (cached) return cached
    return service.get(id)
  }

  const listAll = async () => {
    const cached = queryClient.getQueryData<Results<Correspondent>>(correspondentsKeys.allList())
    if (cached) return cached
    return listAllQuery.refetch().then((result) => result.data!)
  }

  return {
    service,
    list,
    listFiltered,
    get,
    listAll,
    loading: listAllQuery.isLoading,
    error: listAllQuery.error,
    // Expose query data for direct access
    data: listAllQuery.data,
  }
}
