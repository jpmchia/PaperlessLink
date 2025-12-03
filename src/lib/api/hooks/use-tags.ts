/**
 * React hooks for TagService with React Query caching
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TagService } from '../services/tag.service'
import { Tag } from '@/app/data/tag'
import { ListParams } from '../base-service'
import { Results } from '@/app/data/results'

// Query keys for React Query
export const tagsKeys = {
  all: ['tags'] as const,
  lists: () => [...tagsKeys.all, 'list'] as const,
  list: (params?: ListParams) => [...tagsKeys.lists(), params] as const,
  details: () => [...tagsKeys.all, 'detail'] as const,
  detail: (id: number) => [...tagsKeys.details(), id] as const,
  allList: () => [...tagsKeys.all, 'all'] as const,
}

export function useTags() {
  const service = useMemo(() => new TagService(), [])
  const queryClient = useQueryClient()

  // Query for listing all tags (most common use case)
  const listAllQuery = useQuery<Results<Tag>>({
    queryKey: tagsKeys.allList(),
    queryFn: () => service.listAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
  })

  // Wrapper functions for backward compatibility
  const list = async (params?: ListParams) => {
    return service.list(params)
  }

  const listFiltered = async (
    params?: ListParams & { nameFilter?: string; fullPerms?: boolean }
  ) => {
    return service.listFiltered(params)
  }

  const get = async (id: number) => {
    const cached = queryClient.getQueryData<Tag>(tagsKeys.detail(id))
    if (cached) return cached
    return service.get(id)
  }

  const create = async (data: Partial<Tag>) => {
    const result = await service.create(data)
    // Invalidate tags list to refetch
    queryClient.invalidateQueries({ queryKey: tagsKeys.all })
    return result
  }

  const update = async (id: number, data: Partial<Tag>) => {
    const result = await service.update(id, data)
    // Invalidate specific tag and list
    queryClient.invalidateQueries({ queryKey: tagsKeys.detail(id) })
    queryClient.invalidateQueries({ queryKey: tagsKeys.all })
    return result
  }

  const deleteTag = async (id: number) => {
    await service.delete(id)
    // Invalidate specific tag and list
    queryClient.invalidateQueries({ queryKey: tagsKeys.detail(id) })
    queryClient.invalidateQueries({ queryKey: tagsKeys.all })
  }

  const listAll = async () => {
    const cached = queryClient.getQueryData<Results<Tag>>(tagsKeys.allList())
    if (cached) return cached
    return listAllQuery.refetch().then((result) => result.data!)
  }

  return {
    service,
    list,
    listFiltered,
    get,
    create,
    update,
    delete: deleteTag,
    listAll,
    loading: listAllQuery.isLoading,
    error: listAllQuery.error,
    // Expose query data for direct access
    data: listAllQuery.data,
  }
}
