import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { CustomView } from '@/app/data/custom-view';
import { useCustomViews } from '@/lib/api/hooks';
import { useTableState } from '../useTableState';

interface UseCustomViewManagementOptions {
  tableState: ReturnType<typeof useTableState>;
}

interface CustomViewState {
  selectedCustomViewId: number | string | null;
  appliedCustomView: CustomView | null;
  originalColumnSizing: Record<string, number>;
  originalColumnOrder: (string | number)[];
  originalColumnVisibility: Record<string, boolean>;
  originalFilterVisibility: Record<string, boolean>;
  pendingColumnOrder: (string | number)[] | null;
  pendingColumnVisibility: Record<string, boolean> | null;
  pendingFilterVisibility: Record<string, boolean> | null;
  isSaving: boolean;
}

/**
 * Hook to manage custom view selection, application, and state tracking
 */
export function useCustomViewManagement({ tableState }: UseCustomViewManagementOptions) {
  const { customViews, isLoading: customViewsLoading, refetch: refetchCustomViews, update: updateCustomView, create: createCustomView } = useCustomViews();
  
  const [selectedCustomViewId, setSelectedCustomViewId] = useState<number | string | null>(null);
  const [appliedCustomView, setAppliedCustomView] = useState<CustomView | null>(null);
  const [originalColumnSizing, setOriginalColumnSizing] = useState<Record<string, number>>({});
  const [originalColumnOrder, setOriginalColumnOrder] = useState<(string | number)[]>([]);
  const [originalColumnVisibility, setOriginalColumnVisibility] = useState<Record<string, boolean>>({});
  const [originalFilterVisibility, setOriginalFilterVisibility] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [pendingColumnOrder, setPendingColumnOrder] = useState<(string | number)[] | null>(null);
  const [pendingColumnVisibility, setPendingColumnVisibility] = useState<Record<string, boolean> | null>(null);
  const [pendingFilterVisibility, setPendingFilterVisibility] = useState<Record<string, boolean> | null>(null);
  
  const appliedViewIdRef = useRef<number | string | null>(null);

  // Restore selected view from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedViewId = localStorage.getItem('lastSelectedCustomViewId');
      if (savedViewId) {
        try {
          const numId = parseInt(savedViewId, 10);
          if (!isNaN(numId)) {
            setSelectedCustomViewId(numId);
          } else {
            setSelectedCustomViewId(savedViewId);
          }
        } catch (e) {
          // Invalid ID, ignore
        }
      }
    }
  }, []);

  // Apply the selected custom view - this function applies all view settings to the table
  const applyCustomView = useCallback((view: CustomView, skipIfSame = false) => {
    // Guard: Skip if we're already applying this exact view (prevent infinite loops)
    if (skipIfSame && appliedViewIdRef.current === view.id) {
      return;
    }
    
    appliedViewIdRef.current = (view.id ?? null) as number | string | null;
    setAppliedCustomView(view);
    
    // Debug: Log what's being applied
    console.log('[useCustomViewManagement] Applying custom view:', {
      viewId: view.id,
      viewName: view.name,
      filter_visibility: view.filter_visibility,
      hasFilterVisibility: !!view.filter_visibility,
      filterVisibilityKeys: view.filter_visibility ? Object.keys(view.filter_visibility) : [],
    });
    
    // Store original state for revert functionality
    setOriginalColumnSizing(view.column_sizing || {});
    setOriginalColumnOrder(view.column_order || []);
    setOriginalColumnVisibility(view.column_visibility || {});
    setOriginalFilterVisibility(view.filter_visibility || {});
    
    // Clear pending changes
    setPendingColumnOrder(null);
    setPendingColumnVisibility(null);
    setPendingFilterVisibility(null);
    
    // Apply column sizing
    if (view.column_sizing) {
      tableState.setColumnSizing(view.column_sizing);
    } else {
      tableState.setColumnSizing({});
    }
    
    // Apply column order
    if (view.column_order && view.column_order.length > 0) {
      tableState.setColumnOrder(view.column_order.map(id => String(id)));
    }
    
    // Apply column visibility (for built-in fields)
    if (view.column_visibility) {
      const visibility: Record<string, boolean> = {};
      Object.entries(view.column_visibility).forEach(([key, value]) => {
        visibility[key] = value !== false; // Default to true if not explicitly false
      });
      tableState.setColumnVisibility(visibility);
    }
  }, [tableState.setColumnSizing, tableState.setColumnOrder, tableState.setColumnVisibility]);

  // Find and apply the selected custom view
  useEffect(() => {
    if (selectedCustomViewId && customViews.length > 0) {
      const view = customViews.find(v => {
        if (typeof selectedCustomViewId === 'number' && typeof v.id === 'number') {
          return v.id === selectedCustomViewId;
        }
        return false;
      });
      
      if (view) {
        // Debug: Log what view we're about to apply
        console.log('[useCustomViewManagement] Found view to apply:', {
          viewId: view.id,
          viewName: view.name,
          filter_visibility: view.filter_visibility,
          hasFilterVisibility: !!view.filter_visibility,
          filterVisibilityKeys: view.filter_visibility ? Object.keys(view.filter_visibility) : [],
          filterVisibilityValues: view.filter_visibility,
        });
        applyCustomView(view);
        // Persist selection
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastSelectedCustomViewId', String(selectedCustomViewId));
        }
      } else {
        console.log('[useCustomViewManagement] View not found for ID:', selectedCustomViewId);
        setAppliedCustomView(null);
        setOriginalColumnSizing({});
        setOriginalColumnOrder([]);
        setOriginalColumnVisibility({});
        setOriginalFilterVisibility({});
      }
    } else {
      setAppliedCustomView(null);
      setOriginalColumnSizing({});
      setOriginalColumnOrder([]);
      setOriginalColumnVisibility({});
      setOriginalFilterVisibility({});
    }
  }, [selectedCustomViewId, customViews, applyCustomView, setOriginalColumnSizing, setOriginalColumnOrder, setOriginalColumnVisibility, setOriginalFilterVisibility]);
  
  // Handle custom view updates - memoized to prevent infinite loops
  const handleCustomViewsUpdated = useCallback(async () => {
    // Refetch custom views to get the latest data
    const result = await refetchCustomViews();
    
    // Re-apply the selected view if one is selected
    if (selectedCustomViewId && typeof selectedCustomViewId === 'number') {
      // Use the refetched data from the result (data is already an array from the queryFn)
      const updatedViews = result.data || [];
      const view = updatedViews.find(v => {
        if (typeof v.id === 'number' && v.id === selectedCustomViewId) {
          return true;
        }
        return false;
      });
      
      if (view) {
        // Skip if it's the same view to prevent infinite loops
        applyCustomView(view, true);
      }
    }
  }, [selectedCustomViewId, refetchCustomViews, applyCustomView]);
  
  // Listen for custom view updates (when settings modal closes or views are saved)
  useEffect(() => {
    // Listen for customViewsUpdated event (dispatched when settings modal closes)
    window.addEventListener('customViewsUpdated', handleCustomViewsUpdated);
    
    // Also listen for settingsSaved event (dispatched when settings modal closes after saving)
    window.addEventListener('settingsSaved', handleCustomViewsUpdated);
    
    // Also listen for storage events (cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'customViewsUpdated') {
        handleCustomViewsUpdated();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage on mount for any pending updates (only once)
    if (typeof window !== 'undefined') {
      const customViewsUpdated = localStorage.getItem('customViewsUpdated');
      if (customViewsUpdated) {
        // Use setTimeout to avoid calling during render
        setTimeout(() => {
          handleCustomViewsUpdated();
          localStorage.removeItem('customViewsUpdated');
        }, 0);
      }
    }
    
    return () => {
      window.removeEventListener('customViewsUpdated', handleCustomViewsUpdated);
      window.removeEventListener('settingsSaved', handleCustomViewsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleCustomViewsUpdated]);

  // Get selected view name for display
  const selectedViewName = useMemo(() => {
    if (!selectedCustomViewId || !customViews.length) return "Select View";
    const view = customViews.find(v => v.id && typeof v.id === 'number' && v.id === selectedCustomViewId);
    return view?.name || "Select View";
  }, [selectedCustomViewId, customViews]);

  return {
    customViews,
    customViewsLoading,
    selectedCustomViewId,
    setSelectedCustomViewId,
    appliedCustomView,
    originalColumnSizing,
    originalColumnOrder,
    originalColumnVisibility,
    originalFilterVisibility,
    pendingColumnOrder,
    setPendingColumnOrder,
    pendingColumnVisibility,
    setPendingColumnVisibility,
    pendingFilterVisibility,
    setPendingFilterVisibility,
    isSaving,
    setIsSaving,
    updateCustomView,
    createCustomView,
    refetchCustomViews,
    applyCustomView,
    selectedViewName,
    setOriginalColumnSizing,
    setOriginalColumnOrder,
    setOriginalColumnVisibility,
    setOriginalFilterVisibility,
  };
}

