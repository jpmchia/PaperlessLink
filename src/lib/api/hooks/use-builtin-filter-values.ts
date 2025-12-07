/**
 * React hooks for BuiltinFilterValuesService with React Query caching
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BuiltinFilterValuesService, BuiltinFilterValueOption } from '../services/builtin-filter-values.service';
import { FilterRule } from '@/app/data/filter-rule';

// Query keys for React Query
export const builtinFilterValuesKeys = {
  all: ['builtinFilterValues'] as const,
  filterType: (filterType: string) => [...builtinFilterValuesKeys.all, 'type', filterType] as const,
  filterTypeValues: (filterType: string, filterRules?: FilterRule[]) => 
    [...builtinFilterValuesKeys.filterType(filterType), 'values', filterRules] as const,
};

export function useBuiltinFilterValues(
  filterType: string | null,
  filterRules?: FilterRule[]
) {
  const service = useMemo(() => new BuiltinFilterValuesService(), []);

  // Query for getting filter values with counts
  const filterValuesQuery = useQuery<BuiltinFilterValueOption[]>({
    queryKey: builtinFilterValuesKeys.filterTypeValues(filterType!, filterRules),
    queryFn: () => service.getFilterValues(filterType!, filterRules),
    enabled: filterType !== null,
    staleTime: 1 * 60 * 1000, // 1 minute - values can change as documents are added/filtered
    gcTime: 5 * 60 * 1000,
  });

  return {
    service,
    values: filterValuesQuery.data || [],
    loading: filterValuesQuery.isLoading,
    error: filterValuesQuery.error,
    refetch: filterValuesQuery.refetch,
  };
}

