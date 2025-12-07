/**
 * Utility functions for consistent column ID formatting
 * 
 * Standard format:
 * - Custom fields: "customField_{id}" (e.g., "customField_15")
 * - Built-in fields: field name as string (e.g., "title", "category")
 * 
 * This ensures all column IDs are strings and we can distinguish custom fields from built-in fields.
 */

/**
 * Normalizes a column ID to the standard format
 * @param columnId - Can be number (custom field ID), string with "customField_" prefix, or built-in field name
 * @returns Normalized column ID string
 */
export function normalizeColumnId(columnId: string | number): string {
  if (typeof columnId === 'number') {
    // Custom field ID as number -> convert to "customField_{id}" format
    return `customField_${columnId}`;
  }
  
  if (typeof columnId === 'string') {
    // If it's already in "customField_" format, return as-is
    if (columnId.startsWith('customField_')) {
      return columnId;
    }
    
    // If it's a numeric string (custom field ID), convert to "customField_" format
    const numId = parseInt(columnId, 10);
    if (!isNaN(numId) && String(numId) === columnId) {
      return `customField_${columnId}`;
    }
    
    // Otherwise, it's a built-in field name -> return as-is
    return columnId;
  }
  
  // Fallback: convert to string
  return String(columnId);
}

/**
 * Checks if a column ID represents a custom field
 */
export function isCustomFieldColumn(columnId: string | number): boolean {
  const normalized = normalizeColumnId(columnId);
  return normalized.startsWith('customField_');
}

/**
 * Checks if a column ID represents a built-in field
 */
export function isBuiltInFieldColumn(columnId: string | number): boolean {
  return !isCustomFieldColumn(columnId);
}

/**
 * Extracts the custom field ID from a column ID
 * @returns The numeric custom field ID, or null if not a custom field
 */
export function extractCustomFieldId(columnId: string | number): number | null {
  const normalized = normalizeColumnId(columnId);
  if (normalized.startsWith('customField_')) {
    const idStr = normalized.replace('customField_', '');
    const id = parseInt(idStr, 10);
    return isNaN(id) ? null : id;
  }
  return null;
}

/**
 * Normalizes an array of column IDs
 */
export function normalizeColumnOrder(columnOrder: (string | number)[]): string[] {
  return columnOrder.map(id => normalizeColumnId(id));
}

/**
 * Normalizes column visibility object keys
 */
export function normalizeColumnVisibility(
  visibility: Record<string, boolean>
): Record<string, boolean> {
  const normalized: Record<string, boolean> = {};
  Object.entries(visibility).forEach(([key, value]) => {
    normalized[normalizeColumnId(key)] = value;
  });
  return normalized;
}

/**
 * Normalizes column sizing object keys
 */
export function normalizeColumnSizing(
  sizing: Record<string, number>
): Record<string, number> {
  const normalized: Record<string, number> = {};
  Object.entries(sizing).forEach(([key, value]) => {
    normalized[normalizeColumnId(key)] = value;
  });
  return normalized;
}

/**
 * Normalizes column spanning object keys
 */
export function normalizeColumnSpanning(
  spanning: Record<string, boolean>
): Record<string, boolean> {
  const normalized: Record<string, boolean> = {};
  Object.entries(spanning).forEach(([key, value]) => {
    normalized[normalizeColumnId(key)] = value;
  });
  return normalized;
}

/**
 * Normalizes column display types object keys
 */
export function normalizeColumnDisplayTypes(
  displayTypes: Record<string, string>
): Record<string, string> {
  const normalized: Record<string, string> = {};
  Object.entries(displayTypes).forEach(([key, value]) => {
    normalized[normalizeColumnId(key)] = value;
  });
  return normalized;
}

