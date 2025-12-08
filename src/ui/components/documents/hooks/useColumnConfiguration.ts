import { useMemo, useCallback } from 'react';
import { CustomView } from '@/app/data/custom-view';
import { CustomField } from '@/app/data/custom-field';
import { UiSettings } from '@/app/data/ui-settings';
import { SETTINGS_KEYS } from '@/app/data/ui-settings';
import { getDefaultTableDisplayType } from '@/ui/components/settings/customFieldHelpers';

interface UseColumnConfigurationOptions {
  customFields: CustomField[];
  appliedCustomView: CustomView | null;
  settings: UiSettings | null;
  pendingColumnOrder: (string | number)[] | null;
  pendingColumnVisibility: Record<string, boolean> | null;
}

/**
 * Hook to manage column configuration (order, visibility, sizing)
 */
export function useColumnConfiguration({
  customFields,
  appliedCustomView,
  settings,
  pendingColumnOrder,
  pendingColumnVisibility,
}: UseColumnConfigurationOptions) {
  // Get custom fields that should be displayed as table columns, sorted by display order
  const visibleCustomFieldColumns = useMemo(() => {
    if (!customFields.length) return [];

    // Use custom view settings if available
    if (appliedCustomView) {
      const columnFields: Array<{ field: CustomField; displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'; columnWidth?: number }> = [];

      // Get column order from custom view (includes both built-in and custom fields)
      const columnOrder = appliedCustomView.column_order || [];

      // Extract custom field IDs from column_order (they're numbers)
      // Extract custom field IDs from column_order (they are strings in format "customField_ID")
      const customFieldIdsInOrder: number[] = [];
      columnOrder.forEach(id => {
        if (typeof id === 'string' && id.startsWith('customField_')) {
          const numId = parseInt(id.replace('customField_', ''), 10);
          if (!isNaN(numId)) {
            customFieldIdsInOrder.push(numId);
          }
        } else if (typeof id === 'number') {
          // Legacy support for numeric IDs
          customFieldIdsInOrder.push(id);
        }
      });

      // Get visibility map from custom view
      const columnVisibility = appliedCustomView.column_visibility || {};

      // Get display types and sizing from custom view
      const columnDisplayTypes = appliedCustomView.column_display_types || {};
      const columnSizing = appliedCustomView.column_sizing || {};

      // Create a map of custom fields by ID for quick lookup
      const customFieldMap = new Map<number, CustomField>();
      customFields.forEach(field => {
        if (field.id !== undefined) {
          customFieldMap.set(field.id, field);
        }
      });

      // Process fields in the order specified by column_order
      customFieldIdsInOrder.forEach(fieldId => {
        const field = customFieldMap.get(fieldId);
        if (!field) return;

        // Check visibility - use customField_X key format
        const visibilityKey = `customField_${fieldId}`;
        const isVisible = columnVisibility[visibilityKey] !== false;

        if (isVisible) {
          const displayType = columnDisplayTypes[fieldId] || getDefaultTableDisplayType(field.data_type);
          const sizingKey = `customField_${fieldId}`;
          const columnWidth = columnSizing[sizingKey];

          columnFields.push({
            field,
            displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
            columnWidth: columnWidth ? (typeof columnWidth === 'number' ? columnWidth : parseInt(String(columnWidth), 10)) : undefined,
          });
        }
      });

      // Add any remaining custom fields that are visible but not in column_order
      customFields.forEach((field) => {
        if (field.id === undefined) return;
        const visibilityKey = `customField_${field.id}`;
        const isVisible = columnVisibility[visibilityKey] !== false;

        // Only add if not already in columnFields
        if (isVisible && !columnFields.find(cf => cf.field.id === field.id)) {
          const displayType = columnDisplayTypes[field.id] || getDefaultTableDisplayType(field.data_type);
          const sizingKey = `customField_${field.id}`;
          const columnWidth = columnSizing[sizingKey];

          columnFields.push({
            field,
            displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
            columnWidth: columnWidth ? (typeof columnWidth === 'number' ? columnWidth : parseInt(String(columnWidth), 10)) : undefined,
          });
        }
      });

      return columnFields;
    }

    // Fall back to global settings
    if (!settings?.settings) return [];

    const settingsObj = settings.settings as Record<string, any>;
    const displayOrder = settingsObj[SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER] || [];

    // Get all fields that should be displayed as columns
    const columnFields: Array<{ field: CustomField; displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'; columnWidth?: number }> = [];

    customFields.forEach((field) => {
      if (field.id === undefined) return;
      const columnKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${field.id}`;
      if (settingsObj[columnKey] === true) {
        const displayTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${field.id}`;
        const columnWidthKey = `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${field.id}`;
        const displayType = settingsObj[displayTypeKey] || getDefaultTableDisplayType(field.data_type);
        const columnWidth = settingsObj[columnWidthKey];
        columnFields.push({
          field,
          displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
          columnWidth: columnWidth ? parseInt(columnWidth, 10) : undefined,
        });
      }
    });

    // Sort by display order
    if (displayOrder.length > 0) {
      columnFields.sort((a, b) => {
        const aId = a.field.id!;
        const bId = b.field.id!;
        const aIndex = displayOrder.indexOf(aId);
        const bIndex = displayOrder.indexOf(bId);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    }

    return columnFields;
  }, [settings, customFields, appliedCustomView]);

  // Get column order from custom view or settings (use pending if available)
  const columnOrderFromSettings = useMemo(() => {
    const { normalizeColumnOrder } = require('@/ui/utils/columnIdUtils');

    // Prefer pending changes, then custom view column order
    let rawOrder: (string | number)[] | null = null;
    if (pendingColumnOrder !== null) {
      rawOrder = pendingColumnOrder;
    } else if (appliedCustomView?.column_order) {
      rawOrder = appliedCustomView.column_order;
    } else if (settings?.settings) {
      const settingsObj = settings.settings as Record<string, any>;
      const order = settingsObj[SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER] as (string | number)[] | undefined;
      rawOrder = order || null;
    }

    // Normalize to consistent format (returns string[])
    return rawOrder ? normalizeColumnOrder(rawOrder) : null;
  }, [settings, appliedCustomView, pendingColumnOrder]);

  // Get column visibility from custom view or settings (use pending if available)
  const columnVisibilityFromSettings = useMemo(() => {
    const { normalizeColumnVisibility } = require('@/ui/utils/columnIdUtils');

    // Prefer pending changes, then custom view column visibility
    let rawVisibility: Record<string, boolean> = {};
    if (pendingColumnVisibility !== null) {
      rawVisibility = pendingColumnVisibility;
    } else if (appliedCustomView?.column_visibility) {
      rawVisibility = appliedCustomView.column_visibility;
    }

    // Normalize to consistent format
    return normalizeColumnVisibility(rawVisibility);
  }, [appliedCustomView, pendingColumnVisibility]);

  // Get enabled built-in fields and their widths from custom view or settings
  const { enabledBuiltInFields, builtInFieldWidths } = useMemo(() => {
    // Use custom view settings if available, otherwise fall back to global settings
    if (appliedCustomView) {
      const enabled = new Set<string>();
      const widths = new Map<string, number>();

      // Get visibility and widths from custom view
      ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner', 'tags'].forEach(fieldId => {
        const isEnabled = appliedCustomView.column_visibility?.[fieldId] !== false;
        if (isEnabled) {
          enabled.add(fieldId);

          // Get column width from custom view
          const width = appliedCustomView.column_sizing?.[fieldId];
          if (width && width > 0) {
            widths.set(fieldId, width);
          }
        }
      });

      return { enabledBuiltInFields: enabled, builtInFieldWidths: widths };
    }

    // Fall back to global settings
    if (!settings?.settings) {
      // Default: all built-in fields enabled
      return {
        enabledBuiltInFields: new Set(['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner', 'tags', 'summary']),
        builtInFieldWidths: new Map<string, number>(),
      };
    }
    const settingsObj = settings.settings as Record<string, any>;
    const enabled = new Set<string>();
    const widths = new Map<string, number>();

    ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner', 'tags', 'summary'].forEach(fieldId => {
      const key = `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX}${fieldId}`;
      // Default to true if not set (only exclude if explicitly false)
      const isEnabled = settingsObj[key] !== false;
      if (isEnabled) {
        enabled.add(fieldId);

        // Get column width for this field
        const widthKey = `general-settings:documents:built-in-field:column-width:${fieldId}`;
        const widthValue = settingsObj[widthKey];
        if (widthValue) {
          const width = typeof widthValue === 'number' ? widthValue : parseInt(String(widthValue), 10);
          if (!isNaN(width) && width > 0) {
            widths.set(fieldId, width);
          }
        }
      }
    });

    return { enabledBuiltInFields: enabled, builtInFieldWidths: widths };
  }, [settings, appliedCustomView]);

  // Compute column sizing from custom view or settings
  const columnSizingFromSettings = useMemo(() => {
    // Use custom view column sizing if available
    if (appliedCustomView?.column_sizing) {
      return { ...appliedCustomView.column_sizing };
    }

    // Fall back to global settings
    if (!settings?.settings) return {};
    const settingsObj = settings.settings as Record<string, any>;
    const sizing: Record<string, number> = {};

    // Add built-in field widths
    ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner', 'tags', 'summary'].forEach(fieldId => {
      const widthKey = `general-settings:documents:built-in-field:column-width:${fieldId}`;
      const widthValue = settingsObj[widthKey];
      if (widthValue) {
        const width = typeof widthValue === 'number' ? widthValue : parseInt(String(widthValue), 10);
        if (!isNaN(width) && width > 0) {
          sizing[fieldId] = width;
        }
      }
    });

    // Add custom field widths
    customFields.forEach(field => {
      if (field.id === undefined) return;
      const widthKey = `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${field.id}`;
      const widthValue = settingsObj[widthKey];
      if (widthValue) {
        const width = typeof widthValue === 'number' ? widthValue : parseInt(String(widthValue), 10);
        if (!isNaN(width) && width > 0) {
          sizing[`customField_${field.id}`] = width;
        }
      }
    });

    return sizing;
  }, [settings, customFields, appliedCustomView]);

  // Get built-in field display types and configuration
  const visibleBuiltInFieldColumns = useMemo(() => {
    const builtInFields: Array<{ fieldId: string; displayType: 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'; columnWidth?: number }> = [];

    // Use custom view settings if available
    if (appliedCustomView) {
      const columnDisplayTypes = appliedCustomView.column_display_types || {};
      const columnSizing = appliedCustomView.column_sizing || {};
      const columnVisibility = appliedCustomView.column_visibility || {};

      // Check all built-in fields including tags
      ['title', 'created', 'added', 'correspondent', 'asn', 'page_count', 'fileSize', 'category', 'owner', 'tags'].forEach(fieldId => {
        const isEnabled = columnVisibility[fieldId] !== false;
        if (isEnabled && enabledBuiltInFields.has(fieldId)) {
          // Get display type from custom view, or use default based on field type
          const displayType = columnDisplayTypes[fieldId] || getDefaultBuiltInFieldDisplayType(fieldId);
          const columnWidth = columnSizing[fieldId];

          builtInFields.push({
            fieldId,
            displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
            columnWidth: columnWidth ? (typeof columnWidth === 'number' ? columnWidth : parseInt(String(columnWidth), 10)) : undefined,
          });
        }
      });

      return builtInFields;
    }

    // Fall back to global settings
    if (!settings?.settings) {
      // Default: return enabled fields with default display types
      return Array.from(enabledBuiltInFields).map(fieldId => ({
        fieldId,
        displayType: getDefaultBuiltInFieldDisplayType(fieldId) as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
        columnWidth: builtInFieldWidths.get(fieldId),
      }));
    }

    const settingsObj = settings.settings as Record<string, any>;

    Array.from(enabledBuiltInFields).forEach(fieldId => {
      const displayTypeKey = `general-settings:documents:built-in-field:display-type:${fieldId}`;
      const displayType = settingsObj[displayTypeKey] || getDefaultBuiltInFieldDisplayType(fieldId);
      const columnWidth = builtInFieldWidths.get(fieldId);

      builtInFields.push({
        fieldId,
        displayType: displayType as 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier',
        columnWidth,
      });
    });

    return builtInFields;
  }, [settings, appliedCustomView, enabledBuiltInFields, builtInFieldWidths]);

  return {
    visibleCustomFieldColumns,
    visibleBuiltInFieldColumns,
    columnOrderFromSettings,
    columnVisibilityFromSettings,
    enabledBuiltInFields,
    builtInFieldWidths,
    columnSizingFromSettings,
  };
}

// Helper function to get default display type for built-in fields
function getDefaultBuiltInFieldDisplayType(fieldId: string): string {
  switch (fieldId) {
    case 'created':
    case 'added':
      return 'date';
    case 'tags':
      return 'list';
    case 'asn':
    case 'page_count':
      return 'identifier';
    default:
      return 'text';
  }
}

