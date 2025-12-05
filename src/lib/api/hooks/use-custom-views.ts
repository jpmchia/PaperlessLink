/**
 * Hook for managing custom views
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CustomView } from '@/app/data/custom-view'
import { CustomViewService } from '../services/custom-view.service'

const customViewService = new CustomViewService()

const QUERY_KEY = ['customViews']

export function useCustomViews() {
  const queryClient = useQueryClient()

  // List all custom views (user + global)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        console.log('[useCustomViews] Fetching custom views from API...')
        const results = await customViewService.list()
        console.log('[useCustomViews] Fetched custom views:', results.results?.length || 0, 'views')
        return results.results || []
      } catch (err: any) {
        // If API endpoint doesn't exist (403/404), return empty array gracefully
        if (err?.status === 403 || err?.status === 404) {
          console.warn('[useCustomViews] Custom views API endpoint not available (403/404):', err)
          return []
        }
        console.error('[useCustomViews] Error fetching custom views:', err)
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
    // Ensure query runs on mount and refetches even if cached
    enabled: true,
    refetchOnMount: 'always', // Always refetch on mount, even if data is fresh
    staleTime: 0, // Consider data stale immediately so it refetches
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<CustomView, 'id'>) => {
      try {
        return await customViewService.create(data)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Custom views API endpoint is not available. Please check backend implementation.')
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
    mutationFn: async ({ id, data }: { id: number; data: Partial<CustomView> }) => {
      try {
        return await customViewService.update(id, data)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Custom views API endpoint is not available. Please check backend implementation.')
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
        return await customViewService.delete(id)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Custom views API endpoint is not available. Please check backend implementation.')
        }
        throw err
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })

  return {
    customViews: data || [],
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

export function useCustomView(id: number | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () => customViewService.get(id!),
    enabled: !!id,
  })
}

