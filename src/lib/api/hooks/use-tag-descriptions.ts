/**
 * Hook for managing tag descriptions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TagDescriptionService, TagDescription } from '../services/tag-description.service'

const tagDescriptionService = new TagDescriptionService()

const QUERY_KEY = ['tagDescriptions']

export function useTagDescription(tagId: number | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, tagId],
    queryFn: () => tagDescriptionService.get(tagId!),
    enabled: !!tagId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useTagDescriptions() {
  const queryClient = useQueryClient()

  // Set description mutation
  const setMutation = useMutation({
    mutationFn: async ({ tagId, description }: { tagId: number; description: Partial<TagDescription> }) => {
      try {
        return await tagDescriptionService.set(tagId, description)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Tag descriptions API endpoint is not available. Please check backend implementation.')
        }
        throw err
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, variables.tagId] })
    },
  })

  // Delete description mutation
  const deleteMutation = useMutation({
    mutationFn: async (tagId: number) => {
      try {
        return await tagDescriptionService.delete(tagId)
      } catch (err: any) {
        if (err?.status === 403 || err?.status === 404) {
          throw new Error('Tag descriptions API endpoint is not available. Please check backend implementation.')
        }
        throw err
      }
    },
    onSuccess: (_, tagId) => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, tagId] })
    },
  })

  return {
    set: setMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isSetting: setMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}


