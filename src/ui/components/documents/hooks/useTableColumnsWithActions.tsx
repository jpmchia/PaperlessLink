"use client";

import React, { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Document } from '@/app/data/document';
import { DocumentActionsColumn } from '../components/DocumentActionsColumn';

interface UseTableColumnsWithActionsOptions {
  baseColumns: ColumnDef<Document>[];
  columnOrderFromSettings: (string | number)[] | null;
  onView: (docId: number | undefined) => void;
  onDownload: (docId: number | undefined) => void;
  onDelete: (docId: number | undefined) => void;
  deletingDocId: number | null;
}

/**
 * Hook to build table columns with actions column and apply column ordering
 */
export function useTableColumnsWithActions({
  baseColumns,
  columnOrderFromSettings,
  onView,
  onDownload,
  onDelete,
  deletingDocId,
}: UseTableColumnsWithActionsOptions): { columns: ColumnDef<Document>[]; tanStackColumnOrder: string[] } {
  const columns = useMemo(() => {
    const actionsColumn: ColumnDef<Document> = {
      id: "actions",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 50,
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <DocumentActionsColumn
            doc={doc}
            deletingDocId={deletingDocId}
            onView={onView}
            onDownload={onDownload}
            onDelete={onDelete}
          />
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
      const columnMap = new Map<string, ColumnDef<Document>>();
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
      
      const orderedColumns: ColumnDef<Document>[] = [];
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
  }, [baseColumns, columnOrderFromSettings, onView, onDownload, onDelete, deletingDocId]);

  // Compute TanStack Table column order from the ordered columns
  const tanStackColumnOrder = useMemo(() => {
    return columns.map(col => col.id!);
  }, [columns]);

  return { columns, tanStackColumnOrder };
}
