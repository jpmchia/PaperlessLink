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
  enabledBuiltInFields: Set<string>;
  builtInFieldWidths: Map<string, number>;
  getDocumentTypeName: (typeId: number | undefined) => string;
  getTagName: (tagId: number) => string;
  getCorrespondentName: (correspondentId: number | undefined) => string;
  pinnedDocuments?: Set<number>;
  selectedDocuments?: Set<number>;
  onTogglePin?: (docId: number) => void;
  onToggleSelect?: (docId: number) => void;
}

/**
 * Hook to create memoized table columns
 */
export function useTableColumns({
  documentTypes,
  visibleCustomFieldColumns,
  enabledBuiltInFields,
  builtInFieldWidths,
  getDocumentTypeName,
  getTagName,
  getCorrespondentName,
  pinnedDocuments = new Set(),
  selectedDocuments = new Set(),
  onTogglePin,
  onToggleSelect,
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

    // Filter base columns based on enabled built-in fields
    const baseColumns: ColumnDef<Document>[] = Object.entries(allBaseColumns)
      .filter(([id]) => enabledBuiltInFields.has(id))
      .map(([, col]) => col);

    // Add custom field columns
    const customFieldColumns: ColumnDef<Document>[] = visibleCustomFieldColumns.map(
      ({ field, displayType, columnWidth }) => {
        // Check if this column should span two rows (Named Entities or Topic/Concepts)
        const shouldSpanTwoRows = field.name === 'Named Entities' || field.name === 'Topics / Concepts' || field.name === 'Summary';
        
        return {
          id: `customField_${field.id}`,
          accessorFn: (row) => getCustomFieldValue(row, field.id!),
          header: field.name,
          enableSorting: false,
          enableResizing: true,
          enableHiding: true,
          minSize: columnWidth || 120,
          size: columnWidth,
          meta: {
            spanTwoRows: shouldSpanTwoRows,
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
  }, [documentTypes, visibleCustomFieldColumns, enabledBuiltInFields, builtInFieldWidths, getDocumentTypeName, getTagName, getCorrespondentName, pinnedDocuments, selectedDocuments, onTogglePin, onToggleSelect]);
}

