import { QueryClient } from '@tanstack/react-query'

/**
 * React Query client configuration
 * Provides caching, background refetching, and request deduplication
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache data for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000, // Previously called cacheTime
      // Retry failed requests 1 time
      retry: 1,
      // Refetch on window focus (good for multi-tab scenarios)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (can be overridden per query)
      refetchOnReconnect: false,
    },
    mutations: {
      // Retry failed mutations 0 times (mutations shouldn't retry automatically)
      retry: 0,
    },
  },
})

