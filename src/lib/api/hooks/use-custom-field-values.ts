/**
 * React hooks for CustomFieldValuesService with React Query caching
 */

import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CustomFieldValuesService, CustomFieldValueOption, CustomFieldValuesResponse } from '../services/custom-field-values.service';

// Query keys for React Query
export const customFieldValuesKeys = {
  all: ['customFieldValues'] as const,
  field: (fieldId: number) => [...customFieldValuesKeys.all, 'field', fieldId] as const,
  fieldValues: (fieldId: number) => [...customFieldValuesKeys.field(fieldId), 'values'] as const,
  fieldSearch: (fieldId: number, query: string) => [...customFieldValuesKeys.field(fieldId), 'search', query] as const,
  fieldCounts: (fieldId: number, filterRules?: any[]) => [...customFieldValuesKeys.field(fieldId), 'counts', filterRules] as const,
};

export function useCustomFieldValues(fieldId: number | null) {
  const service = useMemo(() => new CustomFieldValuesService(), []);
  const queryClient = useQueryClient();

  // Query for getting all values for a field
  const fieldValuesQuery = useQuery<CustomFieldValuesResponse>({
    queryKey: customFieldValuesKeys.fieldValues(fieldId!),
    queryFn: () => service.getFieldValues(fieldId!),
    enabled: fieldId !== null,
    staleTime: 2 * 60 * 1000, // 2 minutes - values can change as documents are added
    gcTime: 5 * 60 * 1000,
  });

  const searchValues = async (query: string): Promise<CustomFieldValueOption[]> => {
    if (!fieldId) return [];
    return service.searchFieldValues(fieldId, query);
  };

  const getValueCounts = async (filterRules?: any[]): Promise<CustomFieldValueOption[]> => {
    if (!fieldId) return [];
    return service.getValueCounts(fieldId, filterRules);
  };

  return {
    service,
    values: fieldValuesQuery.data?.values || [],
    fieldInfo: fieldValuesQuery.data ? {
      fieldId: fieldValuesQuery.data.field_id,
      fieldName: fieldValuesQuery.data.field_name,
      totalDocuments: fieldValuesQuery.data.total_documents,
    } : null,
    searchValues,
    getValueCounts,
    loading: fieldValuesQuery.isLoading,
    error: fieldValuesQuery.error,
    refetch: fieldValuesQuery.refetch,
  };
}

