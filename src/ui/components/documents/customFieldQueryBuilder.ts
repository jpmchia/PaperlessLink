/**
 * Utility functions for building custom field filter queries
 * Used by both document list filtering and context-aware filter value fetching
 */

export type CustomFieldFilterData = {
  type: string;
  value: any;
};

/**
 * Converts custom field filter data to a query format for the API
 * Handles blank values, multi-select, single-select, date-range, and populated filters
 */
export function buildCustomFieldQuery(
  fieldId: number,
  filterData: CustomFieldFilterData
): any[] | null {
  const { type, value } = filterData;

  try {
    if (type === 'populated') {
      if (value === 'populated') {
        // Format: [fieldId, "exists", true]
        return [fieldId, "exists", true];
      } else if (value === 'not-populated') {
        // Use OR to match documents that either don't have the field OR have null value
        // Format: ["OR", [[fieldId, "exists", false], [fieldId, "isnull", true]]]
        return [
          "OR",
          [
            [fieldId, "exists", false],
            [fieldId, "isnull", true]
          ]
        ];
      }
    } else if (type === 'multi-select' || type === 'single-select') {
      // Normalize to array
      const values = Array.isArray(value) ? value : (value ? [value] : []);
      
      if (values.length > 0) {
        // Check if "__blank__" is in the selected values
        const hasBlank = values.includes('__blank__');
        const nonBlankValues = values.filter(v => v !== '__blank__').map(v => String(v));
        
        if (hasBlank && nonBlankValues.length > 0) {
          // Both blank and non-blank values selected - use OR to match either
          // Use OR to match documents that either have the values OR don't have the field/have null value
          // Format: ["OR", [[fieldId, "in", [value1, value2]], ["OR", [[fieldId, "exists", false], [fieldId, "isnull", true]]]]]
          return [
            "OR",
            [
              [fieldId, "in", nonBlankValues],
              [
                "OR",
                [
                  [fieldId, "exists", false],
                  [fieldId, "isnull", true]
                ]
              ]
            ]
          ];
        } else if (hasBlank) {
          // Only blank selected
          // Use OR to match documents that either don't have the field OR have null value
          // This works around paperless-ngx limitation where "isnull" only matches documents with field instances
          // Format: ["OR", [[fieldId, "exists", false], [fieldId, "isnull", true]]]
          return [
            "OR",
            [
              [fieldId, "exists", false],
              [fieldId, "isnull", true]
            ]
          ];
        } else if (nonBlankValues.length > 0) {
          // Only non-blank values selected
          // Format: [fieldId, "in", [value1, value2]]
          return [fieldId, "in", nonBlankValues];
        }
      }
    } else if (type === 'date-range') {
      if (value && typeof value === 'object' && ('start' in value || 'end' in value)) {
        const dateRange = value as { start?: Date | null; end?: Date | null };
        if (dateRange.start && dateRange.end) {
          // Format: [fieldId, "range", ["start-date", "end-date"]]
          const startStr = dateRange.start.toISOString().split('T')[0];
          const endStr = dateRange.end.toISOString().split('T')[0];
          return [fieldId, "range", [startStr, endStr]];
        } else if (dateRange.start) {
          // Format: [fieldId, "gte", "start-date"]
          const startStr = dateRange.start.toISOString().split('T')[0];
          return [fieldId, "gte", startStr];
        } else if (dateRange.end) {
          // Format: [fieldId, "lte", "end-date"]
          const endStr = dateRange.end.toISOString().split('T')[0];
          return [fieldId, "lte", endStr];
        }
      }
    }
  } catch (error) {
    console.error(`Error building custom field query for field ${fieldId}:`, error);
  }

  return null;
}

/**
 * Builds an array of custom field queries from a filters object
 * Excludes the specified fieldId if provided (for context-aware filtering)
 */
export function buildCustomFieldQueries(
  customFields: Record<string, CustomFieldFilterData>,
  excludeFieldId?: number
): any[] {
  const queries: any[] = [];

  Object.entries(customFields).forEach(([fieldIdStr, filterData]) => {
    const fieldId = parseInt(fieldIdStr, 10);
    if (isNaN(fieldId)) return;
    
    // Skip excluded field (for context-aware filtering)
    if (excludeFieldId !== undefined && fieldId === excludeFieldId) return;

    const query = buildCustomFieldQuery(fieldId, filterData);
    if (query) {
      queries.push(query);
    }
  });

  return queries;
}

/**
 * Combines multiple custom field queries into a single query
 * Uses AND operator if multiple queries exist
 */
export function combineCustomFieldQueries(queries: any[]): any {
  if (queries.length === 0) {
    return null;
  }
  
  if (queries.length === 1) {
    return queries[0];
  }
  
  // Combine with AND operator
  return ["AND", queries];
}

