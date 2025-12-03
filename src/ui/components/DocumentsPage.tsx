"use client";
/*
 * This component is based on Subframe design: https://app.subframe.com/af1371ce7f26/design/c6c8ef98-90c2-4959-8c27-88b679b2283b/edit
 * TODO: Replace this placeholder with the actual exported code from Subframe
 */

import React from "react";
import { useRouter } from "next/navigation";
import { DefaultPageLayout } from "@/ui/layouts/DefaultPageLayout";
import { Table } from "@/ui/components/Table";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { Badge } from "@/ui/components/Badge";
import { Tabs } from "@/ui/components/Tabs";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { FilterMenu } from "@/ui/components/FilterMenu";
import { FilterDropDown, FilterOption } from "@/ui/components/FilterDropDown";
import { DateRangePicker } from "@/ui/components/DateRangePicker";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherPlus } from "@subframe/core";
import { FeatherSearch } from "@subframe/core";
import { FeatherMoreHorizontal } from "@subframe/core";
import { FeatherEdit } from "@subframe/core";
import { FeatherTrash } from "@subframe/core";
import { FeatherDownload } from "@subframe/core";
import { FeatherEye } from "@subframe/core";
import { FeatherFile } from "@subframe/core";
import { FeatherFileText } from "@subframe/core";
import { FeatherCalendar } from "@subframe/core";
import { FeatherTag } from "@subframe/core";
import { FeatherUser } from "@subframe/core";
import { FeatherUsers } from "@subframe/core";
import { FeatherFolder } from "@subframe/core";
import { FeatherHash } from "@subframe/core";
import { FeatherListFilter } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherShare2 } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { Avatar } from "@/ui/components/Avatar";
import { useDocuments, useTags, useCorrespondents, useDocumentTypes, useSettings } from "@/lib/api/hooks";
import { Document } from "@/app/data/document";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { useState, useEffect, useCallback, useRef } from "react";

