/**
 * Hook for managing custom views
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CustomView } from '@/app/data/custom-view'
import { CustomViewService } from '../services/custom-view.service'
import { detectError, isBackendUnavailable } from '@/lib/utils/errorUtils'

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
          const errorInfo = detectError(err)
          console.warn('[useCustomViews] Error info:', errorInfo)
          // Still throw so error state is set, but with better error message
          const enhancedError = new Error(errorInfo.userMessage)
          ;(enhancedError as any).status = err?.status
          ;(enhancedError as any).originalError = err
          ;(enhancedError as any).errorInfo = errorInfo
          throw enhancedError
        }
        
        // Detect and enhance network/backend errors
        if (isBackendUnavailable(err)) {
          const errorInfo = detectError(err)
          console.error('[useCustomViews] Backend unavailable:', errorInfo)
          const enhancedError = new Error(errorInfo.userMessage)
          ;(enhancedError as any).status = err?.status
          ;(enhancedError as any).originalError = err
          ;(enhancedError as any).errorInfo = errorInfo
          ;(enhancedError as any).isBackendUnavailable = true
          throw enhancedError
        }
        
        console.error('[useCustomViews] Error fetching custom views:', err)
        const errorInfo = detectError(err)
        const enhancedError = new Error(errorInfo.userMessage)
        ;(enhancedError as any).status = err?.status
        ;(enhancedError as any).originalError = err
        ;(enhancedError as any).errorInfo = errorInfo
        throw enhancedError
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
        console.log('[useCustomViews] Creating view with data:', data)
        const result = await customViewService.create(data)
        console.log('[useCustomViews] View created successfully:', result)
        return result
      } catch (err: any) {
        console.error('[useCustomViews] Error creating view:', err)
        const errorInfo = detectError(err)
        const enhancedError = new Error(errorInfo.userMessage)
        ;(enhancedError as any).status = err?.status
        ;(enhancedError as any).originalError = err
        ;(enhancedError as any).errorInfo = errorInfo
        throw enhancedError
      }
    },
    onSuccess: async (data) => {
      console.log('[useCustomViews] Mutation success, invalidating queries. Created view:', data)
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY })
      // Refetch to ensure UI updates immediately
      await queryClient.refetchQueries({ queryKey: QUERY_KEY })
    },
    onError: (error) => {
      console.error('[useCustomViews] Mutation error:', error)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CustomView> }) => {
      try {
        return await customViewService.update(id, data)
      } catch (err: any) {
        const errorInfo = detectError(err)
        const enhancedError = new Error(errorInfo.userMessage)
        ;(enhancedError as any).status = err?.status
        ;(enhancedError as any).originalError = err
        ;(enhancedError as any).errorInfo = errorInfo
        throw enhancedError
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
        const errorInfo = detectError(err)
        const enhancedError = new Error(errorInfo.userMessage)
        ;(enhancedError as any).status = err?.status
        ;(enhancedError as any).originalError = err
        ;(enhancedError as any).errorInfo = errorInfo
        throw enhancedError
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

