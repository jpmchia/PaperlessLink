import { useState, useEffect } from 'react';
import { type SortingState, type ColumnOrderState, type VisibilityState, type ColumnSizingState } from "@tanstack/react-table";

const STORAGE_KEYS = {
  sorting: 'documentsTableSorting',
  columnOrder: 'documentsTableColumnOrder',
  columnVisibility: 'documentsTableColumnVisibility',
  columnSizing: 'documentsTableColumnSizing',
} as const;

/**
 * Hook to manage table state with localStorage persistence
 */
export function useTableState() {
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.sorting);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.columnOrder);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.columnVisibility);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.columnSizing);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Persist to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.sorting, JSON.stringify(sorting));
    }
  }, [sorting]);

  useEffect(() => {
    if (typeof window !== 'undefined' && columnOrder.length > 0) {
      localStorage.setItem(STORAGE_KEYS.columnOrder, JSON.stringify(columnOrder));
    }
  }, [columnOrder]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.columnVisibility, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.columnSizing, JSON.stringify(columnSizing));
    }
  }, [columnSizing]);

  return {
    sorting,
    setSorting,
    columnOrder,
    setColumnOrder,
    columnVisibility,
    setColumnVisibility,
    columnSizing,
    setColumnSizing,
  };
}

