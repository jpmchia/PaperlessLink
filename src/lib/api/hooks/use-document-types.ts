/**
 * React hooks for DocumentTypeService with React Query caching
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { DocumentTypeService } from '../services/document-type.service'
import { DocumentType } from '@/app/data/document-type'
import { ListParams } from '../base-service'
import { Results } from '@/app/data/results'

// Query keys for React Query
export const documentTypesKeys = {
  all: ['documentTypes'] as const,
  lists: () => [...documentTypesKeys.all, 'list'] as const,
  list: (params?: ListParams) => [...documentTypesKeys.lists(), params] as const,
  details: () => [...documentTypesKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentTypesKeys.details(), id] as const,
  allList: () => [...documentTypesKeys.all, 'all'] as const,
}

export function useDocumentTypes() {
  const service = useMemo(() => new DocumentTypeService(), [])
  const queryClient = useQueryClient()

  // Query for listing all document types (most common use case)
  const listAllQuery = useQuery<Results<DocumentType>>({
    queryKey: documentTypesKeys.allList(),
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
    const cached = queryClient.getQueryData<DocumentType>(documentTypesKeys.detail(id))
    if (cached) return cached
    return service.get(id)
  }

  const listAll = async () => {
    const cached = queryClient.getQueryData<Results<DocumentType>>(documentTypesKeys.allList())
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
