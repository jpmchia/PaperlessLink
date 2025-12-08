"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type Table as TanStackTable,
  type SortingState,
  type ColumnOrderState,
  type VisibilityState,
  type ColumnSizingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { Table } from "./Table";
import { IconButton } from "./IconButton";
import { DropdownMenu } from "./DropdownMenu";
import { FeatherChevronUp, FeatherChevronDown, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { computeTableLayout, shouldRenderSubRowCell, type TableLayout } from "./documents/tableLayoutUtils";

// Helper to resolve updates from TanStack table
function resolveStateUpdater<T>(updaterOrValue: T | ((old: T) => T), old: T): T {
  return typeof updaterOrValue === 'function'
    ? (updaterOrValue as (old: T) => T)(old)
    : updaterOrValue;
}

interface EnhancedTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  enableSorting?: boolean;
  enableColumnResizing?: boolean;
  enableColumnReordering?: boolean;
  enableColumnVisibility?: boolean;
  renderSubRow?: (row: TData) => React.ReactNode;
  columnSpanning?: Record<string, boolean>; // For layout calculation
  initialState?: {
    sorting?: SortingState;
    columnOrder?: ColumnOrderState;
    columnVisibility?: VisibilityState;
    columnSizing?: ColumnSizingState;
  };
  onStateChange?: {
    onSortingChange?: (sorting: SortingState) => void;
    onColumnOrderChange?: (columnOrder: ColumnOrderState) => void;
    onColumnVisibilityChange?: (visibility: VisibilityState) => void;
    onColumnSizingChange?: (sizing: ColumnSizingState) => void;
  };
}