export function DocumentsPage() {
  const router = useRouter();
  const { listFiltered, loading, delete: deleteDocument, service } = useDocuments();
  const { data: tagsData } = useTags();
  const { data: correspondentsData } = useCorrespondents();
  const { data: documentTypesData } = useDocumentTypes();
  const { settings, getSettings } = useSettings();
  
  // State for filter visibility - will be updated when settings change
  const [filterSettings, setFilterSettings] = useState<Record<string, boolean>>({
    dateRange: true,
    category: true,
    correspondent: false,
    tags: false,
    storagePath: false,
    owner: true,
    status: true,
    asn: false,
  });
  
  // Load filter settings from user settings - use cached settings directly
  useEffect(() => {
    if (settings?.settings) {
      const settingsObj = settings.settings as Record<string, any>;
      setFilterSettings({
        dateRange: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_DATE_RANGE] ?? true,
        category: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_CATEGORY] ?? true,
        correspondent: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_CORRESPONDENT] ?? false,
        tags: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_TAGS] ?? false,
        storagePath: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_STORAGE_PATH] ?? false,
        owner: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_OWNER] ?? true,
        status: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_STATUS] ?? true,
        asn: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_ASN] ?? false,
      });
    }
  }, [settings]);
  
  // Listen for custom event when settings modal saves - React Query will auto-refetch
  useEffect(() => {
    const handleSettingsSaved = () => {
      // Settings will be automatically refetched by React Query when invalidated
      // No need to manually call getSettings
    };
    
    window.addEventListener('settingsSaved', handleSettingsSaved);
    
    return () => {
      window.removeEventListener('settingsSaved', handleSettingsSaved);
    };
  }, []);
  
  // Get filter visibility settings with defaults
  const getFilterSetting = (key: string, defaultValue: boolean = false) => {
    return filterSettings[key] ?? defaultValue;
  };
  
  const showDateRangeFilter = getFilterSetting('dateRange', true);
  const showCategoryFilter = getFilterSetting('category', true);
  const showCorrespondentFilter = getFilterSetting('correspondent', false);
  const showTagsFilter = getFilterSetting('tags', false);
  const showStoragePathFilter = getFilterSetting('storagePath', false);
  const showOwnerFilter = getFilterSetting('owner', true);
  const showStatusFilter = getFilterSetting('status', true);
  const showAsnFilter = getFilterSetting('asn', false);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [panelWidth, setPanelWidth] = useState<number>(768); // Default width in pixels
  
  // Filter selection state - all filters now support multiple selections
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number[]>([]);
  const [selectedCorrespondent, setSelectedCorrespondent] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedStoragePath, setSelectedStoragePath] = useState<number[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedAsn, setSelectedAsn] = useState<number[]>([]);
  
  // Related data for lookups
  const [tags, setTags] = useState<any[]>([]);
  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  
  // Debounce search query
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load panel width from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('documentsPanelWidth');
      if (saved) {
        const savedWidth = parseInt(saved, 10);
        // Ensure saved width is reasonable
        const maxWidth = Math.round(window.innerWidth * 0.7);
        setPanelWidth(Math.min(savedWidth, maxWidth));
      } else {
        // Default to 30% of viewport width, but at least 400px
        const defaultWidth = Math.max(400, Math.round(window.innerWidth * 0.3));
        setPanelWidth(defaultWidth);
      }
    }
  }, []);
  
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

  // Use React Query data directly - it's already cached and fetched automatically
  useEffect(() => {
    if (tagsData?.results) {
      setTags(tagsData.results);
    }
  }, [tagsData]);

  useEffect(() => {
    if (correspondentsData?.results) {
      setCorrespondents(correspondentsData.results);
    }
  }, [correspondentsData]);

  useEffect(() => {
    if (documentTypesData?.results) {
      setDocumentTypes(documentTypesData.results);
    }
  }, [documentTypesData]);

  // Helper functions to convert IDs to names
  const getDocumentTypeName = (typeId: number | undefined): string => {
    if (!typeId) return "";
    const type = documentTypes.find(t => t.id === typeId);
    return type?.name || "";
  };

  const getCorrespondentName = (corrId: number | undefined): string => {
    if (!corrId) return "";
    const corr = correspondents.find(c => c.id === corrId);
    return corr?.name || "";
  };

  const getTagName = (tagId: number): string => {
    const tag = tags.find(t => t.id === tagId);
    return tag?.name || "";
  };

  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return "—";
    }
  };

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return "—";
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, debouncedSearchQuery]); // listFiltered is now stable

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Document action handlers
  const handleViewDocument = (docId: number | undefined) => {
    if (docId) {
      router.push(`/documents/${docId}`);
    }
  };

  const handleDownloadDocument = (docId: number | undefined) => {
    if (docId) {
      const downloadUrl = service.getDownloadUrl(docId);
      window.open(downloadUrl, '_blank');
    }
  };

  const handleEditDocument = (docId: number | undefined) => {
    if (docId) {
      // Navigate to detail page - edit functionality can be added there
      router.push(`/documents/${docId}`);
    }
  };

  const handleDeleteDocument = async (docId: number | undefined) => {
    if (!docId) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete this document? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeletingDocId(docId);
      setError(null);
      await deleteDocument(docId);
      // Refresh the document list
      await fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
      setError(error instanceof Error ? error.message : "Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleRowClick = (docId: number | undefined) => {
    if (docId) {
      const doc = documents.find(d => d.id === docId);
      if (doc) {
        setSelectedDocument(doc);
      }
    }
  };

  // Handle resize for right panel
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX; // Reverse for right panel
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
  };

  const handleAddDocument = () => {
    // TODO: Implement document upload modal or navigate to upload page
    // For now, we'll just log it
    console.log("Upload document clicked");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Export clicked");
  };

  return (
    <DefaultPageLayout>
      <div className="flex flex-col items-start w-full h-full overflow-hidden">
        {/* Search and Filters Bar */}
        <div className="flex w-full flex-none items-center gap-2 border-b border-solid border-neutral-border px-6 py-4">
          <TextField
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
            className="h-auto w-64 flex-none"
          >
            <TextField.Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setSearchQuery(event.target.value);
              }}
            />
          </TextField>
          {showDateRangeFilter && (
            <DateRangePicker
              value={selectedDateRange || undefined}
              onChange={(range) => setSelectedDateRange(range.start || range.end ? range : null)}
            />
          )}
          {showCategoryFilter && (
            <FilterDropDown
              label="Category"
              icon={<FeatherTag />}
              options={documentTypes.map(type => ({ id: type.id, label: type.name }))}
              selectedIds={selectedCategory}
              onSelectionChange={(ids) => setSelectedCategory(ids as number[])}
              multiSelect={true}
              showAllOption={true}
              allOptionLabel="All Categories"
            />
          )}
          {showCorrespondentFilter && (
            <FilterDropDown
              label="Correspondent"
              icon={<FeatherUser />}
              options={correspondents.map(corr => ({ id: corr.id, label: corr.name }))}
              selectedIds={selectedCorrespondent}
              onSelectionChange={(ids) => setSelectedCorrespondent(ids as number[])}
              multiSelect={true}
              showAllOption={true}
              allOptionLabel="All Correspondents"
            />
          )}
          {showTagsFilter && (
            <FilterDropDown
              label="Tags"
              icon={<FeatherTag />}
              options={tags.map(tag => ({ id: tag.id, label: tag.name }))}
              selectedIds={selectedTags}
              onSelectionChange={(ids) => setSelectedTags(ids as number[])}
              multiSelect={true}
            />
          )}
          {showStoragePathFilter && (
            <FilterDropDown
              label="Storage Path"
              icon={<FeatherFolder />}
              options={[]}
              selectedIds={selectedStoragePath}
              onSelectionChange={(ids) => setSelectedStoragePath(ids as number[])}
              multiSelect={true}
              showAllOption={true}
              allOptionLabel="All Storage Paths"
            />
          )}
          {showOwnerFilter && (
            <FilterDropDown
              label="Owner"
              icon={<FeatherUsers />}
              options={[{ id: "me", label: "Me" }]}
              selectedIds={selectedOwner}
              onSelectionChange={(ids) => setSelectedOwner(ids as string[])}
              multiSelect={true}
              showAllOption={true}
              allOptionLabel="All Owners"
            />
          )}
          {showStatusFilter && (
            <FilterDropDown
              label="Status"
              icon={<FeatherListFilter />}
              options={[
                { id: "active", label: "Active" },
                { id: "archived", label: "Archived" },
              ]}
              selectedIds={selectedStatus}
              onSelectionChange={(ids) => setSelectedStatus(ids as string[])}
              multiSelect={true}
              showAllOption={true}
              allOptionLabel="All Status"
            />
          )}
          {showAsnFilter && (
            <FilterDropDown
              label="ASN"
              icon={<FeatherHash />}
              options={[]}
              selectedIds={selectedAsn}
              onSelectionChange={(ids) => setSelectedAsn(ids as number[])}
              multiSelect={true}
              showAllOption={true}
              allOptionLabel="All ASN"
            />
          )}
          <div className="flex grow shrink-0 basis-0 items-center justify-end gap-2">
            <Button
              variant="neutral-tertiary"
              icon={<FeatherDownload />}
              onClick={handleExport}
            >
              Export
            </Button>
            <Button
              variant="brand-primary"
              icon={<FeatherPlus />}
              onClick={handleAddDocument}
            >
              Upload
            </Button>
          </div>
        </div>

        {/* Main Content Area with Resizable Panel */}
        <div className="flex w-full grow shrink-0 basis-0 items-start overflow-hidden min-h-0">
          {/* Left Panel - Documents List */}
          <div className="flex flex-col items-start gap-4 px-4 py-4 overflow-y-auto flex-shrink" style={{ width: `calc(100% - ${panelWidth}px - 4px)`, minWidth: 0 }}>
            {/* Error Message */}
            {error && (
              <div className="w-full px-4 py-2 bg-red-50 border border-red-200 rounded text-red-800 text-body font-body">
                {error}
              </div>
            )}

            {/* Documents Table */}
            <div className="w-full">
              <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell icon={<FeatherFile />}>Document Name</Table.HeaderCell>
                <Table.HeaderCell icon={<FeatherCalendar />}>Date Modified</Table.HeaderCell>
                <Table.HeaderCell icon={<FeatherFile />}>File Size</Table.HeaderCell>
                <Table.HeaderCell icon={<FeatherTag />}>Category</Table.HeaderCell>
                <Table.HeaderCell icon={<FeatherUsers />}>Owner</Table.HeaderCell>
                <Table.HeaderCell />
              </Table.HeaderRow>
            }
          >
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center text-body font-body text-subtext-color">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : documents.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center text-body font-body text-subtext-color">
                  No documents found
                </Table.Cell>
              </Table.Row>
            ) : (
              documents.map((doc) => (
                <Table.Row 
                  key={doc.id} 
                  clickable
                  onClick={() => handleRowClick(doc.id)}
                >
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <FeatherFileText className="text-heading-3 font-heading-3 text-error-600" />
                      <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                        {doc.title || doc.original_file_name || `Document ${doc.id}`}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {formatDate(doc.modified || doc.created)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {/* File size not available in API response - would need metadata endpoint */}
                      —
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    {doc.document_type ? (
                      <Badge variant="neutral">{getDocumentTypeName(doc.document_type)}</Badge>
                    ) : (
                      <span className="text-body font-body text-subtext-color">—</span>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {/* Owner info not available in current API response */}
                    <div className="flex items-center gap-2">
                      <Avatar size="x-small">U</Avatar>
                      <span className="whitespace-nowrap text-body font-body text-default-font">
                        —
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          size="small"
                          icon={<FeatherMoreHorizontal />}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation(); // Prevent row click when clicking menu button
                          }}
                        />
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={8}
                          asChild={true}
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
                  </Table.Cell>
                </Table.Row>
              ))
            )}
              </Table>
            </div>

            {/* Pagination */}
            {totalCount > pageSize && (
              <div className="flex items-center justify-between w-full">
                <span className="text-body font-body text-subtext-color">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} documents
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="neutral-tertiary"
                    size="small"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="neutral-tertiary"
                    size="small"
                    disabled={currentPage * pageSize >= totalCount}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Resizable Divider */}
          <div
            className="w-1 bg-neutral-border cursor-col-resize hover:bg-brand-600 transition-colors flex-shrink-0"
            onMouseDown={handleResizeStart}
          />

          {/* Right Panel - Document Details */}
          <div 
            className="flex flex-col items-start bg-neutral-0 overflow-y-auto flex-shrink-0 h-full"
            style={{ width: `${panelWidth}px`, minWidth: `${panelWidth}px` }}
          >
            {selectedDocument ? (
              <div className="flex flex-col items-start w-full px-4 py-4 gap-4">
                <div className="flex w-full items-center justify-between">
                  <div className="flex flex-col items-start">
                    <span className="text-heading-3 font-heading-3 text-default-font">
                      {selectedDocument.title || selectedDocument.original_file_name || `Document ${selectedDocument.id}`}
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      {formatDate(selectedDocument.modified || selectedDocument.created)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton
                      variant="neutral-secondary"
                      icon={<FeatherDownload />}
                      onClick={() => handleDownloadDocument(selectedDocument.id)}
                    />
                    <IconButton
                      variant="neutral-secondary"
                      icon={<FeatherEye />}
                      onClick={() => handleViewDocument(selectedDocument.id)}
                    />
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          variant="neutral-secondary"
                          icon={<FeatherMoreHorizontal />}
                        />
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="end"
                          sideOffset={4}
                          asChild={true}
                        >
                          <DropdownMenu>
                            <DropdownMenu.DropdownItem icon={<FeatherShare2 />}>
                              Share
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon={<FeatherTrash />}>
                              Delete
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-4 w-full">
                  <div className="flex flex-col items-start gap-2 w-full">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">Category</span>
                    {selectedDocument.document_type ? (
                      <Badge variant="neutral">{getDocumentTypeName(selectedDocument.document_type)}</Badge>
                    ) : (
                      <span className="text-body font-body text-subtext-color">—</span>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-2 w-full">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">Correspondent</span>
                    <span className="text-body font-body text-default-font">
                      {getCorrespondentName(selectedDocument.correspondent) || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-start gap-2 w-full">
                    <span className="text-caption-bold font-caption-bold text-subtext-color">Tags</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {selectedDocument.tags && selectedDocument.tags.length > 0 ? (
                        selectedDocument.tags.map((tagId) => (
                          <Badge key={tagId} variant="neutral">
                            {getTagName(tagId)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-body font-body text-subtext-color">—</span>
                      )}
                    </div>
                  </div>

                  {selectedDocument.content && (
                    <div className="flex flex-col items-start gap-2 w-full">
                      <span className="text-caption-bold font-caption-bold text-subtext-color">Content Preview</span>
                      <div className="text-body font-body text-default-font max-h-64 overflow-y-auto p-3 bg-neutral-50 rounded border border-neutral-border">
                        {selectedDocument.content.substring(0, 500)}
                        {selectedDocument.content.length > 500 && "..."}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full px-4 py-8">
                <FeatherFileText className="text-heading-1 font-heading-1 text-subtext-color mb-2" />
                <span className="text-body font-body text-subtext-color text-center">
                  Select a document to view details
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DefaultPageLayout>
  );
}

