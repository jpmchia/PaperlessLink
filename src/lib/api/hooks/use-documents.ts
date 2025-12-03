/**
 * React hooks for DocumentService with React Query caching
 */

import { useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DocumentService } from '../services/document.service'
import { Document } from '@/app/data/document'
import { FilterRule } from '@/app/data/filter-rule'
import { ListParams } from '../base-service'
import { Results } from '@/app/data/results'

// Query keys for React Query
export const documentsKeys = {
  all: ['documents'] as const,
  lists: () => [...documentsKeys.all, 'list'] as const,
  list: (params?: ListParams) => [...documentsKeys.lists(), params] as const,
  filtered: (params?: ListParams & { filterRules?: FilterRule[] }) => 
    [...documentsKeys.lists(), 'filtered', params] as const,
  details: () => [...documentsKeys.all, 'detail'] as const,
  detail: (id: number) => [...documentsKeys.details(), id] as const,
}

export function useDocuments() {
  const service = useMemo(() => new DocumentService(), [])
  const queryClient = useQueryClient()

  // Wrapper functions for backward compatibility - memoized to prevent infinite loops
  const list = useCallback(async (params?: ListParams) => {
    return service.list(params)
  }, [service])

  const listFiltered = useCallback(async (
    params?: ListParams & { filterRules?: FilterRule[] }
  ) => {
    return service.listFiltered(params)
  }, [service])

  const get = useCallback(async (id: number) => {
    // Check cache first
    const cached = queryClient.getQueryData<Document>(documentsKeys.detail(id))
    if (cached) return cached
    return service.get(id)
  }, [service, queryClient])

  // Mutation for creating documents
  const createMutation = useMutation({
    mutationFn: (data: Partial<Document>) => service.create(data),
    onSuccess: () => {
      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  // Mutation for updating documents
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Document> }) =>
      service.update(id, data),
    onSuccess: (data, variables) => {
      // Update cache for specific document
      queryClient.setQueryData(documentsKeys.detail(variables.id), data)
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  // Mutation for deleting documents
  const deleteMutation = useMutation({
    mutationFn: (id: number) => service.delete(id),
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: documentsKeys.detail(id) })
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: documentsKeys.lists() })
    },
  })

  const create = async (data: Partial<Document>) => {
    return createMutation.mutateAsync(data)
  }

  const update = async (id: number, data: Partial<Document>) => {
    return updateMutation.mutateAsync({ id, data })
  }

  const deleteDocument = async (id: number) => {
    return deleteMutation.mutateAsync(id)
  }

  return {
    service,
    list,
    listFiltered,
    get,
    create,
    update,
    delete: deleteDocument,
    loading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: createMutation.error || updateMutation.error || deleteMutation.error,
  }
}