export function EnhancedTable<TData extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onRowClick,
  enableSorting = true,
  enableColumnResizing = true,
  enableColumnReordering = false,
  enableColumnVisibility = true,
  renderSubRow,
  columnSpanning,
  initialState,
  onStateChange,
  summaryFieldName,
}: EnhancedTableProps<TData> & { summaryFieldName?: string }) {

  // Compute layout based on column order, visibility, and spanning configuration
  const layout = useMemo((): TableLayout => {
    const columnOrder = initialState?.columnOrder || columns.map(c => c.id || '');
    const columnVisibility = initialState?.columnVisibility || {};
    const columnHeaders: Record<string, string> = {};

    // Build column headers map
    columns.forEach(col => {
      if (col.id && typeof col.header === 'string') {
        columnHeaders[col.id] = col.header;
      } else if (col.id) {
        columnHeaders[col.id] = col.id;
      }
    });

    return computeTableLayout(
      columnOrder,
      columnVisibility,
      columnSpanning || {},
      columnHeaders
    );
  }, [columns, initialState?.columnOrder, initialState?.columnVisibility, columnSpanning]);

  // Debug: Verify layout computation  
  console.log('[EnhancedTable] Layout:', {
    mainRow: layout.mainRow.map(c => c.columnId),
    subRow: layout.subRow.map(c => c ? c.columnId : null),
    headerLabels: layout.headerLabels,
  });

  // Handlers that resolve updaters
  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (onStateChange?.onSortingChange) {
      const next = resolveStateUpdater(updater, initialState?.sorting || []);
      onStateChange.onSortingChange(next);
    }
  };

  const handleColumnOrderChange: OnChangeFn<ColumnOrderState> = (updater) => {
    if (onStateChange?.onColumnOrderChange) {
      const next = resolveStateUpdater(updater, initialState?.columnOrder || []);
      onStateChange.onColumnOrderChange(next);
    }
  };

  const handleColumnVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    if (onStateChange?.onColumnVisibilityChange) {
      const next = resolveStateUpdater(updater, initialState?.columnVisibility || {});
      onStateChange.onColumnVisibilityChange(next);
    }
  };

  const handleColumnSizingChange: OnChangeFn<ColumnSizingState> = (updater) => {
    if (onStateChange?.onColumnSizingChange) {
      const next = resolveStateUpdater(updater, initialState?.columnSizing || {});
      onStateChange.onColumnSizingChange(next);
    }
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    defaultColumn: {
      size: 150,
      minSize: 50,
      maxSize: 2000,
    },
    state: {
      sorting: initialState?.sorting || [],
      columnOrder: initialState?.columnOrder && initialState.columnOrder.length > 0 ? initialState.columnOrder : undefined,
      columnVisibility: initialState?.columnVisibility || {},
      columnSizing: initialState?.columnSizing || {},
    },
    onSortingChange: handleSortingChange,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onColumnSizingChange: handleColumnSizingChange,
  });

  // Ref for the scrollable container
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);

  // Map for quick column lookups
  const visibleColumnsMap = useMemo(() => {
    const map = new Map<string, ColumnDef<TData>>();
    columns.forEach(c => c.id && map.set(c.id, c));
    return map;
  }, [columns]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* Single Table with Sticky Header */}
      <div ref={bodyScrollRef} className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
        <table style={{ width: 'auto', minWidth: '100%' }}>
          <colgroup>
            {layout.mainRow.map((layoutCell, index) => {
              // We use the column definition for sizing
              const column = table.getColumn(layoutCell.columnId);
              const size = column ? column.getSize() : 0;
              // If column not found (e.g. actions placeholder), use default or 0?
              // For actions/pin-select, we want them visible.
              // Note: select-actions and actions might need fixed width if not in table model?
              // But select-actions IS in table model. actions might NOT be.
              // If actions is not in model, size is 0. 

              if (!column && layoutCell.columnId === 'actions') {
                // Fallback for actions column if needed
                return <col key={index} style={{ width: 'auto' }} />;
              }

              return (
                <col
                  key={`${layoutCell.columnId}-${index}`}
                  style={{ width: size ? `${size}px` : undefined, minWidth: size ? `${size}px` : undefined, maxWidth: size ? `${size}px` : undefined }}
                />
              );
            })}
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-default-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.HeaderRow key={headerGroup.id}>
                {layout.mainRow.map((layoutCell, index) => {
                  const header = headerGroup.headers.find(h => h.column.id === layoutCell.columnId);
                  // Use layout label
                  const label = layout.headerLabels[index];

                  // If no header found (e.g. actions column not in model), render empty or label
                  if (!header) {
                    return (
                      <Table.HeaderCell key={`${layoutCell.columnId}-${index}`}>
                        <div className="text-body font-body text-subtext-color">{label}</div>
                      </Table.HeaderCell>
                    );
                  }

                  const column = header.column;
                  const canSort = enableSorting && column.getCanSort();
                  const sortDirection = column.getIsSorted();
                  const isResizing = column.getIsResizing();

                  return (
                    <Table.HeaderCell
                      key={header.id}
                      className="overflow-hidden"
                      style={{
                        width: `${header.getSize()}px`,
                        minWidth: `${column.columnDef.minSize || 50}px`,
                        maxWidth: column.columnDef.maxSize ? `${column.columnDef.maxSize}px` : undefined,
                        position: "relative",
                      }}
                    >
                      <div className="flex items-center gap-1 w-full min-w-0 relative">
                        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden pr-2">
                          <div className="truncate">
                            {label || flexRender(column.columnDef.header, header.getContext())}
                          </div>
                          {canSort && (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className="ml-1 p-1 hover:bg-neutral-50 rounded flex-shrink-0"
                              title={sortDirection === "asc" ? "Sort ascending" : sortDirection === "desc" ? "Sort descending" : "Sort"}
                            >
                              {sortDirection === "asc" ? (
                                <FeatherChevronUp className="w-4 h-4 text-brand-600" />
                              ) : sortDirection === "desc" ? (
                                <FeatherChevronDown className="w-4 h-4 text-brand-600" />
                              ) : (
                                <div className="flex flex-col -space-y-1">
                                  <FeatherChevronUp className="w-3 h-3 text-subtext-color" />
                                  <FeatherChevronDown className="w-3 h-3 text-subtext-color" />
                                </div>
                              )}
                            </button>
                          )}
                        </div>
                        {enableColumnResizing && header.column.getCanResize() && (
                          <div
                            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); header.getResizeHandler()(e); }}
                            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); header.getResizeHandler()(e); }}
                            className={`absolute right-0 top-0 h-full bg-transparent hover:bg-brand-600 cursor-col-resize flex-shrink-0 z-30 ${isResizing ? "bg-brand-600" : ""}`}
                            style={{
                              userSelect: "none", touchAction: "none", pointerEvents: "auto",
                              width: "6px", marginRight: "-3px", cursor: "col-resize",
                            }}
                          />
                        )}
                      </div>
                    </Table.HeaderCell>
                  );
                })}
              </Table.HeaderRow>
            ))}
          </thead>
          <tbody className="border-b border-solid border-neutral-border">
            {loading ? (
              <Table.Row>
                <Table.Cell colSpan={layout.mainRow.length} className="text-center text-body font-body text-subtext-color">
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : data.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={layout.mainRow.length} className="text-center text-body font-body text-subtext-color">
                  No data found
                </Table.Cell>
              </Table.Row>
            ) : (
              table.getRowModel().rows.map((row) => {
                const cellMap = new Map(row.getVisibleCells().map(c => [c.column.id, c]));

                // Determine if we need to render the sub-row
                let hasSubRowContent = false;
                const subRowContent = renderSubRow ? renderSubRow(row.original) : null;
                const subRowHasCustomContent = subRowContent !== null && subRowContent !== undefined;

                // Check if any sub-row cell has content (excluding spanned cells)
                const hasSecondRowColumns = layout.subRow.some(item => item && !item.isSpanning);

                const hasSubRow = hasSecondRowColumns || subRowHasCustomContent;

                return (
                  <React.Fragment key={row.id}>
                    {/* Main Row */}
                    <Table.Row
                      clickable={!!onRowClick}
                      onClick={() => onRowClick?.(row.original)}
                      className={hasSubRow ? "h-[1.25rem] border-b-0" : "h-[1.25rem]"}
                    >
                      {layout.mainRow.map((layoutCell, index) => {
                        const cell = cellMap.get(layoutCell.columnId);
                        const subRowItem = layout.subRow[index];

                        // Determine rowSpan: 2 if this column strictly spans both rows
                        const rowSpan = (subRowItem?.isSpanning && hasSubRow) ? 2 : 1;

                        // If cell not found/hidden (e.g. actions?), verify logic
                        if (!cell) {
                          // Placeholder for main row if missing?
                          return <Table.Cell key={`missing-${index}`} />;
                        }

                        return (
                          <Table.Cell
                            key={cell.id}
                            className={cell.column.id === 'title' ? "overflow-visible" : "overflow-hidden"}
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.getSize()}px`,
                              maxHeight: rowSpan === 2 ? '3rem' : undefined,
                            }}
                            rowSpan={rowSpan}
                          >
                            <div className={cell.column.id === 'title' ? "min-w-0" : "min-w-0 overflow-hidden"}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>

                    {/* Sub Row */}
                    {hasSubRow && (
                      <Table.Row className="border-t-0 border-b border-solid border-neutral-border">
                        {layout.subRow.map((layoutCell, index) => {
                          if (layoutCell?.isSpanning) return null; // Already rendered in main row

                          if (!layoutCell) {
                            // Empty slot (placeholder)
                            return <Table.Cell key={`empty-${index}`} />;
                          }

                          const cell = cellMap.get(layoutCell.columnId);
                          if (!cell) {
                            // If cell is missing (e.g. actions not in model), render placeholder
                            return <Table.Cell key={`missing-sub-${index}`} />;
                          }

                          return (
                            <Table.Cell
                              key={`sub-${cell.id}`}
                              colSpan={layoutCell.colSpan || 1}
                              className="pt-0 pb-2"
                            >
                              <div className="flex flex-wrap gap-2">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </div>
                            </Table.Cell>
                          );
                        })}
                      </Table.Row>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div >
  );
}
