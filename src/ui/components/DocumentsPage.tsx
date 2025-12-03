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
import { FeatherUsers } from "@subframe/core";
import { FeatherListFilter } from "@subframe/core";
import { FeatherChevronDown } from "@subframe/core";
import { FeatherShare2 } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { Avatar } from "@/ui/components/Avatar";
import { useDocuments, useTags, useCorrespondents, useDocumentTypes } from "@/lib/api/hooks";
import { Document } from "@/app/data/document";
import { useState, useEffect, useCallback, useRef } from "react";

export function DocumentsPage() {
  const router = useRouter();
  const { listFiltered, loading, delete: deleteDocument, service } = useDocuments();
  const { listAll: listAllTags } = useTags();
  const { listAll: listAllCorrespondents } = useCorrespondents();
  const { listAll: listAllDocumentTypes } = useDocumentTypes();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(25);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  
  // Related data for lookups
  const [tags, setTags] = useState<any[]>([]);
  const [correspondents, setCorrespondents] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  
  // Debounce search query
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Fetch related data
  useEffect(() => {
    const fetchRelatedData = async () => {
      try {
        const [tagsData, correspondentsData, documentTypesData] = await Promise.all([
          listAllTags(),
          listAllCorrespondents(),
          listAllDocumentTypes(),
        ]);
        setTags(tagsData.results || []);
        setCorrespondents(correspondentsData.results || []);
        setDocumentTypes(documentTypesData.results || []);
      } catch (error) {
        console.error("Failed to fetch related data:", error);
      }
    };
    fetchRelatedData();
  }, [listAllTags, listAllCorrespondents, listAllDocumentTypes]);

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
  }, [listFiltered, currentPage, pageSize, debouncedSearchQuery]);

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
      handleViewDocument(docId);
    }
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
      <div className="flex flex-col items-start w-full">
        {/* Search and Filters Bar */}
        <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border px-6 py-4">
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
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                variant="neutral-secondary"
                icon={<FeatherCalendar />}
                iconRight={<FeatherChevronDown />}
              >
                Date Range
              </Button>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  <DropdownMenu.DropdownItem icon={null}>Last 7 days</DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>Last 30 days</DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>Last 90 days</DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>All time</DropdownMenu.DropdownItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                variant="neutral-secondary"
                icon={<FeatherTag />}
                iconRight={<FeatherChevronDown />}
              >
                Category
              </Button>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  <DropdownMenu.DropdownItem icon={null}>All Categories</DropdownMenu.DropdownItem>
                  {documentTypes.map((type) => (
                    <DropdownMenu.DropdownItem key={type.id} icon={null}>
                      {type.name}
                    </DropdownMenu.DropdownItem>
                  ))}
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                variant="neutral-secondary"
                icon={<FeatherUsers />}
                iconRight={<FeatherChevronDown />}
              >
                Owner
              </Button>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  <DropdownMenu.DropdownItem icon={null}>All Owners</DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>Me</DropdownMenu.DropdownItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
          <SubframeCore.DropdownMenu.Root>
            <SubframeCore.DropdownMenu.Trigger asChild={true}>
              <Button
                variant="neutral-secondary"
                icon={<FeatherListFilter />}
                iconRight={<FeatherChevronDown />}
              >
                Status
              </Button>
            </SubframeCore.DropdownMenu.Trigger>
            <SubframeCore.DropdownMenu.Portal>
              <SubframeCore.DropdownMenu.Content
                side="bottom"
                align="start"
                sideOffset={4}
                asChild={true}
              >
                <DropdownMenu>
                  <DropdownMenu.DropdownItem icon={null}>All Status</DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>Active</DropdownMenu.DropdownItem>
                  <DropdownMenu.DropdownItem icon={null}>Archived</DropdownMenu.DropdownItem>
                </DropdownMenu>
              </SubframeCore.DropdownMenu.Content>
            </SubframeCore.DropdownMenu.Portal>
          </SubframeCore.DropdownMenu.Root>
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

        <div className="flex flex-col items-start gap-4 w-full px-4 py-4">
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
      </div>
    </DefaultPageLayout>
  );
}

