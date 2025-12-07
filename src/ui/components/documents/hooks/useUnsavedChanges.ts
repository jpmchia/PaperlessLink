import { useMemo } from 'react';
import { CustomView } from '@/app/data/custom-view';

interface UseUnsavedChangesOptions {
  appliedCustomView: CustomView | null;
  selectedCustomViewId: number | string | null;
  tableState: {
    columnSizing: Record<string, number>;
  };
  originalColumnSizing: Record<string, number>;
  pendingColumnOrder: (string | number)[] | null;
  columnOrderFromSettings: (string | number)[] | null;
  originalColumnOrder: (string | number)[];
  pendingColumnVisibility: Record<string, boolean> | null;
  columnVisibilityFromSettings: Record<string, boolean>;
  originalColumnVisibility: Record<string, boolean>;
  filterVisibilityFromSettings: Record<string, boolean>;
  originalFilterVisibility: Record<string, boolean>;
  pendingColumnSpanning: Record<string, boolean> | null;
  columnSpanningFromSettings: Record<string, boolean>;
  originalColumnSpanning: Record<string, boolean>;
}

/**
 * Hook to detect if there are unsaved changes to the custom view
 */
export function useUnsavedChanges({
  appliedCustomView,
  selectedCustomViewId,
  tableState,
  originalColumnSizing,
  pendingColumnOrder,
  columnOrderFromSettings,
  originalColumnOrder,
  pendingColumnVisibility,
  columnVisibilityFromSettings,
  originalColumnVisibility,
  filterVisibilityFromSettings,
  originalFilterVisibility,
  pendingColumnSpanning,
  columnSpanningFromSettings,
  originalColumnSpanning,
}: UseUnsavedChangesOptions) {
  const hasUnsavedChanges = useMemo(() => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId !== 'number') {
      return false;
    }
    
    // Check column sizing changes
    const currentSizing = tableState.columnSizing;
    const originalSizing = originalColumnSizing;
    const allSizingKeys = Array.from(new Set([...Object.keys(currentSizing), ...Object.keys(originalSizing)]));
    for (const key of allSizingKeys) {
      const current = currentSizing[key] ?? undefined;
      const original = originalSizing[key] ?? undefined;
      if (current !== original) {
        return true;
      }
    }
    
    // Check column order changes
    const currentOrder = (pendingColumnOrder ?? (columnOrderFromSettings ?? [])) || [];
    const originalOrder = originalColumnOrder;
    if (JSON.stringify(currentOrder) !== JSON.stringify(originalOrder)) {
      return true;
    }
    
    // Check column visibility changes
    const currentVisibility = pendingColumnVisibility ?? columnVisibilityFromSettings;
    const originalVisibility = originalColumnVisibility;
    const allVisibilityKeys = Array.from(new Set([...Object.keys(currentVisibility), ...Object.keys(originalVisibility)]));
    for (const key of allVisibilityKeys) {
      const current = currentVisibility[key] ?? true;
      const original = originalVisibility[key] ?? true;
      if (current !== original) {
        return true;
      }
    }
    
    // Check filter visibility changes
    const currentFilterVisibility = filterVisibilityFromSettings;
    const originalFilterVis = originalFilterVisibility;
    const allFilterVisibilityKeys = Array.from(new Set([...Object.keys(currentFilterVisibility), ...Object.keys(originalFilterVis)]));
    for (const key of allFilterVisibilityKeys) {
      const current = currentFilterVisibility[key] ?? false;
      const original = originalFilterVis[key] ?? false;
      if (current !== original) {
        return true;
      }
    }
    
    // Check column spanning changes
    const currentColumnSpanning = pendingColumnSpanning ?? columnSpanningFromSettings;
    const originalColumnSpan = originalColumnSpanning;
    const allColumnSpanningKeys = Array.from(new Set([...Object.keys(currentColumnSpanning), ...Object.keys(originalColumnSpan)]));
    for (const key of allColumnSpanningKeys) {
      const current = currentColumnSpanning[key] ?? false;
      const original = originalColumnSpan[key] ?? false;
      if (current !== original) {
        return true;
      }
    }
    
    return false;
  }, [
    appliedCustomView,
    selectedCustomViewId,
    tableState.columnSizing,
    originalColumnSizing,
    pendingColumnOrder,
    columnOrderFromSettings,
    originalColumnOrder,
    pendingColumnVisibility,
    columnVisibilityFromSettings,
    originalColumnVisibility,
    filterVisibilityFromSettings,
    originalFilterVisibility,
    pendingColumnSpanning,
    columnSpanningFromSettings,
    originalColumnSpanning,
  ]);

  return { hasUnsavedChanges };
}

