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
  columnSpanning?: Record<string, boolean>; // Map of column ID to whether it spans two rows
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
  columnSpanning,
}: UseTableColumnsWithActionsOptions): { columns: ColumnDef<Document>[]; tanStackColumnOrder: string[] } {
  const columns = useMemo(() => {
    // Check if actions column should span two rows
    const actionsShouldSpan = columnSpanning?.['actions'] === true; // Keep using 'actions' key for spanning config if generic

    // Find pin-select column
    const pinSelectColumn = baseColumns.find(col => col.id === 'pin-select');

    // Create explicitly defined Actions column if it doesn't exist in baseColumns
    const actionsColumn: ColumnDef<Document> = {
      id: "actions",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: 50,
      minSize: 50,
      meta: {
        renderInSubRow: true, // Hint for older logic, but layout controls placement now
      },
      cell: (cellContext) => (
        <DocumentActionsColumn
          doc={cellContext.row.original}
          deletingDocId={deletingDocId}
          onView={onView}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      )
    };

    const otherBaseColumns = baseColumns.filter(col => col.id !== 'pin-select' && col.id !== 'actions');

    // Create Merged Column (Select + Actions) OR Just Select (if split)
    const selectActionsColumn: ColumnDef<Document> = {
      id: "select-actions",
      header: "",
      enableSorting: false,
      enableResizing: false,
      enableHiding: false,
      size: actionsShouldSpan ? 100 : 50, // Reduce size if split
      minSize: 50,
      meta: {
        spanTwoRows: actionsShouldSpan || (pinSelectColumn?.meta as any)?.spanTwoRows,
        renderInSubRow: !actionsShouldSpan, // ? Legacy logic
      },
      cell: (cellContext) => {
        const { row } = cellContext;
        const doc = row.original;

        // Render pin-select cell content
        const pinSelectContent = pinSelectColumn?.cell
          ? (typeof pinSelectColumn.cell === 'function' // flexRender handles function or component
            ? (pinSelectColumn.cell as any)(cellContext) // Force call if function
            : pinSelectColumn.cell) // Just return if component? No flexRender usually handles this.
          // Correct way to invoke existing cell renderer manually:
          // Usually we can't easily invoke `cell` if it relies on flexRender internals, 
          // but for `pinSelectColumn` (defined in hook) it uses simple function logic.
          : null;

        if (!actionsShouldSpan) {
          // Split view: Just render Pin/Select
          return (
            <div className="flex items-center justify-center w-full">
              {pinSelectContent}
            </div>
          );
        }

        // Span view: Render both
        return (
          <div className="flex items-center justify-between w-full pr-2">
            {/* Pin/Select Part */}
            <div className="flex-shrink-0">
              {pinSelectContent}
            </div>

            {/* Actions Part */}
            <DocumentActionsColumn
              doc={doc}
              deletingDocId={deletingDocId}
              onView={onView}
              onDownload={onDownload}
              onDelete={onDelete}
            />
          </div>
        );
      },
    };

    // The full list: SelectActions (as main), Actions (as sub/optional), others
    // We must ensure 'actions' is available in the list so EnhancedTable can find it.

    // If not spanning, we want `select-actions` (Pin) and `actions` (Actions) to be separate valid columns.
    const allColumns = [selectActionsColumn, actionsColumn, ...otherBaseColumns];

    // Apply column order if available
    if (columnOrderFromSettings && columnOrderFromSettings.length > 0) {
      // Create a set of available column IDs for quick lookup
      const availableColumnIds = new Set(allColumns.map(col => String(col.id)));

      // Map columns
      const columnMap = new Map<string, ColumnDef<Document>>();
      allColumns.forEach(col => {
        columnMap.set(String(col.id), col);
        if (col.id?.startsWith('customField_')) {
          const fieldId = col.id.replace('customField_', '');
          columnMap.set(fieldId, col);
          const numFieldId = parseInt(fieldId, 10);
          if (!isNaN(numFieldId)) columnMap.set(String(numFieldId), col);
        }
      });

      const orderedColumns: ColumnDef<Document>[] = [];
      const processedIds = new Set<string>();

      // Always Add Select-Actions First
      orderedColumns.push(selectActionsColumn);
      processedIds.add('select-actions');

      // Mark components as handled if we are merged? 
      // If NOT merged (actionsShouldSpan is false), we WANT 'actions' to be available. 
      // But tableLayoutUtils hardcodes 'actions' to subRow[0].
      // EnhancedTable layout will effectively pick:
      // mainRow[0] = select-actions
      // subRow[0] = actions
      // So both must be in `orderedColumns` to be visible to TanStack table.

      if (!actionsShouldSpan) {
        // Add actions column to ordered list if it's not merged
        // But wait, order matters for index?
        // tableLayoutUtils uses explicit assignment, not index matching?
        // No, tableLayoutUtils uses `columnOrder` (which IS this list) to iterate.
        // BUT tableLayoutUtils *explicitly* initializes mainRow[0] and subRow[0] with specific IDs.
        // It filters 'select-actions' and 'actions' from the loop.
        // So their position in `orderedColumns` doesn't strictly matter for layout logic,
        // BUT it matters for TanStack table `getVisibleLeafColumns()` -> `visibleCells`.
        // If `actions` is not in `orderedColumns`, it won't be in `visibleCells`.

        orderedColumns.push(actionsColumn);
        processedIds.add('actions');
      }

      // Mark original pin-select as processed
      processedIds.add('pin-select');

      // Add columns from settings
      columnOrderFromSettings.forEach(id => {
        const idStr = String(id);
        const col = columnMap.get(idStr);

        // Skip if it's the merged column or components thereof
        if (col && col.id !== 'select-actions' && col.id !== 'actions' && !processedIds.has(String(col.id))) {
          orderedColumns.push(col);
          processedIds.add(String(col.id));
        }
      });

      // Add any remaining columns that weren't in the order
      allColumns.forEach(col => {
        if (!processedIds.has(String(col.id))) {
          // If 'actions' wasn't added yet (should have been if !span), add it
          if (col.id === 'actions' && actionsShouldSpan) {
            // If spanning, we don't add standalone actions column
            return;
          }
          orderedColumns.push(col);
          processedIds.add(String(col.id));
        }
      });

      return orderedColumns;
    }

    // Default order without settings
    // If spanning, exclude actions column from list? 
    if (actionsShouldSpan) {
      return [selectActionsColumn, ...otherBaseColumns];
    }
    return [selectActionsColumn, actionsColumn, ...otherBaseColumns];

  }, [baseColumns, columnOrderFromSettings, onView, onDownload, onDelete, deletingDocId, columnSpanning]);

  // Compute TanStack Table column order
  const tanStackColumnOrder = useMemo(() => {
    return columns.map(col => col.id!);
  }, [columns]);

  return { columns, tanStackColumnOrder };
}
