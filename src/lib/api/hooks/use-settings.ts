/**
 * React hooks for UI Settings with React Query caching
 */

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import { UiSettings } from '@/app/data/ui-settings'

// Query keys for React Query
export const settingsKeys = {
  all: ['settings'] as const,
  settings: () => [...settingsKeys.all, 'settings'] as const,
}

/**
 * Hook to fetch UI settings with automatic caching
 */
export function useSettings() {
  const queryClient = useQueryClient()

  // Query for fetching settings
  const {
    data: settings,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<UiSettings>({
    queryKey: settingsKeys.settings(),
    queryFn: async () => {
      const response = await apiClient.get<UiSettings>('ui_settings/')
      return response.data
    },
    // Settings don't change often, cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  })

  // Mutation for saving settings
  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsToSave: Record<string, any>) => {
      const response = await apiClient.post<{ success: boolean }>('ui_settings/', {
        settings: settingsToSave,
      })
      return response.data
    },
    onSuccess: (data, variables) => {
      if (data.success && settings) {
        // Optimistically update the cache
        queryClient.setQueryData<UiSettings>(settingsKeys.settings(), (old) => {
          if (!old) return old
          return {
            ...old,
            settings: { ...old.settings, ...variables },
          }
        })
      }
      // Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: settingsKeys.settings() })
    },
  })

  // Memoize getSettings to prevent infinite loops
  const getSettings = useCallback(async () => {
    const result = await refetch()
    return result.data || null
  }, [refetch])

  return {
    settings: settings || null,
    getSettings,
    saveSettings: saveSettingsMutation.mutateAsync,
    loading: loading || saveSettingsMutation.isPending,
    error: error || saveSettingsMutation.error,
  }
}
