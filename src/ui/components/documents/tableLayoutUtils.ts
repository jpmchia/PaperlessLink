/**
 * Table Layout Utility
 * 
 * Computes the layout for main row and sub row based on column configuration.
 * - Columns with spanBothRows appear in both rows (same cell spans 2 rows)
 * - Columns with showOnSecondRow appear only in the sub row, filling empty slots
 * - Regular columns appear only in the main row, leaving sub row slot empty
 * - Empty sub row slots are spanned by adjacent secondRow columns via colspan
 */

export interface LayoutCell {
    columnId: string;
    colSpan?: number;
    rowSpan?: number;
    isSpanning?: boolean; // True if this cell spans from main row
}

export interface TableLayout {
    mainRow: LayoutCell[];
    subRow: (LayoutCell | null)[];
    headerLabels: string[]; // Combined labels for headers (e.g., "Document Name / Correspondent")
}

/**
 * Compute table layout based on column order and spanning configuration.
 * 
 * @param columnOrder - Array of column IDs in display order
 * @param columnVisibility - Map of column ID to visibility
 * @param columnSpanning - Map of column ID to spanning settings (includes _secondRow keys)
 * @param columnHeaders - Map of column ID to header text
 * @returns TableLayout with mainRow, subRow, and headerLabels
 */
export function computeTableLayout(
    columnOrder: string[],
    columnVisibility: Record<string, boolean>,
    columnSpanning: Record<string, boolean>,
    columnHeaders: Record<string, string>
): TableLayout {
    const mainRow: LayoutCell[] = [];
    const subRow: (LayoutCell | null)[] = [];
    const headerLabels: string[] = [];

    // Initialize position 0: Pin/Checkbox in main row, Actions in sub row
    mainRow.push({ columnId: 'select-actions' });
    subRow.push({ columnId: 'actions', isSpanning: false }); // Actions go in sub row at position 0
    headerLabels.push(''); // Empty header for select-actions column

    // Queue for columns marked as showOnSecondRow
    const secondRowQueue: string[] = [];

    // First pass: identify columns and their settings (starting from index 1)
    const visibleColumns = columnOrder.filter(id =>
        columnVisibility[id] !== false &&
        id !== 'select-actions' &&
        id !== 'pin-select' &&
        id !== 'actions'
    );

    for (const columnId of visibleColumns) {
        const spanBothRows = columnSpanning[columnId] === true;
        const showOnSecondRow = columnSpanning[`${columnId}_secondRow`] === true;

        if (showOnSecondRow) {
            // Queue this column for second row placement
            secondRowQueue.push(columnId);
        } else {
            // Add to main row
            mainRow.push({ columnId });

            if (spanBothRows) {
                // Same cell spans both rows
                subRow.push({ columnId, isSpanning: true, rowSpan: 2 });
                headerLabels.push(columnHeaders[columnId] || columnId);
            } else {
                // Leave sub row slot null for now (will be filled by secondRow columns)
                subRow.push(null);
                headerLabels.push(columnHeaders[columnId] || columnId);
            }
        }
    }

    // Second pass: fill sub row slots with secondRow columns (starting from index 1)
    let subRowIndex = 1; // Start from 1, position 0 is reserved for actions
    let queueIndex = 0;

    while (queueIndex < secondRowQueue.length && subRowIndex < subRow.length) {
        // Find next empty slot in subRow
        while (subRowIndex < subRow.length && subRow[subRowIndex] !== null) {
            subRowIndex++;
        }

        if (subRowIndex >= subRow.length) break;

        const secondRowColumnId = secondRowQueue[queueIndex];

        // Count consecutive empty slots
        let colSpan = 1;
        let nextIndex = subRowIndex + 1;
        while (nextIndex < subRow.length && subRow[nextIndex] === null) {
            // Check if there are more secondRow columns to place
            if (queueIndex + 1 < secondRowQueue.length) {
                // Leave room for other secondRow columns
                break;
            }
            colSpan++;
            nextIndex++;
        }

        // Place the secondRow column
        subRow[subRowIndex] = { columnId: secondRowColumnId, colSpan };

        // Update header to combine names
        if (headerLabels[subRowIndex]) {
            headerLabels[subRowIndex] = `${headerLabels[subRowIndex]} / ${columnHeaders[secondRowColumnId] || secondRowColumnId}`;
        }

        // Mark subsequent slots as "occupied" (they'll be skipped)
        for (let i = subRowIndex + 1; i < subRowIndex + colSpan; i++) {
            subRow[i] = { columnId: '', colSpan: 0 }; // Marker for "spanned over"
        }

        queueIndex++;
        subRowIndex = nextIndex;
    }

    return { mainRow, subRow, headerLabels };
}

/**
 * Check if a sub row cell should be rendered (not null and not spanned over)
 */
export function shouldRenderSubRowCell(cell: LayoutCell | null): boolean {
    if (cell === null) return false;
    if (cell.colSpan === 0) return false; // Marker for "spanned over"
    if (cell.isSpanning) return false; // Rendered as rowSpan from main row
    return true;
}
