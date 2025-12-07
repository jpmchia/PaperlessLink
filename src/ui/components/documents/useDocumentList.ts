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
import { buildCustomFieldQueries, combineCustomFieldQueries } from './customFieldQueryBuilder';

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

  // Custom field filters - use shared utility function
  // Format: JSON array like ["fieldId", "operator", value] or ["AND", [query1, query2]]
  // See: https://docs.paperless-ngx.com/api/#filtering-by-custom-fields
  const customFieldQueries = buildCustomFieldQueries(filters.customFields);
  const combinedQuery = combineCustomFieldQueries(customFieldQueries);
  
  if (combinedQuery) {
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
      
      // Debug logging for empty results
      if ((response.results || []).length === 0 && filterRules && filterRules.length > 0) {
        console.warn('No documents returned with filters applied. Filter rules:', filterRules);
        console.warn('Response:', { count: response.count, results: response.results });
      }
      
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

