import { useState, useEffect, useCallback, useRef } from 'react';
import { useDocuments } from '@/lib/api/hooks';
import { Document } from '@/app/data/document';
import { FilterRule } from '@/app/data/filter-rule';
import { DocumentFilters } from './useDocumentFilters';
import {
  FILTER_CORRESPONDENT,
  FILTER_DOCUMENT_TYPE,
  FILTER_HAS_TAGS_ANY,
  FILTER_STORAGE_PATH,
  FILTER_OWNER_ANY,
  FILTER_CREATED_AFTER,
  FILTER_CREATED_BEFORE,
  FILTER_ASN,
  FILTER_IS_IN_INBOX,
  FILTER_CUSTOM_FIELDS_QUERY,
} from '@/app/data/filter-rule-type';
import { queryParamsFromFilterRules } from '@/app/utils/query-params';

const DEFAULT_PAGE_SIZE = 50;

/**
 * Convert DocumentFilters to FilterRule array
 */
function filtersToFilterRules(filters: DocumentFilters): FilterRule[] {
  const rules: FilterRule[] = [];

  // Correspondent filter
  if (filters.correspondent.length > 0) {
    filters.correspondent.forEach(id => {
      rules.push({ rule_type: FILTER_CORRESPONDENT, value: id.toString() });
    });
  }

  // Category/Document Type filter
  if (filters.category.length > 0) {
    filters.category.forEach(id => {
      rules.push({ rule_type: FILTER_DOCUMENT_TYPE, value: id.toString() });
    });
  }

  // Tags filter
  if (filters.tags.length > 0) {
    filters.tags.forEach(id => {
      rules.push({ rule_type: FILTER_HAS_TAGS_ANY, value: id.toString() });
    });
  }

  // Storage Path filter
  if (filters.storagePath.length > 0) {
    filters.storagePath.forEach(id => {
      rules.push({ rule_type: FILTER_STORAGE_PATH, value: id.toString() });
    });
  }

  // Owner filter
  if (filters.owner.length > 0) {
    filters.owner.forEach(id => {
      rules.push({ rule_type: FILTER_OWNER_ANY, value: id.toString() });
    });
  }

  // Status filter - map "active" to inbox
  // Note: Only apply inbox filter if "active" is selected and "archived" is not
  // If both are selected or only archived, don't filter by status (show all)
  if (filters.status.length > 0 && filters.status.includes('active') && !filters.status.includes('archived')) {
    rules.push({ rule_type: FILTER_IS_IN_INBOX, value: '1' });
  }

  // Date Range filter
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      rules.push({ rule_type: FILTER_CREATED_AFTER, value: filters.dateRange.start.toISOString().split('T')[0] });
    }
    if (filters.dateRange.end) {
      rules.push({ rule_type: FILTER_CREATED_BEFORE, value: filters.dateRange.end.toISOString().split('T')[0] });
    }
  }

  // ASN filter
  if (filters.asn.length > 0) {
    filters.asn.forEach(id => {
      rules.push({ rule_type: FILTER_ASN, value: id.toString() });
    });
  }

  // Custom field filters - use custom_field_query for proper filtering
  // Format: JSON array like ["fieldId", "operator", value] or ["AND", [query1, query2]]
  // See: https://docs.paperless-ngx.com/api/#filtering-by-custom-fields
  const customFieldQueries: any[] = [];
  Object.entries(filters.customFields).forEach(([fieldIdStr, filterData]) => {
    const fieldId = parseInt(fieldIdStr, 10);
    if (isNaN(fieldId)) return;

    const { type, value } = filterData;

    try {
      if (type === 'populated') {
        if (value === 'populated') {
          // Format: [fieldId, "exists", true]
          customFieldQueries.push([fieldId, "exists", true]);
        } else if (value === 'not-populated') {
          // Format: [fieldId, "isnull", true]
          customFieldQueries.push([fieldId, "isnull", true]);
        }
      } else if (type === 'multi-select' || type === 'single-select') {
        if (Array.isArray(value) && value.length > 0) {
          // Format: [fieldId, "in", [value1, value2]]
          customFieldQueries.push([fieldId, "in", value]);
        }
      } else if (type === 'date-range') {
        if (value && typeof value === 'object' && ('start' in value || 'end' in value)) {
          const dateRange = value as { start?: Date | null; end?: Date | null };
          if (dateRange.start && dateRange.end) {
            // Format: [fieldId, "range", ["start-date", "end-date"]]
            const startStr = dateRange.start.toISOString().split('T')[0];
            const endStr = dateRange.end.toISOString().split('T')[0];
            customFieldQueries.push([fieldId, "range", [startStr, endStr]]);
          } else if (dateRange.start) {
            // Format: [fieldId, "gte", "start-date"]
            const startStr = dateRange.start.toISOString().split('T')[0];
            customFieldQueries.push([fieldId, "gte", startStr]);
          } else if (dateRange.end) {
            // Format: [fieldId, "lte", "end-date"]
            const endStr = dateRange.end.toISOString().split('T')[0];
            customFieldQueries.push([fieldId, "lte", endStr]);
          }
        }
      }
    } catch (error) {
      console.error(`Error building custom field query for field ${fieldId}:`, error);
    }
  });

  if (customFieldQueries.length > 0) {
    // Combine multiple queries with AND operator
    // Format: ["AND", [query1, query2, ...]]
    const combinedQuery = customFieldQueries.length === 1 
      ? customFieldQueries[0]
      : ["AND", customFieldQueries];
    
    // Convert to JSON string for the API
    const queryString = JSON.stringify(combinedQuery);
    console.log('Custom field query:', queryString);
    rules.push({ rule_type: FILTER_CUSTOM_FIELDS_QUERY, value: queryString });
  }

  return rules;
}

/**
 * Hook to manage document list fetching and pagination
 */
export function useDocumentList(pageSize: number = DEFAULT_PAGE_SIZE, filters?: DocumentFilters) {
  const { listFiltered, loading } = useDocuments();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when search changes
    }, 400);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const extraParams: Record<string, any> = {};
      if (debouncedSearchQuery) {
        extraParams.query = debouncedSearchQuery;
      }
      
      // Convert filters to FilterRules
      const filterRules = filters ? filtersToFilterRules(filters) : undefined;
      
      // Debug logging to verify filters are being applied
      if (filterRules && filterRules.length > 0) {
        console.log('Applied filter rules:', filterRules);
        // Also log the query params that will be sent
        const queryParams = queryParamsFromFilterRules(filterRules);
        console.log('Query params:', queryParams);
      }
      
      const response = await listFiltered({
        page: currentPage,
        pageSize,
        filterRules: filterRules && filterRules.length > 0 ? filterRules : undefined,
        extraParams: Object.keys(extraParams).length > 0 ? extraParams : undefined,
      });
      setDocuments(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch documents";
      setError(errorMessage);
      
      // If we get an "Invalid page" error, reset to page 1 and retry
      if (errorMessage.includes("Invalid page") || errorMessage.includes("404")) {
        console.log("Invalid page error detected, resetting to page 1");
        setCurrentPage(1);
      }
    }
  }, [currentPage, pageSize, debouncedSearchQuery, filters, listFiltered]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const goToPreviousPage = useCallback(() => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  }, []);

  return {
    documents,
    totalCount,
    currentPage,
    pageSize,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    refetch: fetchDocuments,
  };
}

