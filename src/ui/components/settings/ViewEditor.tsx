"use client";

import React, { useMemo, useCallback } from "react";
import { CustomFieldsTable } from "./CustomFieldsTable";
import { useDocumentsContext } from "../documents/DocumentsContext";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { CustomField, CustomFieldDataType } from "@/app/data/custom-field";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { Switch } from "../Switch";
import { BUILT_IN_FIELDS, BuiltInField } from "./builtInFields";
import {
    getDefaultFilterType,
    getDefaultTableDisplayType,
    getDefaultEditModeEntryType
} from "./customFieldHelpers";

interface ViewEditorProps {
    customFields: CustomField[];
    customFieldsLoading: boolean;
    onClose: () => void;
}

export function ViewEditor({ customFields, customFieldsLoading, onClose }: ViewEditorProps) {
    const {
        tableConfig,
        activeView,
        activeViewId,
        viewMetadata,
        updateColumnOrder,
        updateColumnVisibility,
        updateColumnSizing,
        updateColumnSpanning,
        updateColumnDisplayTypes,
        updateFilterVisibility,
        updateFilterTypes,
        updateEditModeSettings,
        updateViewName,
        updateViewDescription,
        updateViewIsGlobal,
        saveCurrentView,
        discardChanges,
        hasUnsavedChanges,
        isSaving
    } = useDocumentsContext();

    // Legacy Adapter: Map generic string keys to TableConfig
    const getSetting = useMemo(() => (key: string, defaultValue: any = null) => {

        // Column Order
        if (key === SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER) {
            return tableConfig.columnOrder || defaultValue;
        }

        // Built-in Field Visibility
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX, '');
            return tableConfig.columnVisibility?.[fieldId] ?? defaultValue;
        }

        // Custom Field Visibility
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX)) {
            const fieldId = parseInt(key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX, ''), 10);
            return tableConfig.columnVisibility?.[`customField_${fieldId}`] ?? defaultValue;
        }

        // Column Widths (Built-in)
        if (key.startsWith('general-settings:documents:built-in-field:column-width:')) {
            const fieldId = key.replace('general-settings:documents:built-in-field:column-width:', '');
            return tableConfig.columnSizing?.[fieldId] || defaultValue;
        }

        // Column Widths (Custom)
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX, '');
            return tableConfig.columnSizing?.[`customField_${fieldId}`] || defaultValue;
        }

        // Spanning
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_SPAN_BOTH_ROWS_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_SPAN_BOTH_ROWS_PREFIX, '');
            return tableConfig.columnSpanning?.[`customField_${fieldId}`] || defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_SPAN_BOTH_ROWS_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_SPAN_BOTH_ROWS_PREFIX, '');
            return tableConfig.columnSpanning?.[fieldId] || defaultValue;
        }

        // Second Row
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_SHOW_ON_SECOND_ROW_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_SHOW_ON_SECOND_ROW_PREFIX, '');
            return tableConfig.columnSpanning?.[`customField_${fieldId}_secondRow`] || defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_SHOW_ON_SECOND_ROW_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_SHOW_ON_SECOND_ROW_PREFIX, '');
            return tableConfig.columnSpanning?.[`${fieldId}_secondRow`] || defaultValue;
        }

        // Filter Visibility
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX, '');
            return tableConfig.filterVisibility?.[`customField_${fieldId}`] ?? defaultValue;
        }

        // Built-in field filters (mapped)
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX, '');
            return tableConfig.filterVisibility?.[fieldId] ?? defaultValue;
        }

        // Display Types
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
            return tableConfig.columnDisplayTypes?.[`customField_${fieldId}`] ||
                tableConfig.columnDisplayTypes?.[fieldId] ||
                defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
            return tableConfig.columnDisplayTypes?.[fieldId] || defaultValue;
        }

        // Filter Types
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX, '');
            return tableConfig.filterTypes?.[`customField_${fieldId}`] || defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX, '');
            return tableConfig.filterTypes?.[fieldId] || defaultValue;
        }

        // Edit Mode
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX, '');
            return tableConfig.editModeSettings?.[`customField_${fieldId}`]?.enabled || defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_PREFIX, '');
            return tableConfig.editModeSettings?.[fieldId]?.enabled || defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX, '');
            return tableConfig.editModeSettings?.[`customField_${fieldId}`]?.entry_type || defaultValue;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX, '');
            return tableConfig.editModeSettings?.[fieldId]?.entry_type || defaultValue;
        }

        // For everything else, return default (Global fallback is handled elsewhere or not critical for visual editor)
        return defaultValue;
    }, [tableConfig]);

    const updateSetting = useMemo(() => (key: string, value: any) => {

        // Column Order
        if (key === SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER) {
            // Ensure values are strings
            const order = (value as (string | number)[]).map(v =>
                typeof v === 'number' ? `customField_${v}` : String(v)
            );
            updateColumnOrder(order);
            return;
        }

        // Built-in Field Visibility
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX, '');
            updateColumnVisibility({ ...tableConfig.columnVisibility, [fieldId]: value });
            return;
        }

        // Custom Field Visibility
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX)) {
            const fieldId = parseInt(key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX, ''), 10);
            updateColumnVisibility({ ...tableConfig.columnVisibility, [`customField_${fieldId}`]: value });
            return;
        }

        // Sizing
        if (key.startsWith('general-settings:documents:built-in-field:column-width:')) {
            const fieldId = key.replace('general-settings:documents:built-in-field:column-width:', '');
            updateColumnSizing({ ...tableConfig.columnSizing, [fieldId]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX, '');
            updateColumnSizing({ ...tableConfig.columnSizing, [`customField_${fieldId}`]: value });
            return;
        }

        // Spanning
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_SPAN_BOTH_ROWS_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_SPAN_BOTH_ROWS_PREFIX, '');
            updateColumnSpanning({ ...tableConfig.columnSpanning, [`customField_${fieldId}`]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_SPAN_BOTH_ROWS_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_SPAN_BOTH_ROWS_PREFIX, '');
            updateColumnSpanning({ ...tableConfig.columnSpanning, [fieldId]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_SHOW_ON_SECOND_ROW_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_SHOW_ON_SECOND_ROW_PREFIX, '');
            updateColumnSpanning({ ...tableConfig.columnSpanning, [`customField_${fieldId}_secondRow`]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_SHOW_ON_SECOND_ROW_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_SHOW_ON_SECOND_ROW_PREFIX, '');
            updateColumnSpanning({ ...tableConfig.columnSpanning, [`${fieldId}_secondRow`]: value });
            return;
        }

        // Filter Visibility
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX, '');
            updateFilterVisibility({ ...tableConfig.filterVisibility, [`customField_${fieldId}`]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX, '');
            updateFilterVisibility({ ...tableConfig.filterVisibility, [fieldId]: value });
            return;
        }

        // Filter Types
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX, '');
            updateFilterTypes({ ...(tableConfig.filterTypes || {}), [`customField_${fieldId}`]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX, '');
            updateFilterTypes({ ...(tableConfig.filterTypes || {}), [fieldId]: value });
            return;
        }

        // Display Types
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
            updateColumnDisplayTypes({ ...tableConfig.columnDisplayTypes, [`customField_${fieldId}`]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
            updateColumnDisplayTypes({ ...tableConfig.columnDisplayTypes, [fieldId]: value });
            return;
        }

        // Filter Types
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX, '');
            updateFilterTypes({ ...(tableConfig.filterTypes || {}), [`customField_${fieldId}`]: value });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX, '');
            updateFilterTypes({ ...(tableConfig.filterTypes || {}), [fieldId]: value });
            return;
        }

        // Edit Mode - Enable/Disable
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX, '');
            const fieldKey = `customField_${fieldId}`;
            const currentSettings = tableConfig.editModeSettings?.[fieldKey] || { enabled: false };
            updateEditModeSettings({
                ...(tableConfig.editModeSettings || {}),
                [fieldKey]: { ...currentSettings, enabled: value }
            });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_PREFIX, '');
            const currentSettings = tableConfig.editModeSettings?.[fieldId] || { enabled: false };
            updateEditModeSettings({
                ...(tableConfig.editModeSettings || {}),
                [fieldId]: { ...currentSettings, enabled: value }
            });
            return;
        }

        // Edit Mode - Entry Type
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX, '');
            const fieldKey = `customField_${fieldId}`;
            const currentSettings = tableConfig.editModeSettings?.[fieldKey] || { enabled: false };
            updateEditModeSettings({
                ...(tableConfig.editModeSettings || {}),
                [fieldKey]: { ...currentSettings, entry_type: value }
            });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX, '');
            const currentSettings = tableConfig.editModeSettings?.[fieldId] || { enabled: false };
            updateEditModeSettings({
                ...(tableConfig.editModeSettings || {}),
                [fieldId]: { ...currentSettings, entry_type: value }
            });
            return;
        }

        // Edit Mode - Entry Type
        if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX, '');
            const fieldKey = `customField_${fieldId}`;
            const currentSettings = tableConfig.editModeSettings?.[fieldKey] || { enabled: false };
            updateEditModeSettings({
                ...(tableConfig.editModeSettings || {}),
                [fieldKey]: { ...currentSettings, entry_type: value }
            });
            return;
        }
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX, '');
            const currentSettings = tableConfig.editModeSettings?.[fieldId] || { enabled: false };
            updateEditModeSettings({
                ...(tableConfig.editModeSettings || {}),
                [fieldId]: { ...currentSettings, entry_type: value }
            });
            return;
        }

        // Display Types
        if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
            const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
            updateColumnDisplayTypes({ ...tableConfig.columnDisplayTypes, [fieldId]: value });
            return;
        }

        // Ignore other keys for now or log warning
        console.warn(`[ViewEditor] Unhandled setting key: ${key}`);

    }, [
        tableConfig,
        updateColumnOrder,
        updateColumnVisibility,
        updateColumnSizing,
        updateColumnSpanning,
        updateFilterVisibility,
        updateColumnDisplayTypes,
        updateFilterTypes,
        updateEditModeSettings
    ]);

    // Build complete config for ALL fields and save
    const handleSaveWithCompleteConfig = useCallback(async () => {
        // Build complete configuration for all fields
        const allFieldIds: { id: string | number; isBuiltIn: boolean; dataType: CustomFieldDataType }[] = [
            ...BUILT_IN_FIELDS.map(bf => ({ id: bf.id, isBuiltIn: true, dataType: bf.data_type })),
            ...customFields.filter(f => f.id !== undefined).map(f => ({ id: f.id!, isBuiltIn: false, dataType: f.data_type }))
        ];

        // Build column_order - use current tableConfig.columnOrder if available, else build from getSetting
        const columnOrder: string[] = tableConfig.columnOrder.length > 0
            ? tableConfig.columnOrder
            : allFieldIds.map(f => f.isBuiltIn ? f.id as string : `customField_${f.id}`);

        // Build complete visibility, sizing, display types, filter, spanning, edit mode for ALL fields
        const columnVisibility: Record<string, boolean> = {};
        const columnSizing: Record<string, number> = {};
        const columnDisplayTypes: Record<string, string> = {};
        const filterVisibility: Record<string, boolean> = {};
        const filterTypes: Record<string, string> = {};
        const columnSpanning: Record<string, boolean> = {};
        const editModeSettings: Record<string, { enabled: boolean; entry_type?: string }> = {};

        allFieldIds.forEach(({ id, isBuiltIn, dataType }) => {
            const fieldKey = isBuiltIn ? id as string : `customField_${id}`;
            const numericId = isBuiltIn ? id : id;

            // Column visibility
            const visibilityKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${id}`;
            const isVisible = getSetting(visibilityKey, isBuiltIn); // Built-in defaults to visible
            columnVisibility[fieldKey] = isVisible;

            // Column sizing (if set)
            const sizingKey = isBuiltIn
                ? `general-settings:documents:built-in-field:column-width:${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${id}`;
            const sizeValue = getSetting(sizingKey, null);
            if (sizeValue !== null && sizeValue !== undefined && sizeValue !== '') {
                const numSize = typeof sizeValue === 'number' ? sizeValue : parseInt(String(sizeValue), 10);
                if (!isNaN(numSize) && numSize > 0) {
                    columnSizing[fieldKey] = numSize;
                }
            }

            // Column display type
            const displayTypeKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${id}`;
            const displayType = getSetting(displayTypeKey, getDefaultTableDisplayType(dataType));
            columnDisplayTypes[fieldKey] = displayType;

            // Filter visibility
            const filterKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${id}`;
            const filterEnabled = getSetting(filterKey, false);
            filterVisibility[fieldKey] = filterEnabled;

            // Filter type
            const filterTypeKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX}${id}`;
            const filterType = getSetting(filterTypeKey, getDefaultFilterType(dataType));
            filterTypes[fieldKey] = filterType;

            // Column spanning
            const spanKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_SPAN_BOTH_ROWS_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_SPAN_BOTH_ROWS_PREFIX}${id}`;
            const spanBothRows = getSetting(spanKey, false);
            columnSpanning[fieldKey] = spanBothRows;

            // Second row
            const secondRowKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_SHOW_ON_SECOND_ROW_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_SHOW_ON_SECOND_ROW_PREFIX}${id}`;
            const showOnSecondRow = getSetting(secondRowKey, false);
            columnSpanning[`${fieldKey}_secondRow`] = showOnSecondRow;

            // Edit mode settings (custom fields only typically, but check for built-in too)
            const editModeKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX}${id}`;
            const editModeEnabled = getSetting(editModeKey, false);
            const editEntryTypeKey = isBuiltIn
                ? `${SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX}${id}`
                : `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX}${id}`;
            const editEntryType = getSetting(editEntryTypeKey, getDefaultEditModeEntryType(dataType));
            editModeSettings[fieldKey] = {
                enabled: editModeEnabled,
                entry_type: editEntryType
            };
        });

        // Pass the complete config directly to saveCurrentView (no need for state updates)
        await saveCurrentView({
            columnOrder,
            columnSizing,
            columnVisibility,
            columnDisplayTypes,
            filterVisibility,
            filterTypes,
            columnSpanning,
            editModeSettings,
            name: viewMetadata.name,
            description: viewMetadata.description,
            is_global: viewMetadata.is_global
        });
    }, [
        customFields,
        tableConfig,
        viewMetadata,
        getSetting,
        saveCurrentView
    ]);

    return (
        <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden p-6">
            {/* Header */}
            <div className="flex flex-col items-start gap-2 mb-2 flex-none">
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-col items-start gap-1">
                        <span className="text-heading-3 font-heading-3 text-default-font">
                            Editing View
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="neutral-secondary"
                            size="small"
                            onClick={discardChanges}
                            disabled={!hasUnsavedChanges || isSaving}
                        >
                            Revert
                        </Button>
                        <Button
                            variant="brand-primary"
                            size="small"
                            onClick={handleSaveWithCompleteConfig}
                            disabled={!hasUnsavedChanges || isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                        <Button
                            variant="neutral-secondary"
                            size="small"
                            onClick={onClose}
                        >
                            Back to List
                        </Button>
                    </div>
                </div>

                {/* Metadata Inputs */}
                <div className="w-full flex flex-col gap-4 pt-4 border-t border-solid border-neutral-border">
                    <div className="grid grid-cols-3 gap-4">
                        <TextField label="View Name">
                            <TextField.Input
                                value={viewMetadata.name}
                                onChange={e => updateViewName(e.target.value)}
                            />
                        </TextField>
                        <TextField label="Description">
                            <TextField.Input
                                value={viewMetadata.description}
                                onChange={e => updateViewDescription(e.target.value)}
                            />
                        </TextField>
                        <div className="flex flex-col gap-1">
                            <label className="text-body-bold font-body-bold text-subtext-color">
                                Visibility
                            </label>
                            <div className="flex items-center gap-2 h-10">
                                <Switch
                                    checked={viewMetadata.is_global}
                                    onCheckedChange={updateViewIsGlobal}
                                />
                                <span className="text-body font-body text-default-font">
                                    {viewMetadata.is_global ? "Global (all users)" : "User only"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Table */}
            <CustomFieldsTable
                customFields={customFields}
                getSetting={getSetting}
                updateSetting={updateSetting}
            />
        </div>
    );
}
