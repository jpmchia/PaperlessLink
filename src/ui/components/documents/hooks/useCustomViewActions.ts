import { useCallback } from 'react';
import { CustomView } from '@/app/data/custom-view';
import {
  normalizeColumnOrder,
  normalizeColumnVisibility,
  normalizeColumnSizing,
  normalizeColumnSpanning,
} from '@/ui/utils/columnIdUtils';

interface UseCustomViewActionsOptions {
  appliedCustomView: CustomView | null;
  selectedCustomViewId: number | string | null;
  tableState: {
    columnSizing: Record<string, number>;
  };
  pendingColumnOrder: (string | number)[] | null;
  pendingColumnVisibility: Record<string, boolean> | null;
  pendingFilterVisibility: Record<string, boolean> | null;
  pendingColumnSpanning: Record<string, boolean> | null;
  originalColumnSizing: Record<string, number>;
  originalColumnOrder: (string | number)[];
  originalColumnVisibility: Record<string, boolean>;
  originalFilterVisibility: Record<string, boolean>;
  originalColumnSpanning: Record<string, boolean>;
  setIsSaving: (saving: boolean) => void;
  setPendingColumnOrder: (order: (string | number)[] | null) => void;
  setPendingColumnVisibility: (visibility: Record<string, boolean> | null) => void;
  setPendingFilterVisibility: (visibility: Record<string, boolean> | null) => void;
  setPendingColumnSpanning: (spanning: Record<string, boolean> | null) => void;
  setOriginalColumnSizing: (sizing: Record<string, number>) => void;
  setOriginalColumnOrder: (order: (string | number)[]) => void;
  setOriginalColumnVisibility: (visibility: Record<string, boolean>) => void;
  setOriginalFilterVisibility: (visibility: Record<string, boolean>) => void;
  setOriginalColumnSpanning: (spanning: Record<string, boolean>) => void;
  setSelectedCustomViewId: (id: number | string | null) => void;
  updateCustomView: (params: { id: number; data: Partial<CustomView> }) => Promise<any>;
  createCustomView: (data: Partial<CustomView>) => Promise<any>;
  refetchCustomViews: () => Promise<any>;
  applyCustomView: (view: CustomView, skipIfSame?: boolean) => void;
  tableStateSetters: {
    setColumnSizing: (sizing: Record<string, number>) => void;
    setColumnOrder: (order: string[]) => void;
    setColumnVisibility: (visibility: Record<string, boolean>) => void;
  };
}

/**
 * Hook to manage custom view save/revert/save-as operations
 */
