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
import { FeatherMoreHorizontal, FeatherEye, FeatherDownload, FeatherShare2, FeatherTrash, FeatherChevronLeft, FeatherChevronRight, FeatherFileText } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { useDocuments, useTags, useCorrespondents, useDocumentTypes, useSettings, useCustomFields } from "@/lib/api/hooks";
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
import { createLookupMaps, getCustomFieldValue } from "./documents/documentUtils";

const DEFAULT_PAGE_SIZE = 50;

export function DocumentsPage() {
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

  // Get custom fields that should be displayed as table columns, sorted by display order
  const visibleCustomFieldColumns = useMemo(() => {
    if (!settings?.settings || !customFields.length) return [];
    
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
  }, [settings, customFields]);

  // Custom hooks
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

  // Get enabled built-in fields and their widths from settings
  const { enabledBuiltInFields, builtInFieldWidths } = useMemo(() => {
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
  }, [settings]);

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

  // Get column order from settings
  const columnOrderFromSettings = useMemo(() => {
    if (!settings?.settings) return null;
    const settingsObj = settings.settings as Record<string, any>;
    return settingsObj[SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER] as (string | number)[] | undefined;
  }, [settings]);

  // Add actions column and apply column order
  const columns = useMemo(() => {
    const actionsColumn = {
      id: "actions",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 50,
      meta: {
        renderInSubRow: true, // Actions column only renders in subrow, not main row
      },
      cell: ({ row }: { row: { original: Document } }) => {
        const doc = row.original;
        return (
          <div className="flex items-center justify-center">
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

    const allColumns = [...baseColumns, actionsColumn];

    // Apply column order if available
    if (columnOrderFromSettings && columnOrderFromSettings.length > 0) {
      // Create a set of available column IDs for quick lookup
      const availableColumnIds = new Set(allColumns.map(col => String(col.id)));
      
      // Create a map of columns by their IDs (both direct IDs and customField_ prefixed)
      const columnMap = new Map<string, typeof allColumns[0]>();
      allColumns.forEach(col => {
        columnMap.set(String(col.id), col);
        // For custom fields, also map by the field ID without prefix
        if (col.id?.startsWith('customField_')) {
          const fieldId = col.id.replace('customField_', '');
          columnMap.set(fieldId, col);
        }
      });
      
      const orderedColumns: typeof allColumns = [];
      const processedIds = new Set<string>();

      // Add columns in order from settings, but only if they're actually available (enabled)
      columnOrderFromSettings.forEach(id => {
        const col = columnMap.get(String(id));
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

  // Compute column sizing from settings (for both built-in and custom fields)
  const columnSizingFromSettings = useMemo(() => {
    if (!settings?.settings) return {};
    const settingsObj = settings.settings as Record<string, any>;
    const sizing: Record<string, number> = {};
    
    // Add built-in field widths
    ['title', 'modified', 'fileSize', 'category', 'owner'].forEach(fieldId => {
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
  }, [settings, customFields]);
  
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

  return (
    <DefaultPageLayout>
      <div className="flex flex-col items-start w-full h-full overflow-hidden">
        {/* Header with Preview Toggle */}
        <div className="flex w-full flex-none items-center justify-end gap-2 border-b border-solid border-neutral-border px-6 py-4">
          <Button
            variant="neutral-secondary"
            size="medium"
            icon={<FeatherFileText />}
            iconRight={isPanelVisible ? <FeatherChevronRight /> : <FeatherChevronLeft />}
            onClick={() => setIsPanelVisible(!isPanelVisible)}
            title={isPanelVisible ? "Hide preview panel" : "Show preview panel"}
          />
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
                key={`table-${settings?.settings ? JSON.stringify(columnOrderFromSettings) : 'default'}-${JSON.stringify(columnSizingFromSettings)}`}
                data={documents}
                columns={columns}
                loading={loading}
                onRowClick={handleRowClick}
                enableSorting={true}
                enableColumnResizing={true}
                enableColumnReordering={false}
                enableColumnVisibility={false}
                renderSubRow={(doc) => {
                  // Find Summary field
                  const summaryField = customFields.find(f => f.name === 'Summary');
                  if (!summaryField || !summaryField.id) return null;
                  
                  // Get summary value
                  const summaryValue = getCustomFieldValue(doc, summaryField.id);
                  if (!summaryValue || summaryValue === '') return null;
                  
                  return (
                    <div className="text-body font-body text-neutral-500 break-words whitespace-normal">
                      {String(summaryValue)}
                    </div>
                  );
                }}
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
