/**
 * Hook for managing tag groups
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TagGroupService, TagGroup } from '../services/tag-group.service'

const tagGroupService = new TagGroupService()

const QUERY_KEY = ['tagGroups']

export function useTagGroups() {
  const queryClient = useQueryClient()

  // List all tag groups
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        return await tagGroupService.list()
      } catch (err: any) {
        // If API endpoint doesn't exist (403/404), return empty array gracefully
        if (err?.status === 403 || err?.status === 404) {
          console.warn('[useTagGroups] Tag groups API endpoint not available (403/404):', err)
          return []
        }
        console.error('[useTagGroups] Error fetching tag groups:', err)
        throw err
      }
    },
    retry: (failureCount, error: any) => {
      // Don't retry on 403/404 errors (endpoint doesn't exist)
      if (error?.status === 403 || error?.status === 404) {
        return false
      }
      return failureCount < 3
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Partial<TagGroup>) => {
      try {
        return await tagGroupService.create(data)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Tag groups API endpoint is not available. Please check backend implementation.')
        }
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TagGroup> }) => {
      try {
        return await tagGroupService.update(id, data)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Tag groups API endpoint is not available. Please check backend implementation.')
        }
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await tagGroupService.delete(id)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Tag groups API endpoint is not available. Please check backend implementation.')
        }
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    tagGroups: data || [],
    isLoading,
    error,
    refetch,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}

export function useTagGroup(id: number | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => tagGroupService.get(id!),
    enabled: !!id,
  })
}