export function useCustomViewActions({
  appliedCustomView,
  selectedCustomViewId,
  tableState,
  pendingColumnOrder,
  pendingColumnVisibility,
  pendingFilterVisibility,
  pendingColumnSpanning,
  originalColumnSizing,
  originalColumnOrder,
  originalColumnVisibility,
  originalFilterVisibility,
  originalColumnSpanning,
  setIsSaving,
  setPendingColumnOrder,
  setPendingColumnVisibility,
  setPendingFilterVisibility,
  setPendingColumnSpanning,
  setOriginalColumnSizing,
  setOriginalColumnOrder,
  setOriginalColumnVisibility,
  setOriginalFilterVisibility,
  setOriginalColumnSpanning,
  setSelectedCustomViewId,
  updateCustomView,
  createCustomView,
  refetchCustomViews,
  applyCustomView,
  tableStateSetters,
}: UseCustomViewActionsOptions) {
  const handleSave = useCallback(async () => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId !== 'number') {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Convert current column sizing to the format expected by CustomView and normalize
      const updatedColumnSizing = normalizeColumnSizing(tableState.columnSizing);
      
      // Get pending order, visibility, filter visibility, and column spanning, or use current
      const rawOrder = pendingColumnOrder ?? appliedCustomView.column_order ?? [];
      const rawVisibility = pendingColumnVisibility ?? appliedCustomView.column_visibility ?? {};
      const rawColumnSpanning = pendingColumnSpanning ?? appliedCustomView.column_spanning ?? {};
      
      // Normalize all column IDs to consistent format
      const updatedOrder = normalizeColumnOrder(rawOrder);
      const updatedVisibility = normalizeColumnVisibility(rawVisibility);
      const updatedColumnSpanning = normalizeColumnSpanning(rawColumnSpanning);
      const updatedFilterVisibility = pendingFilterVisibility ?? appliedCustomView.filter_visibility ?? {};
      
      // Debug: Log what we're saving
      console.log('[useCustomViewActions] Saving custom view:', {
        viewId: selectedCustomViewId,
        viewName: appliedCustomView.name,
        pendingFilterVisibility,
        appliedCustomViewFilterVisibility: appliedCustomView.filter_visibility,
        updatedFilterVisibility,
        updatedColumnSpanning,
      });
      
      // Update the custom view
      await updateCustomView({
        id: selectedCustomViewId,
        data: {
          column_sizing: updatedColumnSizing,
          column_order: updatedOrder,
          column_visibility: updatedVisibility,
          filter_visibility: updatedFilterVisibility,
          column_spanning: updatedColumnSpanning,
        },
      });
      
      // Update the original state to match the new saved state
      setOriginalColumnSizing(updatedColumnSizing);
      setOriginalColumnOrder(updatedOrder);
      setOriginalColumnVisibility(updatedVisibility);
      setOriginalFilterVisibility(updatedFilterVisibility);
      setOriginalColumnSpanning(updatedColumnSpanning);
      
      // Clear pending changes
      setPendingColumnOrder(null);
      setPendingColumnVisibility(null);
      setPendingFilterVisibility(null);
      setPendingColumnSpanning(null);
      
      // Refetch views to get the latest - this will trigger the useEffect in useCustomViewManagement
      // which will automatically re-apply the selected view
      await refetchCustomViews();
      
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to save custom view:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  }, [
    appliedCustomView,
    selectedCustomViewId,
    tableState.columnSizing,
    pendingColumnOrder,
    pendingColumnVisibility,
    pendingFilterVisibility,
    pendingColumnSpanning,
    updateCustomView,
    refetchCustomViews,
    setIsSaving,
    setOriginalColumnSizing,
    setOriginalColumnOrder,
    setOriginalColumnVisibility,
    setOriginalFilterVisibility,
    setOriginalColumnSpanning,
    setPendingColumnOrder,
    setPendingColumnVisibility,
    setPendingFilterVisibility,
    setPendingColumnSpanning,
  ]);

  const handleRevert = useCallback(() => {
    if (!appliedCustomView) {
      return;
    }
    
    // Reset column sizing to original
    tableStateSetters.setColumnSizing(originalColumnSizing);
    
    // Reset column order to original
    if (originalColumnOrder.length > 0) {
      tableStateSetters.setColumnOrder(originalColumnOrder.map(id => String(id)));
    }
    
    // Reset column visibility to original
    const visibilityForTable: Record<string, boolean> = {};
    Object.entries(originalColumnVisibility).forEach(([key, value]) => {
      visibilityForTable[key] = value !== false;
    });
    tableStateSetters.setColumnVisibility(visibilityForTable);
    
    // Reset filter visibility to original
    setPendingFilterVisibility(null);
    
    // Reset column spanning to original
    setPendingColumnSpanning(null);
    
    // Clear pending changes
    setPendingColumnOrder(null);
    setPendingColumnVisibility(null);
    
    // Re-apply the view to restore filter visibility and column spanning
    applyCustomView(appliedCustomView, false);
  }, [
    appliedCustomView,
    originalColumnSizing,
    originalColumnOrder,
    originalColumnVisibility,
    tableStateSetters,
    setPendingFilterVisibility,
    setPendingColumnSpanning,
    setPendingColumnOrder,
    setPendingColumnVisibility,
    applyCustomView,
  ]);

  const handleSaveAs = useCallback(async () => {
    if (!appliedCustomView) {
      return;
    }
    
    const newViewName = window.prompt("Enter a name for the new view:", `${appliedCustomView.name} (Copy)`);
    if (!newViewName || !newViewName.trim()) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Convert current column sizing to the format expected by CustomView
      const updatedColumnSizing: Record<string, number> = {};
      Object.entries(tableState.columnSizing).forEach(([key, value]) => {
        if (typeof value === 'number' && value > 0) {
          updatedColumnSizing[key] = value;
        }
      });
      
      // Get pending order, visibility, filter visibility, and column spanning, or use current
      const updatedOrder = pendingColumnOrder ?? appliedCustomView.column_order ?? [];
      const updatedVisibility = pendingColumnVisibility ?? appliedCustomView.column_visibility ?? {};
      const updatedFilterVisibility = pendingFilterVisibility ?? appliedCustomView.filter_visibility ?? {};
      const updatedColumnSpanning = pendingColumnSpanning ?? appliedCustomView.column_spanning ?? {};
      
      // Create new view with current settings
      const newView = await createCustomView({
        name: newViewName.trim(),
        description: appliedCustomView.description || '',
        is_global: appliedCustomView.is_global || false,
        column_order: updatedOrder,
        column_visibility: updatedVisibility,
        column_sizing: updatedColumnSizing,
        column_display_types: appliedCustomView.column_display_types || {},
        filter_rules: appliedCustomView.filter_rules,
        filter_visibility: updatedFilterVisibility,
        column_spanning: updatedColumnSpanning,
        sort_field: appliedCustomView.sort_field,
        sort_reverse: appliedCustomView.sort_reverse,
      });
      
      // Refetch views to get the latest
      await refetchCustomViews();
      
      // Select the new view
      if (newView?.id && typeof newView.id === 'number') {
        setSelectedCustomViewId(newView.id);
      }
      
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to save as new view:", error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  }, [
    appliedCustomView,
    tableState.columnSizing,
    pendingColumnOrder,
    pendingColumnVisibility,
    pendingFilterVisibility,
    pendingColumnSpanning,
    createCustomView,
    refetchCustomViews,
    setIsSaving,
    setSelectedCustomViewId,
  ]);

  return {
    handleSave,
    handleRevert,
    handleSaveAs,
  };
}

