"use client";
/*
 * This component is based on Subframe design: https://app.subframe.com/af1371ce7f26/design/c6c8ef98-90c2-4959-8c27-88b679b2283b/edit
 * TODO: Replace this placeholder with the actual exported code from Subframe
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { EnhancedTable } from "@/ui/components/EnhancedTable";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { Badge } from "@/ui/components/Badge";
import { FeatherMoreHorizontal, FeatherEye, FeatherDownload, FeatherShare2, FeatherTrash, FeatherChevronDown, FeatherSave, FeatherRotateCcw, FeatherColumns, FeatherCopy } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { useDocuments, useTags, useCorrespondents, useDocumentTypes, useSettings, useCustomFields, useCustomViews } from "@/lib/api/hooks";
import { CustomView } from "@/app/data/custom-view";
import { Document } from "@/app/data/document";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { CustomField } from "@/app/data/custom-field";
import { getDefaultTableDisplayType } from "@/ui/components/settings/customFieldHelpers";
import { useDocumentFilters } from "./documents/useDocumentFilters";
import { useDocumentList } from "./documents/useDocumentList";
import { useTableState } from "./documents/useTableState";
import { useTableColumns } from "./documents/useTableColumns";
import { FilterBar } from "./documents/FilterBar";
import { DocumentPreviewPanel } from "./documents/DocumentPreviewPanel";
import { createLookupMaps } from "./documents/documentUtils";
import { ColumnVisibilityDropdown } from "./documents/ColumnVisibilityDropdown";

const DEFAULT_PAGE_SIZE = 50;

export function DocumentsCustomView() {
  const router = useRouter();
  const { delete: deleteDocument, service } = useDocuments();
  
  // React Query data - use directly, no need to copy to state
  const { data: tagsData } = useTags();
  const { data: correspondentsData } = useCorrespondents();
  const { data: documentTypesData } = useDocumentTypes();
  const { data: customFieldsData } = useCustomFields();
  const { settings, getSettings } = useSettings();
  
  // Listen for settings updates
  useEffect(() => {
    let lastCheckedTimestamp: string | null = null;
    
    const handleSettingsSaved = () => {
      getSettings();
    };
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'settingsUpdated') {
        getSettings();
        // Clear the flag after handling
        if (typeof window !== 'undefined') {
          localStorage.removeItem('settingsUpdated');
        }
      }
    };
    
    window.addEventListener('settingsSaved', handleSettingsSaved);
    window.addEventListener('storage', handleStorageChange);
    
    // Check localStorage once on mount for any pending updates
    if (typeof window !== 'undefined') {
      const lastUpdate = localStorage.getItem('settingsUpdated');
      if (lastUpdate) {
        lastCheckedTimestamp = lastUpdate;
        getSettings();
        // Clear the flag after handling
        localStorage.removeItem('settingsUpdated');
      }
    }
    
    // Also check localStorage periodically for cross-tab updates (but only if timestamp changed)
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        const currentUpdate = localStorage.getItem('settingsUpdated');
        if (currentUpdate && currentUpdate !== lastCheckedTimestamp) {
          lastCheckedTimestamp = currentUpdate;
          getSettings();
          // Clear the flag after handling
          localStorage.removeItem('settingsUpdated');
        }
      }
    }, 2000); // Check every 2 seconds instead of 1
    
    return () => {
      window.removeEventListener('settingsSaved', handleSettingsSaved);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [getSettings]);
  
  // Extract arrays from React Query results
  const tags = useMemo(() => tagsData?.results || [], [tagsData]);
  const correspondents = useMemo(() => correspondentsData?.results || [], [correspondentsData]);
  const documentTypes = useMemo(() => documentTypesData?.results || [], [documentTypesData]);
  const customFields = useMemo(() => customFieldsData?.results || [], [customFieldsData]);
  
  // Create lookup maps for efficient ID-to-name conversions
  const documentTypeMap = useMemo(() => createLookupMaps(documentTypes), [documentTypes]);
  const correspondentMap = useMemo(() => createLookupMaps(correspondents), [correspondents]);
  const tagMap = useMemo(() => createLookupMaps(tags), [tags]);
  
  // Helper functions - memoized
  const getDocumentTypeName = useCallback((typeId: number | undefined): string => {
    if (!typeId) return "";
    return documentTypeMap.get(typeId) || "";
  }, [documentTypeMap]);

  const getCorrespondentName = useCallback((corrId: number | undefined): string => {
    if (!corrId) return "";
    return correspondentMap.get(corrId) || "";
  }, [correspondentMap]);

  const getTagName = useCallback((tagId: number): string => {
    return tagMap.get(tagId) || `Tag ${tagId}`;
  }, [tagMap]);

  // Custom views
  const { customViews, isLoading: customViewsLoading, refetch: refetchCustomViews, update: updateCustomView, create: createCustomView } = useCustomViews();
  
  // Selected custom view state
  const [selectedCustomViewId, setSelectedCustomViewId] = useState<number | string | null>(null);
  const [appliedCustomView, setAppliedCustomView] = useState<CustomView | null>(null);
  const [originalColumnSizing, setOriginalColumnSizing] = useState<Record<string, number>>({});
  const [originalColumnOrder, setOriginalColumnOrder] = useState<(string | number)[]>([]);
  const [originalColumnVisibility, setOriginalColumnVisibility] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for pending changes (not yet saved)
  const [pendingColumnOrder, setPendingColumnOrder] = useState<(string | number)[] | null>(null);
  const [pendingColumnVisibility, setPendingColumnVisibility] = useState<Record<string, boolean> | null>(null);
  
  // Pin and selection state
  const [pinnedDocuments, setPinnedDocuments] = useState<Set<number>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  
  // Toggle pin handler
  const handleTogglePin = useCallback((docId: number) => {
    setPinnedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  }, []);
  
  // Toggle selection handler
  const handleToggleSelect = useCallback((docId: number) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  }, []);
  
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

  // Get custom fields that should be displayed as table columns, sorted by display order
  // Use custom view settings if available, otherwise fall back to global settings
  const visibleCustomFieldColumns = useMemo(() => {
    if (!customFields.length) return [];
    
    // Use custom view settings if available
    if (appliedCustomView) {
      const columnFields: Array<{ field: CustomField; displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'; columnWidth?: number }> = [];
      
      // Get column order from custom view (includes both built-in and custom fields)
      const columnOrder = appliedCustomView.column_order || [];
      
      // Extract custom field IDs from column_order (they're numbers)
      const customFieldIdsInOrder = columnOrder.filter((id): id is number => typeof id === 'number');
      
      // Get visibility map from custom view
      const columnVisibility = appliedCustomView.column_visibility || {};
      
      // Get display types and sizing from custom view
      const columnDisplayTypes = appliedCustomView.column_display_types || {};
      const columnSizing = appliedCustomView.column_sizing || {};
      
      // Create a map of custom fields by ID for quick lookup
      const customFieldMap = new Map<number, CustomField>();
      customFields.forEach(field => {
        if (field.id !== undefined) {
          customFieldMap.set(field.id, field);
        }
      });
      
      // Process fields in the order specified by column_order
      customFieldIdsInOrder.forEach(fieldId => {
        const field = customFieldMap.get(fieldId);
        if (!field) return;
        
        // Check visibility - use customField_X key format
        const visibilityKey = `customField_${fieldId}`;
        const isVisible = columnVisibility[visibilityKey] !== false;
        
        if (isVisible) {
          const displayType = columnDisplayTypes[fieldId] || getDefaultTableDisplayType(field.data_type);
          const sizingKey = `customField_${fieldId}`;
          const columnWidth = columnSizing[sizingKey];
          
          columnFields.push({
            field,
            displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
            columnWidth: columnWidth ? (typeof columnWidth === 'number' ? columnWidth : parseInt(String(columnWidth), 10)) : undefined,
          });
        }
      });
      
      // Add any remaining custom fields that are visible but not in column_order
      customFields.forEach((field) => {
        if (field.id === undefined) return;
        const visibilityKey = `customField_${field.id}`;
        const isVisible = columnVisibility[visibilityKey] !== false;
        
        // Only add if not already in columnFields
        if (isVisible && !columnFields.find(cf => cf.field.id === field.id)) {
          const displayType = columnDisplayTypes[field.id] || getDefaultTableDisplayType(field.data_type);
          const sizingKey = `customField_${field.id}`;
          const columnWidth = columnSizing[sizingKey];
          
          columnFields.push({
            field,
            displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
            columnWidth: columnWidth ? (typeof columnWidth === 'number' ? columnWidth : parseInt(String(columnWidth), 10)) : undefined,
          });
        }
      });
      
      return columnFields;
    }
    
    // Fall back to global settings
    if (!settings?.settings) return [];
    
    const settingsObj = settings.settings as Record<string, any>;
    const displayOrder = settingsObj[SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER] || [];
    
    // Get all fields that should be displayed as columns
    const columnFields: Array<{ field: CustomField; displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'; columnWidth?: number }> = [];
    
    customFields.forEach((field) => {
      if (field.id === undefined) return;
      const columnKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${field.id}`;
      if (settingsObj[columnKey] === true) {
        const displayTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${field.id}`;
        const columnWidthKey = `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${field.id}`;
        const displayType = settingsObj[displayTypeKey] || getDefaultTableDisplayType(field.data_type);
        const columnWidth = settingsObj[columnWidthKey];
        columnFields.push({
          field,
          displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
          columnWidth: columnWidth ? parseInt(columnWidth, 10) : undefined,
        });
      }
    });
    
    // Sort by display order
    if (displayOrder.length > 0) {
      columnFields.sort((a, b) => {
        const aId = a.field.id!;
        const bId = b.field.id!;
        const aIndex = displayOrder.indexOf(aId);
        const bIndex = displayOrder.indexOf(bId);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }
    
    return columnFields;
  }, [settings, customFields, appliedCustomView]);
  
  // Custom hooks - need to be declared before useEffect that uses tableState
  const { filters, filterVisibility, updateFilter } = useDocumentFilters();
  const {
    documents,
    totalCount,
    currentPage,
    pageSize,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    goToNextPage,
    goToPreviousPage,
    refetch: refetchDocuments,
  } = useDocumentList(DEFAULT_PAGE_SIZE);
  
  const tableState = useTableState();
  
  // Apply the selected custom view - this function applies all view settings to the table
  const applyCustomView = useCallback((view: CustomView) => {
    setAppliedCustomView(view);
    
    // Store original state for revert functionality
    setOriginalColumnSizing(view.column_sizing || {});
    setOriginalColumnOrder(view.column_order || []);
    setOriginalColumnVisibility(view.column_visibility || {});
    
    // Clear pending changes
    setPendingColumnOrder(null);
    setPendingColumnVisibility(null);
    
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
        applyCustomView(view);
        // Persist selection
        if (typeof window !== 'undefined') {
          localStorage.setItem('lastSelectedCustomViewId', String(selectedCustomViewId));
        }
      } else {
        setAppliedCustomView(null);
        setOriginalColumnSizing({});
      }
    } else {
      setAppliedCustomView(null);
      setOriginalColumnSizing({});
    }
  }, [selectedCustomViewId, customViews, applyCustomView]);
  
  // Listen for custom view updates (when settings modal closes or views are saved)
  useEffect(() => {
    const handleCustomViewsUpdated = async () => {
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
          applyCustomView(view);
        }
      }
    };
    
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
    
    // Check localStorage on mount for any pending updates
    if (typeof window !== 'undefined') {
      const customViewsUpdated = localStorage.getItem('customViewsUpdated');
      if (customViewsUpdated) {
        handleCustomViewsUpdated();
        localStorage.removeItem('customViewsUpdated');
      }
    }
    
    return () => {
      window.removeEventListener('customViewsUpdated', handleCustomViewsUpdated);
      window.removeEventListener('settingsSaved', handleCustomViewsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [selectedCustomViewId, refetchCustomViews, applyCustomView]);
  
  // Get column order from custom view or settings (use pending if available) - declare before hasUnsavedChanges
  const columnOrderFromSettings = useMemo(() => {
    // Prefer pending changes, then custom view column order
    if (pendingColumnOrder !== null) {
      return pendingColumnOrder;
    }
    if (appliedCustomView?.column_order) {
      return appliedCustomView.column_order;
    }
    
    // Fall back to global settings
    if (!settings?.settings) return null;
    const settingsObj = settings.settings as Record<string, any>;
    return settingsObj[SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER] as (string | number)[] | undefined;
  }, [settings, appliedCustomView, pendingColumnOrder]);

  // Get column visibility from custom view or settings (use pending if available) - declare before hasUnsavedChanges
  const columnVisibilityFromSettings = useMemo(() => {
    // Prefer pending changes, then custom view column visibility
    if (pendingColumnVisibility !== null) {
      return pendingColumnVisibility;
    }
    if (appliedCustomView?.column_visibility) {
      return appliedCustomView.column_visibility;
    }
    
    // Fall back to empty object (all visible by default)
    return {};
  }, [appliedCustomView, pendingColumnVisibility]);

  // Check if there are unsaved changes (sizing, order, or visibility)
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
    const currentOrder = (pendingColumnOrder ?? columnOrderFromSettings) || [];
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
    
    return false;
  }, [appliedCustomView, selectedCustomViewId, tableState.columnSizing, originalColumnSizing, pendingColumnOrder, columnOrderFromSettings, originalColumnOrder, pendingColumnVisibility, columnVisibilityFromSettings, originalColumnVisibility]);
  
  // Save changes handler
  const handleSave = useCallback(async () => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId !== 'number') {
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
      
      // Get pending order and visibility, or use current
      const updatedOrder = pendingColumnOrder ?? appliedCustomView.column_order ?? [];
      const updatedVisibility = pendingColumnVisibility ?? appliedCustomView.column_visibility ?? {};
      
      // Update the custom view
      await updateCustomView({
        id: selectedCustomViewId,
        data: {
          column_sizing: updatedColumnSizing,
          column_order: updatedOrder,
          column_visibility: updatedVisibility,
        },
      });
      
      // Update the original state to match the new saved state
      setOriginalColumnSizing(updatedColumnSizing);
      setOriginalColumnOrder(updatedOrder);
      setOriginalColumnVisibility(updatedVisibility);
      
      // Clear pending changes
      setPendingColumnOrder(null);
      setPendingColumnVisibility(null);
      
      // Refetch views to get the latest
      await refetchCustomViews();
      
      // TODO: Show success toast
    } catch (error) {
      console.error('Failed to save custom view:', error);
      // TODO: Show error toast
    } finally {
      setIsSaving(false);
    }
  }, [appliedCustomView, selectedCustomViewId, tableState.columnSizing, pendingColumnOrder, pendingColumnVisibility, updateCustomView, refetchCustomViews]);
  
  // Revert changes handler
  const handleRevert = useCallback(() => {
    if (!appliedCustomView) {
      return;
    }
    
    // Reset column sizing to original
    tableState.setColumnSizing(originalColumnSizing);
    
    // Reset column order to original
    if (originalColumnOrder.length > 0) {
      tableState.setColumnOrder(originalColumnOrder.map(id => String(id)));
    }
    
    // Reset column visibility to original
    const visibilityForTable: Record<string, boolean> = {};
    Object.entries(originalColumnVisibility).forEach(([key, value]) => {
      visibilityForTable[key] = value !== false;
    });
    tableState.setColumnVisibility(visibilityForTable);
    
    // Clear pending changes
    setPendingColumnOrder(null);
    setPendingColumnVisibility(null);
  }, [appliedCustomView, originalColumnSizing, originalColumnOrder, originalColumnVisibility, tableState.setColumnSizing, tableState.setColumnOrder, tableState.setColumnVisibility]);

  // Save As handler - creates a new view with current changes
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
      
      // Get pending order and visibility, or use current
      const updatedOrder = pendingColumnOrder ?? appliedCustomView.column_order ?? [];
      const updatedVisibility = pendingColumnVisibility ?? appliedCustomView.column_visibility ?? {};
      
      // Create new view with current settings
      const newView = await createCustomView({
        name: newViewName.trim(),
        description: appliedCustomView.description || '',
        is_global: appliedCustomView.is_global || false,
        column_order: updatedOrder,
        column_visibility: updatedVisibility,
        column_sizing: updatedColumnSizing,
        column_display_types: appliedCustomView.column_display_types || {},
        filters: appliedCustomView.filters || {},
        sort_order: appliedCustomView.sort_order || [],
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
  }, [appliedCustomView, tableState.columnSizing, pendingColumnOrder, pendingColumnVisibility, createCustomView, refetchCustomViews]);
  
  // Document selection state
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  
  // Document action handlers - memoized
  const handleViewDocument = useCallback((docId: number | undefined) => {
    if (docId) {
      router.push(`/documents/${docId}`);
    }
  }, [router]);

  const handleDownloadDocument = useCallback((docId: number | undefined) => {
    if (docId) {
      const downloadUrl = service.getDownloadUrl(docId);
      window.open(downloadUrl, '_blank');
    }
  }, [service]);

  const handleDeleteDocument = useCallback(async (docId: number | undefined) => {
    if (!docId) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete this document? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeletingDocId(docId);
      await deleteDocument(docId);
      await refetchDocuments();
      // Clear selection if deleted document was selected
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
    } catch (error) {
      console.error("Failed to delete document:", error);
    } finally {
      setDeletingDocId(null);
    }
  }, [deleteDocument, refetchDocuments, selectedDocument]);

  // Get enabled built-in fields and their widths from custom view or settings
  const { enabledBuiltInFields, builtInFieldWidths } = useMemo(() => {
    // Use custom view settings if available, otherwise fall back to global settings
    if (appliedCustomView) {
      const enabled = new Set<string>();
      const widths = new Map<string, number>();
      
      // Get visibility and widths from custom view
      ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner'].forEach(fieldId => {
        const isEnabled = appliedCustomView.column_visibility?.[fieldId] !== false;
        if (isEnabled) {
          enabled.add(fieldId);
          
          // Get column width from custom view
          const width = appliedCustomView.column_sizing?.[fieldId];
          if (width && width > 0) {
            widths.set(fieldId, width);
          }
        }
      });
      
      return { enabledBuiltInFields: enabled, builtInFieldWidths: widths };
    }
    
    // Fall back to global settings
    if (!settings?.settings) {
      // Default: all built-in fields enabled (tags are shown under title, not as separate column)
      return {
        enabledBuiltInFields: new Set(['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner']),
        builtInFieldWidths: new Map<string, number>(),
      };
    }
    const settingsObj = settings.settings as Record<string, any>;
    const enabled = new Set<string>();
    const widths = new Map<string, number>();
    
    ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner'].forEach(fieldId => {
      const key = `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX}${fieldId}`;
      // Default to true if not set (only exclude if explicitly false)
      const isEnabled = settingsObj[key] !== false;
      if (isEnabled) {
        enabled.add(fieldId);
        
        // Get column width for this field
        const widthKey = `general-settings:documents:built-in-field:column-width:${fieldId}`;
        const widthValue = settingsObj[widthKey];
        if (widthValue) {
          const width = typeof widthValue === 'number' ? widthValue : parseInt(String(widthValue), 10);
          if (!isNaN(width) && width > 0) {
            widths.set(fieldId, width);
          }
        }
      }
    });
    
    return { enabledBuiltInFields: enabled, builtInFieldWidths: widths };
  }, [settings, appliedCustomView]);

  // Table columns - memoized
  const baseColumns = useTableColumns({
    documentTypes,
    visibleCustomFieldColumns,
    enabledBuiltInFields,
    builtInFieldWidths,
    getDocumentTypeName,
    getTagName,
    getCorrespondentName,
    pinnedDocuments,
    selectedDocuments,
    onTogglePin: handleTogglePin,
    onToggleSelect: handleToggleSelect,
  });

  // Handler to update column order in custom view (local state only, not saved yet)
  const handleColumnOrderChange = useCallback((newOrder: (string | number)[]) => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId !== 'number') {
      return;
    }

    // Store pending change locally
    setPendingColumnOrder(newOrder);
    
    // Apply to table immediately for visual feedback
    tableState.setColumnOrder(newOrder.map(id => String(id)));
  }, [appliedCustomView, selectedCustomViewId, tableState.setColumnOrder]);

  // Handler to update column visibility in custom view (local state only, not saved yet)
  const handleColumnVisibilityChange = useCallback((columnId: string | number, visible: boolean) => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId !== 'number') {
      return;
    }

    const visibilityKey = typeof columnId === 'number' 
      ? `customField_${columnId}` 
      : String(columnId);

    // Get current state (pending or original)
    const currentVisibility = pendingColumnVisibility ?? appliedCustomView.column_visibility ?? {};
    const currentOrder = pendingColumnOrder ?? appliedCustomView.column_order ?? [];

    // Update visibility
    const newVisibility = {
      ...currentVisibility,
      [visibilityKey]: visible,
    };

    // Update column_order - add if visible, remove if hidden
    let newOrder = [...currentOrder];
    if (visible) {
      // Add to order if not present
      if (!newOrder.includes(columnId) && !newOrder.includes(visibilityKey)) {
        newOrder.push(columnId);
      }
    } else {
      // Remove from order
      newOrder = newOrder.filter(id => id !== columnId && id !== visibilityKey);
    }

    // Store pending changes locally
    setPendingColumnVisibility(newVisibility);
    setPendingColumnOrder(newOrder);
    
    // Apply to table immediately for visual feedback
    tableState.setColumnOrder(newOrder.map(id => String(id)));
    const visibilityForTable: Record<string, boolean> = {};
    Object.entries(newVisibility).forEach(([key, value]) => {
      visibilityForTable[key] = value !== false;
    });
    tableState.setColumnVisibility(visibilityForTable);
  }, [appliedCustomView, selectedCustomViewId, pendingColumnVisibility, pendingColumnOrder, tableState.setColumnOrder, tableState.setColumnVisibility]);

  // Add actions column and apply column order
  const columns = useMemo(() => {
    const actionsColumn = {
      id: "actions",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 50,
      cell: ({ row }: { row: { original: Document } }) => {
        const doc = row.original;
        return (
          <div className="flex grow shrink-0 basis-0 items-center justify-end">
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <IconButton
                  size="small"
                  icon={<FeatherMoreHorizontal />}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                  }}
                />
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  asChild={true}
                  style={{ zIndex: 100 }}
                >
                  <DropdownMenu>
                    <DropdownMenu.DropdownItem
                      icon={<FeatherEye />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleViewDocument(doc.id);
                      }}
                    >
                      View
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem
                      icon={<FeatherDownload />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDownloadDocument(doc.id);
                      }}
                    >
                      Download
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem
                      icon={<FeatherShare2 />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        // TODO: Implement share functionality
                      }}
                    >
                      Share
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownItem
                      icon={<FeatherTrash />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        if (deletingDocId !== doc.id) {
                          handleDeleteDocument(doc.id);
                        }
                      }}
                    >
                      {deletingDocId === doc.id ? "Deleting..." : "Delete"}
                    </DropdownMenu.DropdownItem>
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          </div>
        );
      },
    };

    // Pin/select column is already first in baseColumns, so we insert actions as second
    const pinSelectColumn = baseColumns.find(col => col.id === 'pin-select');
    const otherBaseColumns = baseColumns.filter(col => col.id !== 'pin-select');
    const allColumns = pinSelectColumn 
      ? [pinSelectColumn, actionsColumn, ...otherBaseColumns]
      : [actionsColumn, ...baseColumns];

    // Apply column order if available
    if (columnOrderFromSettings && columnOrderFromSettings.length > 0) {
      // Create a set of available column IDs for quick lookup
      const availableColumnIds = new Set(allColumns.map(col => String(col.id)));
      
      // Create a map of columns by their IDs (both direct IDs and customField_ prefixed)
      const columnMap = new Map<string, typeof allColumns[0]>();
      allColumns.forEach(col => {
        columnMap.set(String(col.id), col);
        // For custom fields, also map by the field ID without prefix (as number or string)
        if (col.id?.startsWith('customField_')) {
          const fieldId = col.id.replace('customField_', '');
          columnMap.set(fieldId, col);
          // Also map by numeric ID if it's a number
          const numFieldId = parseInt(fieldId, 10);
          if (!isNaN(numFieldId)) {
            columnMap.set(String(numFieldId), col);
          }
        }
      });
      
      const orderedColumns: typeof allColumns = [];
      const processedIds = new Set<string>();

      // Add columns in order from settings, but only if they're actually available (enabled)
      columnOrderFromSettings.forEach(id => {
        // Try both string and number representations
        const idStr = String(id);
        const col = columnMap.get(idStr) || columnMap.get(String(id));
        
        // Only add if column exists and hasn't been processed yet
        if (col && availableColumnIds.has(String(col.id)) && !processedIds.has(String(col.id))) {
          orderedColumns.push(col);
          processedIds.add(String(col.id));
        }
      });

      // Add any remaining columns that weren't in the order
      // Pin/select should always be first, actions should always be second
      // This ensures all enabled columns are shown even if not in the order
      const pinSelectCol = allColumns.find(col => col.id === 'pin-select');
      const actionsCol = allColumns.find(col => col.id === 'actions');
      
      // Ensure pin-select is first if it exists
      if (pinSelectCol && !processedIds.has('pin-select')) {
        orderedColumns.unshift(pinSelectCol);
        processedIds.add('pin-select');
      }
      
      // Ensure actions is second if it exists
      if (actionsCol && !processedIds.has('actions')) {
        const insertIndex = orderedColumns.findIndex(col => col.id === 'pin-select') >= 0 ? 1 : 0;
        orderedColumns.splice(insertIndex, 0, actionsCol);
        processedIds.add('actions');
      }
      
      // Add other remaining columns
      allColumns.forEach(col => {
        if (!processedIds.has(String(col.id)) && col.id !== 'actions' && col.id !== 'pin-select') {
          orderedColumns.push(col);
          processedIds.add(String(col.id));
        }
      });

      return orderedColumns;
    }

    return allColumns;
  }, [baseColumns, columnOrderFromSettings, handleViewDocument, handleDownloadDocument, handleDeleteDocument, deletingDocId]);

  // Compute TanStack Table column order from the ordered columns
  const tanStackColumnOrder = useMemo(() => {
    return columns.map(col => col.id!);
  }, [columns]);

  // Compute column sizing from custom view or settings (for both built-in and custom fields)
  const columnSizingFromSettings = useMemo(() => {
    // Use custom view column sizing if available
    if (appliedCustomView?.column_sizing) {
      return { ...appliedCustomView.column_sizing };
    }
    
    // Fall back to global settings
    if (!settings?.settings) return {};
    const settingsObj = settings.settings as Record<string, any>;
    const sizing: Record<string, number> = {};
    
    // Add built-in field widths
    ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner'].forEach(fieldId => {
      const widthKey = `general-settings:documents:built-in-field:column-width:${fieldId}`;
      const widthValue = settingsObj[widthKey];
      if (widthValue) {
        const width = typeof widthValue === 'number' ? widthValue : parseInt(String(widthValue), 10);
        if (!isNaN(width) && width > 0) {
          sizing[fieldId] = width;
        }
      }
    });
    
    // Add custom field widths
    customFields.forEach(field => {
      if (field.id === undefined) return;
      const widthKey = `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${field.id}`;
      const widthValue = settingsObj[widthKey];
      if (widthValue) {
        const width = typeof widthValue === 'number' ? widthValue : parseInt(String(widthValue), 10);
        if (!isNaN(width) && width > 0) {
          sizing[`customField_${field.id}`] = width;
        }
      }
    });
    
    return sizing;
  }, [settings, customFields, appliedCustomView]);
  
  // Panel state
  const [panelWidth, setPanelWidth] = useState<number>(768);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);
  
  // Refs for UI elements
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  // Load panel width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('documentsPanelWidth');
      if (saved) {
        const savedWidth = parseInt(saved, 10);
        const maxWidth = Math.round(window.innerWidth * 0.7);
        setPanelWidth(Math.min(savedWidth, maxWidth));
      } else {
        const defaultWidth = Math.max(400, Math.round(window.innerWidth * 0.3));
        setPanelWidth(defaultWidth);
      }
    }
  }, []);

  const handleRowClick = useCallback((doc: Document) => {
    if (doc?.id) {
      setSelectedDocument(doc);
    }
  }, []);

  // Handle resize for right panel
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const minWidth = 300;
      const maxWidth = typeof window !== 'undefined' ? Math.round(window.innerWidth * 0.7) : 1200;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      setPanelWidth(newWidth);
      if (typeof window !== 'undefined') {
        localStorage.setItem('documentsPanelWidth', newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [panelWidth]);

  const handleAddDocument = useCallback(() => {
    // TODO: Implement document upload modal or navigate to upload page
    console.log("Upload document clicked");
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    console.log("Export clicked");
  }, []);

  // Memoize onStateChange to prevent infinite loops
  const onStateChange = useMemo(() => ({
    onSortingChange: tableState.setSorting,
    onColumnOrderChange: tableState.setColumnOrder,
    onColumnVisibilityChange: tableState.setColumnVisibility,
    onColumnSizingChange: tableState.setColumnSizing,
  }), [tableState.setSorting, tableState.setColumnOrder, tableState.setColumnVisibility, tableState.setColumnSizing]);

  // Memoize initialState to prevent unnecessary re-renders
  const tableInitialState = useMemo(() => ({
    sorting: tableState.sorting,
    columnOrder: tanStackColumnOrder.length > 0 ? tanStackColumnOrder : tableState.columnOrder,
    columnVisibility: tableState.columnVisibility,
    columnSizing: Object.keys(columnSizingFromSettings).length > 0 
      ? { ...tableState.columnSizing, ...columnSizingFromSettings }
      : tableState.columnSizing,
  }), [tableState.sorting, tanStackColumnOrder, tableState.columnOrder, tableState.columnVisibility, tableState.columnSizing, columnSizingFromSettings]);

  // Get names for selected document
  const selectedDocumentTypeName = useMemo(() => {
    if (!selectedDocument?.document_type) return "";
    return getDocumentTypeName(selectedDocument.document_type);
  }, [selectedDocument, getDocumentTypeName]);

  const selectedCorrespondentName = useMemo(() => {
    if (!selectedDocument?.correspondent) return "";
    return getCorrespondentName(selectedDocument.correspondent);
  }, [selectedDocument, getCorrespondentName]);

  // Get selected view name for display
  const selectedViewName = useMemo(() => {
    if (!selectedCustomViewId || !customViews.length) return "Select View";
    const view = customViews.find(v => v.id && typeof v.id === 'number' && v.id === selectedCustomViewId);
    return view?.name || "Select View";
  }, [selectedCustomViewId, customViews]);

  return (
    <DefaultPageLayout>
      <div className="flex flex-col items-start w-full h-full overflow-hidden">
        {/* Header with Custom View Selector */}
        <div className="flex w-full flex-none items-center justify-between gap-4 border-b border-solid border-neutral-border px-6 py-4">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-heading-2 font-heading-2 text-default-font">Custom Views</h1>
          </div>
          <div className="flex items-center gap-2">
            {/* Column Visibility/Order Dropdown - only show when a custom view is selected */}
            {appliedCustomView && selectedCustomViewId && typeof selectedCustomViewId === 'number' && (
              <ColumnVisibilityDropdown
                columnOrder={columnOrderFromSettings || []}
                columnVisibility={columnVisibilityFromSettings}
                onOrderChange={handleColumnOrderChange}
                onVisibilityChange={handleColumnVisibilityChange}
                customFields={customFields}
              />
            )}
            
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  iconRight={<FeatherChevronDown />}
                >
                  {selectedViewName}
                </Button>
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                  style={{ zIndex: 100 }}
                >
                  <DropdownMenu>
                    {customViews.length === 0 && !customViewsLoading ? (
                      <DropdownMenu.DropdownItem disabled icon={null}>
                        No views available
                      </DropdownMenu.DropdownItem>
                    ) : customViewsLoading ? (
                      <DropdownMenu.DropdownItem disabled icon={null}>
                        Loading views...
                      </DropdownMenu.DropdownItem>
                    ) : (
                      <>
                        <DropdownMenu.DropdownItem
                          onClick={() => setSelectedCustomViewId(null)}
                          icon={null}
                        >
                          Default View
                        </DropdownMenu.DropdownItem>
                        {customViews.length > 0 && <DropdownMenu.DropdownDivider />}
                        {customViews.map((view) => {
                          const viewId = view.id as number | string | undefined;
                          if (!viewId || typeof viewId === 'string') return null; // Skip drafts
                          return (
                            <DropdownMenu.DropdownItem
                              key={viewId}
                              onClick={() => setSelectedCustomViewId(viewId)}
                              icon={null}
                            >
                              {view.name}
                              {view.is_global && " (Global)"}
                            </DropdownMenu.DropdownItem>
                          );
                        })}
                      </>
                    )}
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
            
            {/* Save, Revert, and Save As buttons - only show when a custom view is selected */}
            {appliedCustomView && selectedCustomViewId && typeof selectedCustomViewId === 'number' && (
              <>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  icon={<FeatherRotateCcw />}
                  onClick={handleRevert}
                  disabled={!hasUnsavedChanges}
                >
                  Revert
                </Button>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  icon={<FeatherCopy />}
                  onClick={handleSaveAs}
                  disabled={isSaving}
                >
                  Save As...
                </Button>
                <Button
                  variant="brand-primary"
                  size="small"
                  icon={<FeatherSave />}
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Search and Filters Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterVisibility={filterVisibility}
          filters={filters}
          updateFilter={updateFilter}
          documentTypes={documentTypes}
          correspondents={correspondents}
          tags={tags}
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
          onExport={handleExport}
          onAddDocument={handleAddDocument}
          filterBarRef={filterBarRef}
        />

        {/* Main Content Area with Resizable Panel */}
        <div className="flex w-full grow shrink-0 basis-0 items-start overflow-hidden min-h-0">
          {/* Left Panel - Documents List */}
          <div className="flex flex-col items-start gap-3 px-4 py-4 flex-shrink overflow-hidden min-h-0 h-full" style={{ width: isPanelVisible ? `calc(100% - ${panelWidth}px - 4px)` : '100%', minWidth: 0 }}>
            {/* Error Message */}
            {error && (
              <div className="w-full flex-none px-4 py-2 bg-red-50 border border-red-200 rounded text-red-800 text-body font-body">
                {error}
              </div>
            )}

            {/* Documents Table Container */}
            <div ref={tableContainerRef} className="w-full flex-1 min-h-0 flex flex-col">
              <EnhancedTable
                key={`table-${selectedCustomViewId || 'default'}-${JSON.stringify(columnOrderFromSettings)}-${JSON.stringify(columnSizingFromSettings)}`}
                data={documents}
                columns={columns}
                loading={loading}
                onRowClick={handleRowClick}
                enableSorting={true}
                enableColumnResizing={true}
                enableColumnReordering={false}
                enableColumnVisibility={false}
                initialState={tableInitialState}
                onStateChange={onStateChange}
              />
            </div>

            {/* Pagination - Sticky Footer */}
            {totalCount > pageSize && (
              <div ref={paginationRef} className="flex items-center justify-between w-full flex-none border-t border-solid border-neutral-border bg-default-background sticky bottom-0 z-10 py-2">
                <span className="text-body font-body text-subtext-color">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} documents
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="neutral-tertiary"
                    size="small"
                    disabled={currentPage === 1}
                    onClick={goToPreviousPage}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="neutral-tertiary"
                    size="small"
                    disabled={currentPage * pageSize >= totalCount}
                    onClick={goToNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Resizable Divider */}
          {isPanelVisible && (
            <div
              className="w-1 bg-neutral-border cursor-col-resize hover:bg-brand-600 transition-colors flex-shrink-0"
              onMouseDown={handleResizeStart}
            />
          )}

          {/* Right Panel - Document Details */}
          {isPanelVisible && (
            <div 
              className="flex flex-col items-start bg-neutral-0 overflow-y-auto flex-shrink-0 h-full"
              style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px` }}
            >
              <DocumentPreviewPanel
                document={selectedDocument}
                documentTypeName={selectedDocumentTypeName}
                correspondentName={selectedCorrespondentName}
                tagNames={tagMap}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
              />
            </div>
          )}
        </div>
      </div>
    </DefaultPageLayout>
  );
}

