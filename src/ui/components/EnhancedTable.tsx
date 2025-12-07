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
  summaryFieldName,
}: EnhancedTableProps<TData> & { summaryFieldName?: string }) {
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
          <thead className="sticky top-0 z-[1] bg-default-background">
            {table.getHeaderGroups().map((headerGroup) => {
              // Detect which columns have fields rendering on second row
              const visibleHeaders = headerGroup.headers;
              
              // Find fields that render on second row (via showOnSecondRow meta)
              const secondRowFields = visibleHeaders
                .map((h, idx) => {
                  const meta = h.column.columnDef.meta as { showOnSecondRow?: boolean } | undefined;
                  if (meta?.showOnSecondRow === true) {
                    const headerText = h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext());
                    return { index: idx, headerText, columnId: h.column.id };
                  }
                  return null;
                })
                .filter((item): item is { index: number; headerText: React.ReactNode; columnId: string } => item !== null);
              
              // Find where Summary renders (via renderSubRow) - under first rowspan=1 column
              let summaryStartHeaderIndex = -1;
              let summaryFieldName: string | null = null;
              
              if (renderSubRow) {
                // Find the first header that doesn't span two rows (where Summary would start)
                summaryStartHeaderIndex = visibleHeaders.findIndex((h) => {
                  const meta = h.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean } | undefined;
                  const shouldSpan = meta?.spanTwoRows === true;
                  const renderInSubRow = meta?.renderInSubRow === true;
                  return !shouldSpan && !(renderInSubRow && h.column.id === 'actions');
                });
                
                // Try to detect Summary field name from columns
                if (summaryStartHeaderIndex >= 0) {
                  // Check if there's a Summary custom field column
                  const summaryColumn = visibleHeaders.find(h => {
                    const id = h.column.id;
                    return id.startsWith('customField_') && 
                           (typeof h.column.columnDef.header === 'string' ? h.column.columnDef.header : '') === 'Summary';
                  });
                  
                  if (summaryColumn) {
                    summaryFieldName = typeof summaryColumn.column.columnDef.header === 'string' 
                      ? summaryColumn.column.columnDef.header 
                      : 'Summary';
                  } else {
                    // Fallback: assume Summary if renderSubRow is provided
                    summaryFieldName = 'Summary';
                  }
                }
              }
              
              // Build map of header index to second-row field names
              const headerToSecondRowFields = new Map<number, string[]>();
              
              if (secondRowFields.length > 0) {
                // Find the first rowspan=1 header where second-row fields render
                const firstRowspan1HeaderIndex = visibleHeaders.findIndex((h) => {
                  const meta = h.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean } | undefined;
                  const shouldSpan = meta?.spanTwoRows === true;
                  const renderInSubRow = meta?.renderInSubRow === true;
                  return !shouldSpan && !(renderInSubRow && h.column.id === 'actions');
                });
                
                if (firstRowspan1HeaderIndex >= 0) {
                  const fieldNames = secondRowFields.map(f => {
                    const headerText = typeof f.headerText === 'string' ? f.headerText : String(f.headerText);
                    return headerText;
                  });
                  headerToSecondRowFields.set(firstRowspan1HeaderIndex, fieldNames);
                }
              }
              
              // Add Summary to the map if it renders via renderSubRow
              if (summaryStartHeaderIndex >= 0 && summaryFieldName) {
                const existing = headerToSecondRowFields.get(summaryStartHeaderIndex) || [];
                headerToSecondRowFields.set(summaryStartHeaderIndex, [...existing, summaryFieldName]);
              }
              
              return (
                <Table.HeaderRow key={headerGroup.id}>
                  {headerGroup.headers.map((header, headerIndex) => {
                    const column = header.column;
                    const canSort = enableSorting && column.getCanSort();
                    const sortDirection = column.getIsSorted();
                    const isResizing = column.getIsResizing();
                    
                    // Get base header text
                    const baseHeader = header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext());
                    
                    // Check if this header has second-row fields rendering under it
                    const secondRowFieldNames = headerToSecondRowFields.get(headerIndex);
                    const displayHeader = secondRowFieldNames && secondRowFieldNames.length > 0 && baseHeader
                      ? `${String(baseHeader)} / ${secondRowFieldNames.join(' / ')}`
                      : baseHeader;

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
                              {displayHeader}
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
                              e.preventDefault();
                              e.stopPropagation();
                              header.getResizeHandler()(e);
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              header.getResizeHandler()(e);
                            }}
                            className={`absolute right-0 top-0 h-full bg-transparent hover:bg-brand-600 cursor-col-resize flex-shrink-0 z-30 ${
                              isResizing ? "bg-brand-600" : ""
                            }`}
                            style={{
                              userSelect: "none",
                              touchAction: "none",
                              pointerEvents: "auto",
                              width: "6px",
                              marginRight: "-3px",
                              cursor: "col-resize",
                            }}
                          />
                        )}
                      </div>
                    </Table.HeaderCell>
                  );
                })}
              </Table.HeaderRow>
              );
            })}
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
                const visibleCells = row.getVisibleCells();
                
                // Check if there's an actions column that should render in subrow
                const hasActionsInSubRow = visibleCells.some(cell => {
                  const meta = cell.column.columnDef.meta as { renderInSubRow?: boolean } | undefined;
                  return cell.column.id === 'actions' && meta?.renderInSubRow === true;
                });
                
                // Check if any cells should render on second row
                const hasSecondRowCells = visibleCells.some(cell => {
                  const meta = cell.column.columnDef.meta as { showOnSecondRow?: boolean } | undefined;
                  return meta?.showOnSecondRow === true;
                });
                
                // Check if renderSubRow returns content (legacy support for subrow_content setting)
                const subRowContent = renderSubRow ? renderSubRow(row.original) : null;
                const hasSubRowContent = subRowContent !== null && subRowContent !== undefined;
                
                // Always render subrow if actions should appear in subrow, if there are second-row cells, or if there's legacy subrow content
                const hasSubRow = hasActionsInSubRow || hasSecondRowCells || hasSubRowContent;
                
                const isLastRow = rowIndex === table.getRowModel().rows.length - 1;
                
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
                      className={hasSubRow ? "h-[1.25rem] border-b-0" : "h-[1.25rem]"}
                    >
                      {visibleCells.map((cell) => {
                        const meta = cell.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                        const shouldSpanTwoRows = meta?.spanTwoRows === true;
                        const renderInSubRow = meta?.renderInSubRow === true;
                        const showOnSecondRow = meta?.showOnSecondRow === true;
                        
                        // Skip cells that should render on second row - they'll be rendered in subrow
                        if (showOnSecondRow && hasSubRow) {
                          return null;
                        }
                        
                        // Render empty cell for actions column in main row if there's a subrow
                        if (renderInSubRow && hasSubRow) {
                          return (
                            <Table.Cell
                              key={cell.id}
                              className="overflow-hidden"
                              style={{
                                width: `${cell.column.getSize()}px`,
                                minWidth: `${cell.column.getSize()}px`,
                              }}
                            />
                          );
                        }
                        
                        // Calculate rowspan: 2 if spanning both rows and there's a subrow, otherwise 1 (or undefined)
                        const rowSpan = shouldSpanTwoRows && hasSubRow ? 2 : undefined;
                        
                        return (
                          <Table.Cell
                            key={cell.id}
                            className={cell.column.id === 'title' ? "overflow-visible" : "overflow-hidden"}
                            style={{
                              width: `${cell.column.getSize()}px`,
                              minWidth: `${cell.column.getSize()}px`,
                              maxHeight: rowSpan === 2 ? '3rem' : undefined, // 2x row height (1.5rem * 2)
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
                    {hasSubRow && (
                      <Table.Row className={isLastRow ? "border-t-0 border-b border-solid border-neutral-border" : "border-t-0"}>
                        {/* Render cells aligned with columns
                            - Columns that span two rows are already rendered in the first row with rowSpan=2
                            - Actions column only renders in subrow (in first column position, aligned with pin-select)
                            - Summary spans from pin-select to title (or beyond if no spanning columns) */}
                        {(() => {
                          // Find actions column (if it exists and should render in subrow)
                          const actionsCell = visibleCells.find(c => {
                            const cMeta = c.column.columnDef.meta as { renderInSubRow?: boolean } | undefined;
                            return c.column.id === 'actions' && cMeta?.renderInSubRow === true;
                          });
                          
                          // Find cells that should render on second row
                          const secondRowCells = visibleCells.filter(c => {
                            const cMeta = c.column.columnDef.meta as { showOnSecondRow?: boolean } | undefined;
                            return cMeta?.showOnSecondRow === true;
                          });
                          
                          // Calculate cells with rowspan = 1 (not spanning two rows)
                          const cellsWithRowspan1 = visibleCells.filter((cell) => {
                            const meta = cell.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                            const shouldSpanTwoRows = meta?.spanTwoRows === true;
                            const renderInSubRow = meta?.renderInSubRow === true;
                            const showOnSecondRow = meta?.showOnSecondRow === true;
                            // Count cells that don't span two rows and aren't actions/second-row cells
                            return !shouldSpanTwoRows && !(renderInSubRow && cell.column.id === 'actions') && !showOnSecondRow;
                          });
                          
                          // Calculate colspan for second-row cells: number of cells with rowspan = 1
                          const secondRowColSpan = cellsWithRowspan1.length;
                          
                          let summaryRendered = false;
                          let secondRowRendered = false;
                          
                          // For legacy renderSubRow support: find where Summary should render
                          // Summary should render under the first rowspan=1 cell (typically Document Name/title)
                          let summaryStartCellIndex = -1;
                          let summaryColSpan = 0;
                          
                          if (hasSubRowContent && secondRowCells.length === 0) {
                            // Find the first cell with rowspan = 1 (this is where Summary should start)
                            summaryStartCellIndex = visibleCells.findIndex((c) => {
                              const cMeta = c.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                              const cShouldSpan = cMeta?.spanTwoRows === true;
                              const cRenderInSubRow = cMeta?.renderInSubRow === true;
                              const cShowOnSecondRow = cMeta?.showOnSecondRow === true;
                              return !cShouldSpan && !(cRenderInSubRow && c.column.id === 'actions') && !cShowOnSecondRow;
                            });
                            
                            if (summaryStartCellIndex >= 0) {
                              // Calculate how many rowspan=1 cells come after the start position (including the start cell)
                              for (let i = summaryStartCellIndex; i < visibleCells.length; i++) {
                                const c = visibleCells[i];
                                const cMeta = c.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                                const cShouldSpan = cMeta?.spanTwoRows === true;
                                const cRenderInSubRow = cMeta?.renderInSubRow === true;
                                const cShowOnSecondRow = cMeta?.showOnSecondRow === true;
                                
                                // Count cells that don't span two rows and aren't actions/second-row cells
                                if (!cShouldSpan && !(cRenderInSubRow && c.column.id === 'actions') && !cShowOnSecondRow) {
                                  summaryColSpan++;
                                }
                              }
                            }
                          }
                          
                          // Track actual rendered position (accounting for skipped spanning columns)
                          let actualRenderedIndex = 0;
                          
                          return visibleCells.map((cell, cellIndex) => {
                            const meta = cell.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                            const shouldSpanTwoRows = meta?.spanTwoRows === true;
                            const renderInSubRow = meta?.renderInSubRow === true;
                            const showOnSecondRow = meta?.showOnSecondRow === true;
                            
                            // Skip columns that span two rows - they're already rendered in the first row
                            if (shouldSpanTwoRows) {
                              return null;
                            }
                            
                            // Render actions in the first column position (aligned with pin-select)
                            if (actualRenderedIndex === 0 && actionsCell) {
                              actualRenderedIndex++;
                              return (
                                <Table.Cell
                                  key={`actions-${cell.id}`}
                                  className="pt-0 pb-2 align-top"
                                  style={{
                                    width: `${cell.column.getSize()}px`,
                                    minWidth: `${cell.column.getSize()}px`,
                                  }}
                                >
                                  <div className="flex items-start justify-center">
                                    {flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
                                  </div>
                                </Table.Cell>
                              );
                            }
                            
                            // Skip actions column in its own position (it's already rendered above)
                            if (renderInSubRow && cell.column.id === 'actions') {
                              return null;
                            }
                            
                            // Render fields that should show on second row
                            if (showOnSecondRow && !secondRowRendered) {
                              // Find the first cell with rowspan = 1 to position second-row fields
                              const firstRowspan1Index = visibleCells.findIndex((c, idx) => {
                                const cMeta = c.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                                const cShouldSpan = cMeta?.spanTwoRows === true;
                                const cRenderInSubRow = cMeta?.renderInSubRow === true;
                                const cShowOnSecondRow = cMeta?.showOnSecondRow === true;
                                return !cShouldSpan && !(cRenderInSubRow && c.column.id === 'actions') && !cShowOnSecondRow;
                              });
                              
                              // Render second-row cells at the position of the first rowspan=1 cell
                              if (cellIndex === firstRowspan1Index) {
                                secondRowRendered = true;
                                actualRenderedIndex += secondRowColSpan;
                                return (
                                  <Table.Cell
                                    key={`secondRow-${cell.id}`}
                                    colSpan={secondRowColSpan}
                                    className="pt-0 pb-2"
                                  >
                                    <div className="flex flex-wrap gap-2">
                                      {secondRowCells.map((secondRowCell) => (
                                        <div key={secondRowCell.id}>
                                          {flexRender(secondRowCell.column.columnDef.cell, secondRowCell.getContext())}
                                        </div>
                                      ))}
                                    </div>
                                  </Table.Cell>
                                );
                              }
                            }
                            
                            // Skip other second-row cells (they're rendered together above)
                            if (showOnSecondRow) {
                              return null;
                            }
                            
                            // Legacy support: Render Summary via renderSubRow (if no second-row cells are configured)
                            // Summary renders under the first rowspan=1 cell and spans all subsequent rowspan=1 cells
                            if (!summaryRendered && hasSubRowContent && secondRowCells.length === 0 && cellIndex === summaryStartCellIndex) {
                              summaryRendered = true;
                              actualRenderedIndex += summaryColSpan;
                              return (
                                <Table.Cell
                                  key={`summary-legacy-${cell.id}`}
                                  colSpan={summaryColSpan}
                                  className="pt-0 pb-2"
                                >
                                  {subRowContent}
                                </Table.Cell>
                              );
                            }
                            
                            // Skip cells that are covered by legacy Summary's colSpan
                            if (hasSubRowContent && summaryRendered && secondRowCells.length === 0) {
                              if (summaryStartCellIndex >= 0 && cellIndex >= summaryStartCellIndex && cellIndex < summaryStartCellIndex + summaryColSpan) {
                                return null; // This cell is covered by Summary's colspan
                              }
                            }
                            
                            // Increment actual rendered index for non-spanning cells
                            actualRenderedIndex++;
                            
                            // Skip cells covered by second-row colspan
                            if (secondRowCells.length > 0) {
                              const firstRowspan1Index = visibleCells.findIndex((c) => {
                                const cMeta = c.column.columnDef.meta as { spanTwoRows?: boolean; renderInSubRow?: boolean; showOnSecondRow?: boolean } | undefined;
                                const cShouldSpan = cMeta?.spanTwoRows === true;
                                const cRenderInSubRow = cMeta?.renderInSubRow === true;
                                const cShowOnSecondRow = cMeta?.showOnSecondRow === true;
                                return !cShouldSpan && !(cRenderInSubRow && c.column.id === 'actions') && !cShowOnSecondRow;
                              });
                              
                              if (cellIndex >= firstRowspan1Index && cellIndex < firstRowspan1Index + secondRowColSpan) {
                                return null;
                              }
                            }
                            
                            // For other non-spanning columns, render empty cells to maintain alignment
                            return (
                              <Table.Cell
                                key={cell.id}
                                className="pt-0 pb-2"
                                style={{
                                  width: `${cell.column.getSize()}px`,
                                  minWidth: `${cell.column.getSize()}px`,
                                }}
                              />
                            );
                          });
                        })()}
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

