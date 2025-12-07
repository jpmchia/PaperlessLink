"use client";
/*
 * This component is based on Subframe design: https://app.subframe.com/af1371ce7f26/design/c6c8ef98-90c2-4959-8c27-88b679b2283b/edit
 * TODO: Replace this placeholder with the actual exported code from Subframe
 */

import React, { useMemo, useRef, useCallback } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { EnhancedTable } from "@/ui/components/EnhancedTable";
import { Button } from "@/ui/components/Button";
import { useTags, useCorrespondents, useDocumentTypes, useSettings, useCustomFields } from "@/lib/api/hooks";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { CustomView } from "@/app/data/custom-view";
import { useDocumentFilters, FilterVisibility } from "./documents/useDocumentFilters";
import { useDocumentList } from "./documents/useDocumentList";
import { useTableState } from "./documents/useTableState";
import { useTableColumns } from "./documents/useTableColumns";
import { FilterBar } from "./documents/FilterBar";
import { DocumentPreviewPanel } from "./documents/DocumentPreviewPanel";
import { createLookupMaps } from "./documents/documentUtils";
import { DocumentsCustomViewHeader } from "./documents/components/DocumentsCustomViewHeader";
import { useSettingsSync } from "./documents/hooks/useSettingsSync";
import { useCustomViewManagement } from "./documents/hooks/useCustomViewManagement";
import { useColumnConfiguration } from "./documents/hooks/useColumnConfiguration";
import { useUnsavedChanges } from "./documents/hooks/useUnsavedChanges";
import { useCustomViewActions } from "./documents/hooks/useCustomViewActions";
import { useDocumentActions } from "./documents/hooks/useDocumentActions";
import { usePanelManagement } from "./documents/hooks/usePanelManagement";
import { useTableColumnsWithActions } from "./documents/hooks/useTableColumnsWithActions";

const DEFAULT_PAGE_SIZE = 50;

