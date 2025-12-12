"use client";
/*
 * This component is based on Subframe design: https://app.subframe.com/af1371ce7f26/design/c6c8ef98-90c2-4959-8c27-88b679b2283b/edit
 */

import React, { useMemo, useRef, useCallback } from "react";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { EnhancedTable } from "@/ui/components/EnhancedTable";
import { Button } from "@/ui/components/Button";
import { useTags, useCorrespondents, useDocumentTypes, useSettings, useCustomFields } from "@/lib/api/hooks";
import { useDocumentFilters, FilterVisibility } from "./documents/useDocumentFilters";
import { useDocumentList } from "./documents/useDocumentList";
import { FilterBar } from "./documents/FilterBar";
import { DocumentPreviewPanel } from "./documents/DocumentPreviewPanel";
import { createLookupMaps, getCustomFieldValue } from "./documents/documentUtils";
import { Badge } from "@/ui/components/Badge";
import { DocumentsCustomViewHeader } from "./documents/components/DocumentsCustomViewHeader";
import { useSettingsSync } from "./documents/hooks/useSettingsSync";
import { useDocumentActions } from "./documents/hooks/useDocumentActions";
import { usePanelManagement } from "./documents/hooks/usePanelManagement";
import { useTableColumnsWithActions } from "./documents/hooks/useTableColumnsWithActions";
import { useTableColumns } from "./documents/useTableColumns";
import { useDocumentsContext } from "./documents/DocumentsContext";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";

const DEFAULT_PAGE_SIZE = 50;

export function DocumentsCustomView() {
  return (
    <DefaultPageLayout>
      <DocumentsTableFeature />
    </DefaultPageLayout>
  );
}

