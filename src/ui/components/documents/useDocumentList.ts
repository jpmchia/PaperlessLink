import { useState, useEffect, useCallback, useRef } from 'react';
import { useDocuments } from '@/lib/api/hooks';
import { Document } from '@/app/data/document';

const DEFAULT_PAGE_SIZE = 50;

/**
 * Hook to manage document list fetching and pagination
 */
export function useDocumentList(pageSize: number = DEFAULT_PAGE_SIZE) {
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

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setError(null);
      const extraParams: Record<string, any> = {};
      if (debouncedSearchQuery) {
        extraParams.query = debouncedSearchQuery;
      }
      const response = await listFiltered({
        page: currentPage,
        pageSize,
        extraParams: Object.keys(extraParams).length > 0 ? extraParams : undefined,
      });
      setDocuments(response.results || []);
      setTotalCount(response.count || 0);
    } catch (error) {
      console.error("Failed to fetch documents:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch documents");
    }
  }, [currentPage, pageSize, debouncedSearchQuery, listFiltered]);

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