export function DocumentsCustomView() {
  // React Query data
  const { data: tagsData } = useTags();
  const { data: correspondentsData } = useCorrespondents();
  const { data: documentTypesData } = useDocumentTypes();
  const { data: customFieldsData } = useCustomFields();
  const { settings, getSettings } = useSettings();
  
  // Settings synchronization
  useSettingsSync({ getSettings });
  
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

  // Custom hooks
  const tableState = useTableState();
  
  const customViewManagement = useCustomViewManagement({ tableState });
  const {
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
  } = customViewManagement;

  const columnConfig = useColumnConfiguration({
    customFields,
    appliedCustomView,
    settings,
    pendingColumnOrder,
    pendingColumnVisibility,
  });
  const {
    visibleCustomFieldColumns,
    columnOrderFromSettings,
    columnVisibilityFromSettings,
    enabledBuiltInFields,
    builtInFieldWidths,
    columnSizingFromSettings,
  } = columnConfig;

  // Filter visibility from settings
  const filterVisibilityFromSettings = useMemo(() => {
    if (pendingFilterVisibility !== null) {
      return pendingFilterVisibility;
    }
    if (appliedCustomView?.filter_visibility) {
      return appliedCustomView.filter_visibility;
    }
    return {};
  }, [appliedCustomView, pendingFilterVisibility]);

  const { filters, filterVisibility: globalFilterVisibility, updateFilter, updateFilterVisibility } = useDocumentFilters();
  
  // Compute effective filter visibility: merge custom view settings with global defaults
  const effectiveFilterVisibility = useMemo(() => {
    // Start with global filter visibility as defaults
    const effective: FilterVisibility = { ...globalFilterVisibility };
    
    // Override with custom view filter visibility if available
    if (appliedCustomView?.filter_visibility || pendingFilterVisibility !== null) {
      const customViewFilterVisibility = pendingFilterVisibility ?? appliedCustomView?.filter_visibility ?? {};
      
      // Debug: Log what we're working with
      console.log('[DocumentsCustomView] Computing effectiveFilterVisibility:', {
        appliedCustomView: appliedCustomView?.name,
        appliedCustomViewId: appliedCustomView?.id,
        customViewFilterVisibility,
        pendingFilterVisibility,
        globalFilterVisibility,
        hasFilterVisibility: !!appliedCustomView?.filter_visibility,
        filterVisibilityKeys: appliedCustomView?.filter_visibility ? Object.keys(appliedCustomView.filter_visibility) : [],
      });
      
      // Map custom view filter visibility keys to FilterVisibility keys
      // The custom view uses keys like "storagePath", "owner", "asn", etc.
      const filterKeys: Array<keyof FilterVisibility> = ['dateRange', 'category', 'correspondent', 'tags', 'storagePath', 'owner', 'status', 'asn'];
      filterKeys.forEach((filterKey) => {
        // Check if custom view has this filter visibility setting (including false values)
        if (filterKey in customViewFilterVisibility) {
          const value = customViewFilterVisibility[filterKey];
          // Handle boolean, string, or number values
          if (typeof value === 'boolean') {
            effective[filterKey] = value;
          } else if (typeof value === 'string') {
            effective[filterKey] = value === 'true';
          } else if (typeof value === 'number') {
            effective[filterKey] = value === 1;
          } else {
            effective[filterKey] = !!value;
          }
        }
      });
      
      console.log('[DocumentsCustomView] Computed effectiveFilterVisibility:', effective);
    } else {
      console.log('[DocumentsCustomView] No custom view filter visibility, using global:', globalFilterVisibility);
    }
    
    return effective;
  }, [globalFilterVisibility, appliedCustomView?.filter_visibility, appliedCustomView?.id, appliedCustomView?.name, pendingFilterVisibility]);
  
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
  } = useDocumentList(DEFAULT_PAGE_SIZE, filters);

  // Pin and selection state
  const [pinnedDocuments, setPinnedDocuments] = React.useState<Set<number>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = React.useState<Set<number>>(new Set());
  
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

  // Table columns
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

  // Document actions
  const documentActions = useDocumentActions();
  const {
    selectedDocument,
    deletingDocId,
    handleViewDocument,
    handleDownloadDocument,
    handleDeleteDocument: handleDeleteDocumentBase,
    handleRowClick,
  } = documentActions;

  const handleDeleteDocument = useCallback(async (docId: number | undefined) => {
    await handleDeleteDocumentBase(docId, refetchDocuments);
  }, [handleDeleteDocumentBase, refetchDocuments]);

  // Table columns with actions
  const tableColumnsResult = useTableColumnsWithActions({
    baseColumns,
    columnOrderFromSettings: columnOrderFromSettings ?? null,
    onView: handleViewDocument,
    onDownload: handleDownloadDocument,
    onDelete: handleDeleteDocument,
    deletingDocId,
  });
  const { columns, tanStackColumnOrder } = tableColumnsResult;

  // Column change handlers
  const handleColumnOrderChange = useCallback((newOrder: (string | number)[]) => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId !== 'number') {
      return;
    }
    setPendingColumnOrder(newOrder);
    tableState.setColumnOrder(newOrder.map(id => String(id)));
  }, [appliedCustomView, selectedCustomViewId, setPendingColumnOrder, tableState.setColumnOrder]);

  const handleColumnVisibilityChange = useCallback((columnId: string | number, visible: boolean) => {
    if (!appliedCustomView || !selectedCustomViewId || typeof selectedCustomViewId === 'number') {
      return;
    }

    const visibilityKey = typeof columnId === 'number' 
      ? `customField_${columnId}` 
      : String(columnId);

    const currentVisibility = pendingColumnVisibility ?? appliedCustomView.column_visibility ?? {};
    const currentOrder = pendingColumnOrder ?? appliedCustomView.column_order ?? [];

    const newVisibility = {
      ...currentVisibility,
      [visibilityKey]: visible,
    };

    let newOrder = [...currentOrder];
    if (visible) {
      if (!newOrder.includes(columnId) && !newOrder.includes(visibilityKey)) {
        newOrder.push(columnId);
      }
    } else {
      newOrder = newOrder.filter(id => id !== columnId && id !== visibilityKey);
    }

    setPendingColumnVisibility(newVisibility);
    setPendingColumnOrder(newOrder);
    
    tableState.setColumnOrder(newOrder.map(id => String(id)));
    const visibilityForTable: Record<string, boolean> = {};
    Object.entries(newVisibility).forEach(([key, value]) => {
      visibilityForTable[key] = value !== false;
    });
    tableState.setColumnVisibility(visibilityForTable);
  }, [appliedCustomView, selectedCustomViewId, pendingColumnVisibility, pendingColumnOrder, setPendingColumnVisibility, setPendingColumnOrder, tableState.setColumnOrder, tableState.setColumnVisibility]);

  // Unsaved changes detection
  const { hasUnsavedChanges } = useUnsavedChanges({
    appliedCustomView,
    selectedCustomViewId,
    tableState,
    originalColumnSizing,
    pendingColumnOrder,
    columnOrderFromSettings: columnOrderFromSettings ?? null,
    originalColumnOrder,
    pendingColumnVisibility,
    columnVisibilityFromSettings,
    originalColumnVisibility,
    filterVisibilityFromSettings,
    originalFilterVisibility,
  });

  // Custom view actions (save/revert/save-as)
  const { handleSave, handleRevert, handleSaveAs } = useCustomViewActions({
    appliedCustomView,
    selectedCustomViewId,
    tableState,
    pendingColumnOrder,
    pendingColumnVisibility,
    pendingFilterVisibility,
    originalColumnSizing,
    originalColumnOrder,
    originalColumnVisibility,
    originalFilterVisibility,
    setIsSaving,
    setPendingColumnOrder,
    setPendingColumnVisibility,
    setPendingFilterVisibility,
    setOriginalColumnSizing: customViewManagement.setOriginalColumnSizing || (() => {}),
    setOriginalColumnOrder: customViewManagement.setOriginalColumnOrder || (() => {}),
    setOriginalColumnVisibility: customViewManagement.setOriginalColumnVisibility || (() => {}),
    setOriginalFilterVisibility: customViewManagement.setOriginalFilterVisibility || (() => {}),
    setSelectedCustomViewId,
    updateCustomView,
    createCustomView: async (data: Partial<CustomView>) => {
      // Ensure name is required
      if (!data.name) {
        throw new Error('View name is required');
      }
      return createCustomView({ ...data, name: data.name } as any);
    },
    refetchCustomViews,
    applyCustomView,
    tableStateSetters: {
      setColumnSizing: tableState.setColumnSizing,
      setColumnOrder: tableState.setColumnOrder,
      setColumnVisibility: tableState.setColumnVisibility,
    },
  });

  // Panel management
  const { panelWidth, isPanelVisible, setIsPanelVisible, handleResizeStart } = usePanelManagement();

  // Filter visibility change handlers
  const handleFilterVisibilityChange = useCallback((key: keyof FilterVisibility, visible: boolean) => {
    updateFilterVisibility[key](visible);
    
    if (appliedCustomView && selectedCustomViewId && typeof selectedCustomViewId === 'number') {
      const currentFilterVisibility = pendingFilterVisibility ?? appliedCustomView.filter_visibility ?? {};
      const updatedFilterVisibility = {
        ...currentFilterVisibility,
        [key]: visible,
      };
      
      // Debug: Log filter visibility change
      console.log('[DocumentsCustomView] Filter visibility changed:', {
        key,
        visible,
        currentFilterVisibility,
        updatedFilterVisibility,
      });
      
      setPendingFilterVisibility(updatedFilterVisibility);
    }
  }, [updateFilterVisibility, appliedCustomView, selectedCustomViewId, pendingFilterVisibility, setPendingFilterVisibility]);

  const handleCustomFieldFilterVisibilityChange = useCallback((fieldId: number, visible: boolean) => {
    if (appliedCustomView && selectedCustomViewId && typeof selectedCustomViewId === 'number') {
      const filterKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${fieldId}`;
      const currentFilterVisibility = pendingFilterVisibility ?? appliedCustomView.filter_visibility ?? {};
      const updatedFilterVisibility = {
        ...currentFilterVisibility,
        [filterKey]: visible,
      };
      setPendingFilterVisibility(updatedFilterVisibility);
    }
  }, [appliedCustomView, selectedCustomViewId, pendingFilterVisibility, setPendingFilterVisibility]);

  // Other handlers
  const handleAddDocument = useCallback(() => {
    console.log("Upload document clicked");
  }, []);

  const handleExport = useCallback(() => {
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

  // Refs for UI elements
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  return (
    <DefaultPageLayout>
      <div className="flex flex-col items-start w-full h-full overflow-hidden">
        {/* Header with Custom View Selector */}
        <DocumentsCustomViewHeader
          selectedViewName={selectedViewName}
          customViews={customViews}
          customViewsLoading={customViewsLoading}
          selectedCustomViewId={selectedCustomViewId}
          onSelectView={setSelectedCustomViewId}
          appliedCustomView={appliedCustomView}
          filterVisibility={effectiveFilterVisibility}
          onFilterVisibilityChange={handleFilterVisibilityChange}
          onCustomFieldFilterVisibilityChange={handleCustomFieldFilterVisibilityChange}
          customFields={customFields}
          settings={settings}
          columnOrder={(columnOrderFromSettings ?? [])}
          columnVisibility={columnVisibilityFromSettings}
          onColumnOrderChange={handleColumnOrderChange}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={handleSave}
          onRevert={handleRevert}
          onSaveAs={handleSaveAs}
          pendingFilterVisibility={pendingFilterVisibility}
          onExport={handleExport}
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
        />
        
        {/* Search and Filters Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterVisibility={effectiveFilterVisibility}
          filters={filters}
          updateFilter={updateFilter}
          documentTypes={documentTypes}
          correspondents={correspondents}
          tags={tags}
          customFields={customFields}
          appliedCustomView={appliedCustomView}
          settings={settings}
          pendingFilterVisibility={pendingFilterVisibility}
          onAddDocument={handleAddDocument}
          filterBarRef={filterBarRef}
          totalCount={totalCount}
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
