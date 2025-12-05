import { useMemo } from 'react';
import { type ColumnDef } from "@tanstack/react-table";
import { Document } from "@/app/data/document";
import { CustomField } from "@/app/data/custom-field";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { CustomFieldDisplay } from "@/ui/components/CustomFieldDisplay";
import { FeatherFileText } from "@subframe/core";
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
}: ColumnOptions) {
  return useMemo<ColumnDef<Document>[]>(() => {
    const allBaseColumns: Record<string, ColumnDef<Document>> = {
      title: {
        id: "title",
        accessorKey: "title",
        header: "Document Name",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('title') || 200,
        size: builtInFieldWidths.get('title'),
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex items-center gap-2 min-w-0">
              <FeatherFileText className="text-heading-3 font-heading-3 text-error-600 flex-shrink-0" />
              <span className="truncate text-body-bold font-body-bold text-default-font">
                {doc.title || doc.original_file_name || `Document ${doc.id}`}
              </span>
            </div>
          );
        },
      },
      modified: {
        id: "modified",
        accessorKey: "modified",
        header: "Date",
        enableSorting: true,
        enableResizing: true,
        minSize: builtInFieldWidths.get('modified') || 150,
        size: builtInFieldWidths.get('modified'),
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <span className="whitespace-nowrap text-body font-body text-neutral-500">
              {formatDate(doc.modified || doc.created)}
            </span>
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

    return [...baseColumns, ...customFieldColumns];
  }, [documentTypes, visibleCustomFieldColumns, enabledBuiltInFields, builtInFieldWidths, getDocumentTypeName, getTagName]);
}