export function DocumentsTableFeature() {
  // Context
  const {
    activeView,
    activeViewId,
    tableConfig,
    availableViews,
    isLoadingViews,
    setActiveViewId,
    updateColumnOrder,
    updateColumnVisibility,
    updateColumnSizing,
    updateColumnSpanning,
    updateSorting,
    hasUnsavedChanges,
    isSaving,
    saveCurrentView,
    createViewFromCurrent,
    discardChanges,
    updateFilterVisibility
  } = useDocumentsContext();

  // React Query data
  const { data: tagsData } = useTags();
  const { data: correspondentsData } = useCorrespondents();
  const { data: documentTypesData } = useDocumentTypes();
  const { data: customFieldsData } = useCustomFields();
  const { settings, getSettings } = useSettings();

  // Settings synchronization (Global settings)
  useSettingsSync({ getSettings });

  // Extract arrays
  const tags = useMemo(() => tagsData?.results || [], [tagsData]);
  const correspondents = useMemo(() => correspondentsData?.results || [], [correspondentsData]);
  const documentTypes = useMemo(() => documentTypesData?.results || [], [documentTypesData]);
  const customFields = useMemo(() => customFieldsData?.results || [], [customFieldsData]);

  // Lookup maps
  const documentTypeMap = useMemo(() => createLookupMaps(documentTypes), [documentTypes]);
  const correspondentMap = useMemo(() => createLookupMaps(correspondents), [correspondents]);
  const tagMap = useMemo(() => createLookupMaps(tags), [tags]);

  // Helper functions
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

  // Filters
  const { filters, filterVisibility: globalFilterVisibility, updateFilter, updateFilterVisibility: updateGlobalFilterVisibility } = useDocumentFilters();

  // Documents List
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

  // Pin / Select
  const [pinnedDocuments, setPinnedDocuments] = React.useState<Set<number>>(new Set());
  const [selectedDocuments, setSelectedDocuments] = React.useState<Set<number>>(new Set());

  const handleTogglePin = useCallback((docId: number) => {
    setPinnedDocuments(prev => {
      const newSet = new Set(prev);
      newSet.has(docId) ? newSet.delete(docId) : newSet.add(docId);
      return newSet;
    });
  }, []);

  const handleToggleSelect = useCallback((docId: number) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      newSet.has(docId) ? newSet.delete(docId) : newSet.add(docId);
      return newSet;
    });
  }, []);

  // Filter Visibility Computation
  // When a view is active, use ONLY the view's filter visibility settings (not merged with global).
  // All filters are rendered dynamically based on what's enabled in the view config.
  const effectiveFilterVisibility = useMemo(() => {
    if (activeViewId && activeView?.filter_visibility) {
      // Use view's filter visibility exclusively - all filters are hidden unless explicitly enabled
      const viewFilters = tableConfig.filterVisibility || {};
      return {
        // Legacy dateRange for backwards compat - true if either created or added is enabled
        dateRange: viewFilters['dateRange'] || viewFilters['created'] || viewFilters['added'] || false,
        // Also expose individual created/added for dynamic rendering
        created: viewFilters['created'] ?? false,
        added: viewFilters['added'] ?? false,
        // Other built-in fields
        category: viewFilters['category'] ?? false,
        correspondent: viewFilters['correspondent'] ?? false,
        tags: viewFilters['tags'] ?? false,
        storagePath: viewFilters['storagePath'] ?? false,
        owner: viewFilters['owner'] ?? false,
        status: viewFilters['status'] ?? false,
        asn: viewFilters['asn'] ?? false,
        title: viewFilters['title'] ?? false,
        page_count: viewFilters['page_count'] ?? false,
        fileSize: viewFilters['fileSize'] ?? false,
        // Include any custom field filter visibility keys (these use customField_ prefix)
        ...viewFilters
      } as FilterVisibility;
    }
    return globalFilterVisibility;
  }, [globalFilterVisibility, tableConfig.filterVisibility, activeViewId, activeView]);

  // Compute Visible Columns from tableConfig
  const { visibleCustomFieldColumns, visibleBuiltInFieldColumns, enabledBuiltInFields, builtInFieldWidths } = useMemo(() => {
    const customCols: any[] = [];
    const enabledBuiltIn = new Set<string>();
    const builtInWidths = new Map<string, number>();

    // Process Custom Fields
    customFields.forEach(field => {
      if (!field.id) return;
      const colId = `customField_${field.id}`;

      // Check visibility - usually explicit state. If not in map, default to visible?
      // With saved layouts, better to be explicit.
      const isVisible = tableConfig.columnVisibility[colId] !== false;

      if (isVisible) {
        const displayType = tableConfig.columnDisplayTypes?.[colId] || tableConfig.columnDisplayTypes?.[String(field.id)] || 'text'; // Fallback
        const width = tableConfig.columnSizing?.[colId];

        customCols.push({
          field,
          displayType,
          columnWidth: width
        });
      }
    });

    // Process Built-in Fields
    // Include 'tags' which is missing from baseColumns fallback
    const builtInKeys = ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner', 'tags'];
    const builtInCols: any[] = []; // Array for useTableColumns

    builtInKeys.forEach(key => {
      // Title is always enabled?
      const isVisible = tableConfig.columnVisibility[key] !== false;
      if (isVisible) {
        enabledBuiltIn.add(key);
        const width = tableConfig.columnSizing?.[key];
        if (width) builtInWidths.set(key, width);

        // Determine display type
        let displayType = 'text';
        if (key === 'created' || key === 'added') displayType = 'date';
        if (key === 'tags') displayType = 'list'; // Default tags to list

        // Override from config if available (e.g. if we add display type config for built-ins later)
        const configDisplayType = tableConfig.columnDisplayTypes?.[key];
        if (configDisplayType) displayType = configDisplayType;

        builtInCols.push({
          fieldId: key,
          displayType,
          columnWidth: width
        });
      }
    });

    return { visibleCustomFieldColumns: customCols, visibleBuiltInFieldColumns: builtInCols, enabledBuiltInFields: enabledBuiltIn, builtInFieldWidths: builtInWidths };
  }, [customFields, tableConfig.columnVisibility, tableConfig.columnSizing, tableConfig.columnDisplayTypes]);

  // Base Columns
  const baseColumns = useTableColumns({
    documentTypes,
    visibleCustomFieldColumns,
    visibleBuiltInFieldColumns, // Pass the populated array
    enabledBuiltInFields,
    builtInFieldWidths,
    getDocumentTypeName,
    getTagName,
    getCorrespondentName,
    pinnedDocuments,
    selectedDocuments,
    onTogglePin: handleTogglePin,
    onToggleSelect: handleToggleSelect,
    columnSpanning: tableConfig.columnSpanning,
    columnStyles: tableConfig.columnStyles,
  });


  // Actions
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

  // Columns with Actions
  const tableColumnsResult = useTableColumnsWithActions({
    baseColumns,
    columnOrderFromSettings: tableConfig.columnOrder,
    onView: handleViewDocument,
    onDownload: handleDownloadDocument,
    onDelete: handleDeleteDocument,
    deletingDocId,
    columnSpanning: tableConfig.columnSpanning,
  });
  const { columns } = tableColumnsResult;

  // Panel
  const { panelWidth, isPanelVisible, setIsPanelVisible, handleResizeStart } = usePanelManagement();

  const handleCustomFieldFilterVisibilityChange = useCallback((fieldId: number, visible: boolean) => {
    const key = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${fieldId}`;
    updateFilterVisibility({ [key]: visible });
  }, [updateFilterVisibility]);

  // Table State Handlers
  const onStateChange = useMemo(() => ({
    onSortingChange: (updaterOrValue: any) => {
      // EnhancedTable passes the new state
      updateSorting(updaterOrValue);
    },
    onColumnOrderChange: (order: any) => {
      // Ensure string array
      if (Array.isArray(order)) {
        updateColumnOrder(order.map(String));
      }
    },
    onColumnVisibilityChange: updateColumnVisibility,
    onColumnSizingChange: updateColumnSizing,
  }), [updateSorting, updateColumnOrder, updateColumnVisibility, updateColumnSizing]);


  // Derived UI State
  const selectedViewName = activeView?.name || "Default View";

  // Refs
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);
  const paginationRef = useRef<HTMLDivElement>(null);

  const selectedDocumentTypeName = useMemo(() => {
    if (!selectedDocument?.document_type) return "";
    return getDocumentTypeName(selectedDocument.document_type);
  }, [selectedDocument, getDocumentTypeName]);

  const selectedCorrespondentName = useMemo(() => {
    if (!selectedDocument?.correspondent) return "";
    return getCorrespondentName(selectedDocument.correspondent);
  }, [selectedDocument, getCorrespondentName]);

  return (
    <div className="flex h-screen w-full items-start bg-default-background">
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 self-stretch h-full overflow-hidden">
        {/* Header */}
        <DocumentsCustomViewHeader
          selectedViewName={selectedViewName}
          customViews={availableViews}
          customViewsLoading={isLoadingViews}
          selectedCustomViewId={activeViewId}
          onSelectView={setActiveViewId}
          appliedCustomView={activeView}
          filterVisibility={effectiveFilterVisibility}
          onFilterVisibilityChange={(key, visible) => updateFilterVisibility({ [key]: visible })}
          onCustomFieldFilterVisibilityChange={handleCustomFieldFilterVisibilityChange}
          customFields={customFields}
          settings={settings}
          columnOrder={tableConfig.columnOrder}
          columnVisibility={tableConfig.columnVisibility}
          onColumnOrderChange={(order) => {
            const stringOrder = order.map(String);
            updateColumnOrder(stringOrder);
          }}
          onColumnVisibilityChange={(id, visible) => updateColumnVisibility({ [String(id)]: visible })}
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          onSave={saveCurrentView}
          onRevert={discardChanges}
          onSaveAs={() => createViewFromCurrent(`${selectedViewName} (Copy)`)}
          pendingFilterVisibility={tableConfig.filterVisibility}
          onExport={() => console.log("Export")}
          isPanelVisible={isPanelVisible}
          onTogglePanel={() => setIsPanelVisible(!isPanelVisible)}
        />

        {/* Filters */}
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
          appliedCustomView={activeView}
          settings={settings}
          pendingFilterVisibility={tableConfig.filterVisibility}
          onAddDocument={() => console.log("Add Document")}
          filterBarRef={filterBarRef}
          totalCount={totalCount}
          columnOrder={tableConfig.columnOrder}
          filterTypes={tableConfig.filterTypes}
        />

        {/* Content */}
        <div className="flex w-full grow shrink-0 basis-0 items-start overflow-hidden min-h-0">
          <div className="flex flex-col items-start gap-3 px-4 py-4 flex-shrink overflow-hidden min-h-0 h-full" style={{ width: isPanelVisible ? `calc(100% - ${panelWidth}px - 4px)` : '100%', minWidth: 0 }}>
            {error && (
              <div className="w-full flex-none px-4 py-2 bg-red-50 border border-red-200 rounded text-red-800 text-body font-body">
                {error}
              </div>
            )}

            <div ref={tableContainerRef} className="w-full flex-1 min-h-0 flex flex-col">
              <EnhancedTable
                key={`table-${activeViewId || 'default'}`}
                data={documents}
                columns={columns}
                loading={loading}
                onRowClick={handleRowClick}
                enableSorting={true}
                enableColumnResizing={true}
                enableColumnReordering={true}
                enableColumnVisibility={true}
                columnSpanning={tableConfig.columnSpanning}
                renderSubRow={tableConfig.subrowEnabled ? ((doc) => {
                  if (!tableConfig.subrowContent) return null;

                  // Simple template replacement
                  const content = tableConfig.subrowContent.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, key) => {
                    const fieldName = key.trim();
                    if (fieldName === 'title') return doc.title || '';
                    if (fieldName === 'correspondent') return getCorrespondentName(doc.correspondent);

                    const field = customFields.find(f => f.name === fieldName || String(f.id) === fieldName);
                    if (field && field.id) {
                      const val = getCustomFieldValue(doc, field.id);
                      return val !== null && val !== undefined ? String(val) : '';
                    }

                    return match;
                  });

                  return (
                    <div className="text-body font-body text-neutral-500 break-words whitespace-normal px-4 py-2">
                      {content}
                    </div>
                  );
                }) : undefined}
                initialState={{
                  sorting: tableConfig.sorting,
                  // Ensure select-actions is always first, regardless of saved column order
                  columnOrder: ['select-actions', ...tableConfig.columnOrder.filter(id => id !== 'select-actions')],
                  columnVisibility: tableConfig.columnVisibility,
                  columnSizing: tableConfig.columnSizing,
                }}
                onStateChange={onStateChange}
              />
            </div>
            {/* Pagination */}
            {totalCount > pageSize && (
              <div ref={paginationRef} className="flex items-center justify-between w-full flex-none border-t border-solid border-neutral-border bg-default-background sticky bottom-0 z-10 py-2">
                <span className="text-body font-body text-subtext-color">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} documents
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="neutral-tertiary" size="small" disabled={currentPage === 1} onClick={goToPreviousPage}>Previous</Button>
                  <Button variant="neutral-tertiary" size="small" disabled={currentPage * pageSize >= totalCount} onClick={goToNextPage}>Next</Button>
                </div>
              </div>
            )}
          </div>

          {/* Resizable Divider & Panel */}
          {isPanelVisible && (
            <>
              <div className="w-1 bg-neutral-border cursor-col-resize hover:bg-brand-600 transition-colors flex-shrink-0" onMouseDown={handleResizeStart} />
              <div className="flex flex-col items-start bg-neutral-0 overflow-y-auto flex-shrink-0 h-full" style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px` }}>
                <DocumentPreviewPanel
                  document={selectedDocument}
                  documentTypeName={selectedDocumentTypeName}
                  correspondentName={selectedCorrespondentName}
                  tagNames={tagMap}
                  onView={handleViewDocument}
                  onDownload={handleDownloadDocument}
                />
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
