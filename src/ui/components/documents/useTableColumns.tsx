import { useMemo } from 'react';
import { type ColumnDef } from "@tanstack/react-table";
import { Document } from "@/app/data/document";
import { CustomField } from "@/app/data/custom-field";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { CustomFieldDisplay } from "@/ui/components/CustomFieldDisplay";
import { Checkbox } from "@/ui/components/Checkbox";
import { FeatherFileText, FeatherPin } from "@subframe/core";
import { formatDate, getCustomFieldValue, resolveCustomFieldValue } from './documentUtils';

interface ColumnOptions {
  documentTypes: Array<{ id?: number; name?: string }>;
  visibleCustomFieldColumns: Array<{
    field: CustomField;
    displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier';
    columnWidth?: number;
  }>;
  visibleBuiltInFieldColumns?: Array<{
    fieldId: string;
    displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier';
    columnWidth?: number;
  }>;
  enabledBuiltInFields: Set<string>;
  builtInFieldWidths: Map<string, number>;
  getDocumentTypeName: (typeId: number | undefined) => string;
  getTagName: (tagId: number) => string;
  getCorrespondentName: (correspondentId: number | undefined) => string;
  pinnedDocuments?: Set<number>;
  selectedDocuments?: Set<number>;
  onTogglePin?: (docId: number) => void;
  onToggleSelect?: (docId: number) => void;
  columnSpanning?: Record<string, boolean>; // Map of column ID to whether it spans two rows
}

/**
 * Hook to create memoized table columns
 */
