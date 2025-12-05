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
} from "@tanstack/react-table";
import { Table } from "./Table";
import { IconButton } from "./IconButton";
import { DropdownMenu } from "./DropdownMenu";
import { FeatherChevronUp, FeatherChevronDown, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

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
  initialState,
  onStateChange,
}: EnhancedTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>(
    initialState?.sorting || []
  );
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(
    initialState?.columnOrder || []
  );
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    initialState?.columnVisibility || {}
  );
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>(
    initialState?.columnSizing || {}
  );
  
  // Track previous initialState values to detect external changes
  const prevInitialColumnOrderRef = React.useRef<string>('');
  const prevInitialColumnSizingRef = React.useRef<string>('');
  
  // Sync state when initialState changes (e.g., when settings update)
  // Only update if values are actually different to prevent infinite loops
  React.useEffect(() => {
    const currentInitialOrderStr = JSON.stringify(initialState?.columnOrder || []);
    const currentInitialSizingStr = JSON.stringify(initialState?.columnSizing || {});
    
    // Only sync if initialState actually changed (external change)
    if (initialState?.columnOrder && initialState.columnOrder.length > 0) {
      if (currentInitialOrderStr !== prevInitialColumnOrderRef.current) {
        const currentOrderStr = JSON.stringify(columnOrder);
        if (currentOrderStr !== currentInitialOrderStr) {
          setColumnOrder(initialState.columnOrder);
        }
        prevInitialColumnOrderRef.current = currentInitialOrderStr;
      }
    }
    
    if (initialState?.columnSizing && Object.keys(initialState.columnSizing).length > 0) {
      if (currentInitialSizingStr !== prevInitialColumnSizingRef.current) {
        const currentSizingStr = JSON.stringify(columnSizing);
        if (currentSizingStr !== currentInitialSizingStr) {
          setColumnSizing(initialState.columnSizing);
        }
        prevInitialColumnSizingRef.current = currentInitialSizingStr;
      }
    }
  }, [initialState?.columnOrder, initialState?.columnSizing]);
  
  // Ref for the scrollable container
  const bodyScrollRef = React.useRef<HTMLDivElement>(null);

  // Handle state changes
  React.useEffect(() => {
    if (onStateChange?.onSortingChange) {
      onStateChange.onSortingChange(sorting);
    }
  }, [sorting, onStateChange]);

  React.useEffect(() => {
    if (onStateChange?.onColumnOrderChange) {
      onStateChange.onColumnOrderChange(columnOrder);
    }
  }, [columnOrder, onStateChange]);

  React.useEffect(() => {
    if (onStateChange?.onColumnVisibilityChange) {
      onStateChange.onColumnVisibilityChange(columnVisibility);
    }
  }, [columnVisibility, onStateChange]);

  React.useEffect(() => {
    if (onStateChange?.onColumnSizingChange) {
      onStateChange.onColumnSizingChange(columnSizing);
    }
  }, [columnSizing, onStateChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableSorting,
    enableColumnResizing,
    columnResizeMode: 'onChange', // Use onChange for explicit pixel sizing during drag
    defaultColumn: {
      size: 150, // Default size in pixels
      minSize: 50,
      maxSize: 2000,
    },
    state: {
      sorting,
      columnOrder: columnOrder.length > 0 ? columnOrder : undefined,
      columnVisibility,
      columnSizing,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
  });

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">

      {/* Single Table with Sticky Header */}
      <div ref={bodyScrollRef} className="flex-1 overflow-x-auto overflow-y-auto min-h-0">
        <table style={{ width: 'auto', minWidth: '100%' }}>
          <colgroup>
            {table.getVisibleLeafColumns().map((column) => {
              const size = column.getSize();
              return (
                <col key={column.id} style={{ width: `${size}px`, minWidth: `${size}px`, maxWidth: `${size}px` }} />
              );
            })}
          </colgroup>
          <thead className="sticky top-0 z-10 bg-default-background">
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.HeaderRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
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
                      <div className="flex items-center gap-1 w-full min-w-0">
                        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
                          <div className="truncate">
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                          {canSort && (
                            <button
                              onClick={header.column.getToggleSortingHandler()}
                              className="ml-1 p-1 hover:bg-neutral-50 rounded flex-shrink-0"
                              title={
                                sortDirection === "asc"
                                  ? "Sort ascending"
                                  : sortDirection === "desc"
                                  ? "Sort descending"
                                  : "Sort"
                              }
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
                            onMouseDown={(e) => {
                              header.getResizeHandler()(e);
                            }}
                            onTouchStart={(e) => {
                              header.getResizeHandler()(e);
                            }}
                            className={`absolute right-0 top-0 h-full w-1 bg-transparent hover:bg-brand-600 cursor-col-resize flex-shrink-0 z-20 ${
                              isResizing ? "bg-brand-600" : ""
                            }`}
                            style={{
                              userSelect: "none",
                              touchAction: "none",
                              pointerEvents: "auto",
                              width: "4px",
                              marginRight: "-2px",
                              cursor: "col-resize",
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
                <Table.Cell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="text-center text-body font-body text-subtext-color"
                >
                  Loading...
                </Table.Cell>
              </Table.Row>
            ) : data.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={table.getVisibleLeafColumns().length}
                  className="text-center text-body font-body text-subtext-color"
                >
                  No data found
                </Table.Cell>
              </Table.Row>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => {
                const hasSubRow = renderSubRow && renderSubRow(row.original);
                const isLastRow = rowIndex === table.getRowModel().rows.length - 1;
                const visibleCells = row.getVisibleCells();
                
                // Find columns that should span two rows (check meta property)
                const columnsSpanningTwoRows = visibleCells.filter(cell => {
                  const meta = cell.column.columnDef.meta as { spanTwoRows?: boolean } | undefined;
                  return meta?.spanTwoRows === true;
                });
                const columnsNotSpanningTwoRows = visibleCells.filter(cell => {
                  const meta = cell.column.columnDef.meta as { spanTwoRows?: boolean } | undefined;
                  return meta?.spanTwoRows !== true;
                });
                
                return (
                  <React.Fragment key={row.id}>
                    <Table.Row
                      clickable={!!onRowClick}
                      onClick={() => onRowClick?.(row.original)}
                      style={{ height: '1.5rem' }}
                      className={hasSubRow ? "h-[1.5rem] border-b-0" : "h-[1.5rem]"}
                    >
                      {visibleCells.map((cell) => {
                        const meta = cell.column.columnDef.meta as { spanTwoRows?: boolean } | undefined;
                        const shouldSpanTwoRows = meta?.spanTwoRows === true && hasSubRow;
                        return (
                          <Table.Cell
                            key={cell.id}
                            className="overflow-hidden"
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.getSize()}px`,
                              maxHeight: shouldSpanTwoRows ? '3rem' : undefined, // 2x row height (1.5rem * 2)
                            }}
                            rowSpan={shouldSpanTwoRows ? 2 : undefined}
                          >
                            <div className="min-w-0 overflow-hidden">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </Table.Cell>
                        );
                      })}
                    </Table.Row>
                    {hasSubRow && (
                      <Table.Row className={isLastRow ? "border-t-0 border-b border-solid border-neutral-border" : "border-t-0"}>
                        {/* Only render cells for columns that don't span two rows
                            The cells that span two rows will automatically be handled by rowSpan */}
                        {columnsNotSpanningTwoRows.length > 0 ? (
                          <Table.Cell
                            colSpan={columnsNotSpanningTwoRows.length}
                            className="pt-0 pb-2 pl-10"
                          >
                            {renderSubRow(row.original)}
                          </Table.Cell>
                        ) : (
                          // If all columns span two rows, still need to render something for the subrow
                          <Table.Cell
                            colSpan={visibleCells.length}
                            className="pt-0 pb-2 pl-10"
                          >
                            {renderSubRow(row.original)}
                          </Table.Cell>
                        )}
                      </Table.Row>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

