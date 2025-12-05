import { Document } from "@/app/data/document";

/**
 * Format a date to a readable string
 */
export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString('en-GB', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch {
    return "—";
  }
};

/**
 * Format file size in bytes to readable string
 */
export const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "—";
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

/**
 * Get custom field value for a document
 */
export const getCustomFieldValue = (doc: Document, fieldId: number): any => {
  if (!doc.custom_fields) return null;
  const instance = doc.custom_fields.find(cf => cf.field === fieldId);
  return instance?.value ?? null;
};

/**
 * Resolve custom field value - converts SELECT field IDs to labels
 */
export const resolveCustomFieldValue = (value: any, field: { data_type: string; extra_data?: { select_options?: Array<{ id: string; label: string }> } }): any => {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  
  // For SELECT fields, convert ID to label
  if (field.data_type === 'select' && field.extra_data?.select_options) {
    // Convert value to string for comparison (IDs might be stored as strings or numbers)
    const valueStr = String(value);
    const option = field.extra_data.select_options.find(opt => String(opt.id) === valueStr);
    return option?.label ?? value; // Return label if found, otherwise return the ID
  }
  
  return value;
};

/**
 * Create lookup maps for efficient ID-to-name conversions
 */
export const createLookupMaps = <T extends { id?: number; name?: string }>(
  items: T[]
): Map<number, string> => {
  const map = new Map<number, string>();
  items.forEach(item => {
    if (item.id !== undefined && item.name !== undefined) {
      map.set(item.id, item.name);
    }
  });
  return map;
};