export function useTableColumns({
  documentTypes,
  visibleCustomFieldColumns,
  visibleBuiltInFieldColumns,
  enabledBuiltInFields,
  builtInFieldWidths,
  getDocumentTypeName,
  getTagName,
  getCorrespondentName,
  pinnedDocuments = new Set(),
  selectedDocuments = new Set(),
  onTogglePin,
  onToggleSelect,
  columnSpanning,
}: ColumnOptions) {
  return useMemo<ColumnDef<Document>[]>(() => {
    const allBaseColumns: Record<string, ColumnDef<Document>> = {
      title: {
        id: "title",
        accessorKey: "title",
        header: "Document Name",
        enableSorting: true,
        enableResizing: true,
        minSize: 100,
        size: builtInFieldWidths.get('title') || 200,
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex items-start gap-2 min-w-0">
              <FeatherFileText className="text-heading-3 font-heading-3 text-error-600 flex-shrink-0 mt-0.5" />
              <span className="text-body-bold font-body-bold text-default-font break-words whitespace-normal">
                {doc.title || doc.original_file_name || `Document ${doc.id}`}
              </span>
            </div>
          );
        },
      },
      created: {
        id: "created",
        accessorKey: "created",
        header: "Created Date",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('created') || 150,
        size: builtInFieldWidths.get('created'),
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <span className="whitespace-nowrap text-body font-body text-neutral-500">
              {formatDate(doc.created)}
            </span>
          );
        },
      },
      added: {
        id: "added",
        accessorKey: "added",
        header: "Added Date",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('added') || 150,
        size: builtInFieldWidths.get('added'),
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <span className="whitespace-nowrap text-body font-body text-neutral-500">
              {formatDate(doc.added)}
            </span>
          );
        },
      },
      correspondent: {
        id: "correspondent",
        accessorKey: "correspondent",
        header: "Correspondent",
        enableSorting: false,
        enableResizing: true,
        minSize: builtInFieldWidths.get('correspondent') || 150,
        size: builtInFieldWidths.get('correspondent'),
        cell: ({ row }) => {
          const doc = row.original;
          return doc.correspondent ? (
            <span className="text-body font-body text-default-font">
              {getCorrespondentName(doc.correspondent)}
            </span>
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          );
        },
      },
      asn: {
        id: "asn",
        accessorKey: "archive_serial_number",
        header: "ASN",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('asn') || 80,
        size: builtInFieldWidths.get('asn'),
        cell: ({ row }) => {
          const doc = row.original;
          return doc.archive_serial_number ? (
            <span className="text-body font-body text-default-font">
              {doc.archive_serial_number}
            </span>
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          );
        },
      },
      page_count: {
        id: "page_count",
        accessorKey: "page_count",
        header: "Pages",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('page_count') || 80,
        size: builtInFieldWidths.get('page_count'),
        cell: ({ row }) => {
          const doc = row.original;
          return doc.page_count !== undefined && doc.page_count !== null ? (
            <span className="text-body font-body text-default-font">
              {doc.page_count}
            </span>
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          );
        },
      },
      fileSize: {
        id: "fileSize",
        accessorKey: "fileSize",
        header: "File Size",
        enableSorting: false,
        enableResizing: true,
        minSize: builtInFieldWidths.get('fileSize') || 100,
        size: builtInFieldWidths.get('fileSize'),
        cell: () => (
          <span className="whitespace-nowrap text-body font-body text-neutral-500">
            —
          </span>
        ),
      },
      category: {
        id: "category",
        accessorKey: "document_type",
        header: "Type",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('category') || 100,
        size: builtInFieldWidths.get('category'),
        cell: ({ row }) => {
          const doc = row.original;
          return doc.document_type ? (
            <span className="text-body font-body text-default-font">{getDocumentTypeName(doc.document_type)}</span>
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          );
        },
      },
      owner: {
        id: "owner",
        accessorKey: "owner",
        header: "Owner",
        enableSorting: false,
        enableResizing: true,
        minSize: builtInFieldWidths.get('owner') || 120,
        size: builtInFieldWidths.get('owner'),
        cell: () => (
          <div className="flex items-center gap-2">
            <Avatar size="x-small">U</Avatar>
            <span className="whitespace-nowrap text-body font-body text-default-font">
              —
            </span>
          </div>
        ),
      },
    };

    // Helper function to get built-in field value
    const getBuiltInFieldValue = (doc: Document, fieldId: string): any => {
      switch (fieldId) {
        case 'title':
          return doc.title || doc.original_file_name || `Document ${doc.id}`;
        case 'created':
          return doc.created;
        case 'added':
          return doc.added;
        case 'correspondent':
          return doc.correspondent ? getCorrespondentName(doc.correspondent) : null;
        case 'asn':
          return doc.archive_serial_number;
        case 'page_count':
          return doc.page_count;
        case 'fileSize':
          return (doc as any).file_size || null;
        case 'category':
          return doc.document_type ? getDocumentTypeName(doc.document_type) : null;
        case 'owner':
          return (doc as any).owner_username || null;
        case 'tags':
          // Return tags as comma-separated string for list display, or array for direct rendering
          if (!doc.tags || doc.tags.length === 0) return null;
          return doc.tags.map(tagId => getTagName(tagId)).join(', ');
        default:
          return null;
      }
    };

    // Generate built-in field columns using display types
    const builtInFieldColumns: ColumnDef<Document>[] = (visibleBuiltInFieldColumns && visibleBuiltInFieldColumns.length > 0) ? visibleBuiltInFieldColumns.map(
      ({ fieldId, displayType, columnWidth }) => {
        const columnId = fieldId;
        const configuredSpanning = columnSpanning?.[columnId] === true;

        // Helper function to get header name for built-in fields
        const getBuiltInFieldHeader = (id: string): string => {
          const headerMap: Record<string, string> = {
            'category': 'Type',
            'page_count': 'Pages',
            'fileSize': 'File Size',
            'created': 'Created Date',
            'added': 'Added Date',
            'correspondent': 'Correspondent',
            'tags': 'Tags',
          };
          return headerMap[id] || id.charAt(0).toUpperCase() + id.slice(1);
        };

        // Helper function to get accessor key for built-in fields
        const getBuiltInFieldAccessorKey = (id: string): string => {
          if (id === 'category') return 'document_type';
          if (id === 'asn') return 'archive_serial_number';
          if (id === 'tags') return 'tags';
          return id;
        };

        // Special handling for title column (always has icon)
        if (fieldId === 'title') {
          return {
            id: columnId,
            accessorKey: 'title',
            header: 'Document Name',
            enableSorting: true,
            enableResizing: true,
            minSize: columnWidth || 100,
            size: columnWidth || builtInFieldWidths.get(fieldId) || 200,
            meta: {
              spanTwoRows: configuredSpanning,
              showOnSecondRow: columnSpanning?.[`${fieldId}_secondRow`] === true,
            },
            cell: ({ row }) => {
              const doc = row.original;
              return (
                <div className="flex items-start gap-2 min-w-0">
                  <FeatherFileText className="text-heading-3 font-heading-3 text-error-600 flex-shrink-0 mt-0.5" />
                  <span className="text-body-bold font-body-bold text-default-font break-words whitespace-normal">
                    {doc.title || doc.original_file_name || `Document ${doc.id}`}
                  </span>
                </div>
              );
            },
          };
        }

        // Special handling for tags - render as badges
        if (fieldId === 'tags') {
          return {
            id: columnId,
            accessorFn: (row) => row.tags,
            header: 'Tags',
            enableSorting: false,
            enableResizing: true,
            minSize: columnWidth || 150,
            size: columnWidth || builtInFieldWidths.get(fieldId),
            meta: {
              spanTwoRows: configuredSpanning,
              showOnSecondRow: columnSpanning?.[`${fieldId}_secondRow`] === true,
            },
            cell: ({ row }) => {
              const doc = row.original;
              if (!doc.tags || doc.tags.length === 0) {
                return <span className="text-body font-body text-subtext-color">—</span>;
              }
              // Use list display type for tags
              if (displayType === 'list') {
                return (
                  <div className="flex items-center gap-1 flex-wrap">
                    {doc.tags.map((tagId) => (
                      <Badge key={tagId} variant="neutral">
                        {getTagName(tagId)}
                      </Badge>
                    ))}
                  </div>
                );
              }
              // Fallback to text display
              return <CustomFieldDisplay value={doc.tags.map((tagId: number) => getTagName(tagId)).join(', ')} displayType={displayType} />;
            },
          };
        }

        // For other built-in fields, use generic rendering with display types
        return {
          id: columnId,
          accessorKey: fieldId === 'category' ? 'document_type' : fieldId === 'asn' ? 'archive_serial_number' : fieldId,
          header: fieldId === 'category' ? 'Type' : fieldId === 'page_count' ? 'Pages' : fieldId === 'fileSize' ? 'File Size' : fieldId === 'created' ? 'Created Date' : fieldId === 'added' ? 'Added Date' : fieldId === 'correspondent' ? 'Correspondent' : fieldId.charAt(0).toUpperCase() + fieldId.slice(1),
          enableSorting: ['title', 'created', 'added', 'asn', 'page_count', 'category'].includes(fieldId),
          enableResizing: true,
          minSize: columnWidth || (fieldId === 'asn' || fieldId === 'page_count' ? 80 : 150),
          size: columnWidth || builtInFieldWidths.get(fieldId),
          meta: {
            spanTwoRows: configuredSpanning,
            showOnSecondRow: columnSpanning?.[`${fieldId}_secondRow`] === true,
          },
          cell: ({ row }) => {
            const value = getBuiltInFieldValue(row.original, fieldId);
            if (value === null || value === undefined || value === '') {
              return <span className="text-body font-body text-subtext-color">—</span>;
            }
            // Use CustomFieldDisplay for consistent rendering
            return <CustomFieldDisplay value={value} displayType={displayType} />;
          },
        };
      }
    ) : [];

    // Filter base columns based on enabled built-in fields (for backwards compatibility)
    // But prefer using builtInFieldColumns which uses display types
    const baseColumns: ColumnDef<Document>[] = builtInFieldColumns.length > 0
      ? builtInFieldColumns
      : Object.entries(allBaseColumns)
        .filter(([id]) => enabledBuiltInFields.has(id))
        .map(([id, col]) => ({
          ...col,
          meta: {
            ...(col as any).meta,
            spanTwoRows: columnSpanning?.[id] === true,
            showOnSecondRow: columnSpanning?.[`${id}_secondRow`] === true,
          },
        }));

    // Debug: Log column meta for secondRow
    console.log('[useTableColumns] columnSpanning:', JSON.stringify(columnSpanning));
    baseColumns.forEach(c => {
      console.log('[useTableColumns] Column:', (c as any).id, 'meta:', c.meta);
    });

    // Add custom field columns
    const customFieldColumns: ColumnDef<Document>[] = visibleCustomFieldColumns.map(
      ({ field, displayType, columnWidth }) => {
        // Check if this column should span two rows or show on second row
        const columnId = `customField_${field.id}`;
        const configuredSpanning = columnSpanning?.[columnId] === true || columnSpanning?.[String(field.id)] === true;
        const secondRowKey = `${columnId}_secondRow`;
        const configuredShowOnSecondRow = columnSpanning?.[secondRowKey] === true;
        const shouldSpanTwoRows = configuredSpanning || (field.name === 'Named Entities' || field.name === 'Topics / Concepts' || field.name === 'Summary');

        return {
          id: columnId,
          accessorFn: (row) => getCustomFieldValue(row, field.id!),
          header: field.name,
          enableSorting: false,
          enableResizing: true,
          enableHiding: true,
          minSize: columnWidth || 120,
          size: columnWidth,
          meta: {
            spanTwoRows: shouldSpanTwoRows,
            showOnSecondRow: configuredShowOnSecondRow,
          },
          cell: ({ row }) => {
            const rawValue = getCustomFieldValue(row.original, field.id!);
            const resolvedValue = resolveCustomFieldValue(rawValue, field);
            // Force Status field to display as text instead of list/badges
            const effectiveDisplayType = field.name.toLowerCase() === 'status' ? 'text' : displayType;
            return <CustomFieldDisplay value={resolvedValue} displayType={effectiveDisplayType} />;
          },
        };
      }
    );

    // Create pin/select column (always first)
    const pinSelectColumn: ColumnDef<Document> = {
      id: "pin-select",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 80,
      minSize: 80,
      meta: {
        spanTwoRows: columnSpanning?.['pin-select'] === true,
      },
      cell: ({ row }) => {
        const doc = row.original;
        const docId = doc.id;
        if (docId === undefined) return null;

        const isPinned = pinnedDocuments.has(docId);
        const isSelected = selectedDocuments.has(docId);

        return (
          <div className="flex items-center gap-2">
            {/* Pin icon */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin?.(docId);
              }}
              className="p-1 hover:bg-neutral-50 rounded flex-shrink-0"
              title={isPinned ? "Unpin document" : "Pin document"}
            >
              <FeatherPin
                className={`w-4 h-4 ${isPinned ? 'text-success-600' : 'text-neutral-400'}`}
                style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }}
              />
            </button>

            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                onToggleSelect?.(docId);
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        );
      },
    };

    return [pinSelectColumn, ...baseColumns, ...customFieldColumns];
  }, [documentTypes, visibleCustomFieldColumns, enabledBuiltInFields, builtInFieldWidths, getDocumentTypeName, getTagName, getCorrespondentName, pinnedDocuments, selectedDocuments, onTogglePin, onToggleSelect, columnSpanning]);
}

