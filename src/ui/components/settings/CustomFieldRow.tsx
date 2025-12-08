"use client";

import React, { useState, useEffect } from "react";
import { Table } from "../Table";
import { Switch } from "../Switch";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { DropdownMenu } from "../DropdownMenu";
import { FeatherChevronDown, FeatherGripVertical, FeatherStar } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { CustomField, DATA_TYPE_LABELS } from "@/app/data/custom-field";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import {
  getFilterTypeOptions,
  getDefaultFilterType,
  getTableDisplayTypeOptions,
  getDefaultTableDisplayType,
  getEditModeEntryTypeOptions,
  getDefaultEditModeEntryType,
} from "./customFieldHelpers";
import { BuiltInField } from "./builtInFields";

type DisplayableField = (CustomField & { isBuiltIn: false }) | (BuiltInField & { isBuiltIn: true });

interface CustomFieldRowProps {
  field: DisplayableField;
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
  draggedFieldId: string | number | null;
  onDragStart: (e: React.DragEvent, fieldId: string | number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetFieldId: string | number) => void;
  onDragEnd: () => void;
}

export function CustomFieldRow({
  field,
  getSetting,
  updateSetting,
  draggedFieldId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CustomFieldRowProps) {
  const isBuiltIn = 'isBuiltIn' in field && field.isBuiltIn;
  const fieldId = isBuiltIn ? (field as BuiltInField).id : (field as CustomField).id;

  if (fieldId === undefined && !isBuiltIn) return null;

  // For built-in fields, use the consistent BUILT_IN_FIELD_FILTER_PREFIX format
  // For custom fields, use the CUSTOM_FIELD_FILTER_PREFIX with numeric ID
  const filterKey = isBuiltIn
    ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}${fieldId}` : null)
    : `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${fieldId}`;
  const filterTypeKey = isBuiltIn
    ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_TYPE_PREFIX}${fieldId}` : null)
    : `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX}${fieldId}`;
  const tableColumnKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX}${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${fieldId}`;
  const spanBothRowsKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_SPAN_BOTH_ROWS_PREFIX}${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_SPAN_BOTH_ROWS_PREFIX}${fieldId}`;
  const showOnSecondRowKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_SHOW_ON_SECOND_ROW_PREFIX}${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_SHOW_ON_SECOND_ROW_PREFIX}${fieldId}`;
  const tableDisplayTypeKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${fieldId}`;
  const columnWidthKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `general-settings:documents:built-in-field:column-width:${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${fieldId}`;
  const editModeKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_PREFIX}${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX}${fieldId}`;
  const editModeEntryTypeKey = isBuiltIn ? (fieldId && typeof fieldId === 'string' ? `${SETTINGS_KEYS.BUILT_IN_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX}${fieldId}` : '') : `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX}${fieldId}`;

  const dataTypeLabel = DATA_TYPE_LABELS.find(
    (dt) => dt.id === field.data_type
  )?.name || field.data_type;

  // Built-in fields can be toggled; get filter enabled state
  const isFilterEnabled = filterKey ? getSetting(filterKey, false) : false;

  // Get default filter type for built-in fields based on their data type
  const getBuiltInDefaultFilterType = (fieldId: string): string => {
    const mapping: Record<string, string> = {
      'created': 'date-range',
      'category': 'multi-select',
      'correspondent': 'multi-select',
      'asn': 'numerical',
      'owner': 'multi-select',
    };
    return mapping[fieldId] || 'populated';
  };

  // Use local state for toggles to ensure immediate UI feedback
  const [localTableColumnEnabled, setLocalTableColumnEnabled] = useState(() =>
    isBuiltIn ? getSetting(tableColumnKey, true) : getSetting(tableColumnKey!, false)
  );
  const [localFilterEnabled, setLocalFilterEnabled] = useState(() =>
    filterKey ? getSetting(filterKey, false) : false
  );
  const [localSpanBothRows, setLocalSpanBothRows] = useState(() =>
    spanBothRowsKey ? getSetting(spanBothRowsKey, false) : false
  );
  const [localShowOnSecondRow, setLocalShowOnSecondRow] = useState(() =>
    showOnSecondRowKey ? getSetting(showOnSecondRowKey, false) : false
  );
  const [localEditModeEnabled, setLocalEditModeEnabled] = useState(() =>
    isBuiltIn ? false : getSetting(editModeKey!, false)
  );

  // Sync local state with settings when they change externally
  // Use the actual setting value as dependency to avoid unnecessary re-runs
  const currentTableColumnValue = isBuiltIn ? getSetting(tableColumnKey, true) : getSetting(tableColumnKey!, false);
  const currentFilterValue = filterKey ? getSetting(filterKey, false) : false;
  const currentSpanBothRowsValue = spanBothRowsKey ? getSetting(spanBothRowsKey, false) : false;
  const currentShowOnSecondRowValue = showOnSecondRowKey ? getSetting(showOnSecondRowKey, false) : false;
  const currentEditModeValue = editModeKey ? getSetting(editModeKey, false) : false;

  useEffect(() => {
    setLocalTableColumnEnabled(currentTableColumnValue);
  }, [currentTableColumnValue]);

  useEffect(() => {
    if (filterKey) {
      setLocalFilterEnabled(currentFilterValue);
    }
  }, [filterKey, currentFilterValue]);

  useEffect(() => {
    if (spanBothRowsKey) {
      setLocalSpanBothRows(currentSpanBothRowsValue);
    }
  }, [spanBothRowsKey, currentSpanBothRowsValue]);

  useEffect(() => {
    if (showOnSecondRowKey) {
      setLocalShowOnSecondRow(currentShowOnSecondRowValue);
    }
  }, [showOnSecondRowKey, currentShowOnSecondRowValue]);

  useEffect(() => {
    if (editModeKey) {
      setLocalEditModeEnabled(currentEditModeValue);
    }
  }, [editModeKey, currentEditModeValue]);

  const isTableColumnEnabled = localTableColumnEnabled;
  const isEditModeEnabled = localEditModeEnabled;

  const filterTypeOptions = getFilterTypeOptions(field.data_type);
  const tableDisplayTypeOptions = getTableDisplayTypeOptions();
  const editModeEntryTypeOptions = getEditModeEntryTypeOptions();
  const currentFilterType = filterTypeKey
    ? getSetting(filterTypeKey, isBuiltIn && fieldId && typeof fieldId === 'string' ? getBuiltInDefaultFilterType(fieldId) : getDefaultFilterType(field.data_type))
    : null;
  const currentTableDisplayType = tableDisplayTypeKey ? getSetting(tableDisplayTypeKey, getDefaultTableDisplayType(field.data_type)) : getDefaultTableDisplayType(field.data_type);
  const currentEditModeEntryType = editModeEntryTypeKey ? getSetting(editModeEntryTypeKey, getDefaultEditModeEntryType(field.data_type)) : null;

  // Get column width - handle both string and number types from settings
  const columnWidthRaw = getSetting(columnWidthKey, '');
  const initialColumnWidth = columnWidthRaw !== '' && columnWidthRaw !== null && columnWidthRaw !== undefined
    ? (typeof columnWidthRaw === 'number' ? String(columnWidthRaw) : String(columnWidthRaw))
    : '';

  // Use local state for column width input to prevent remounting on every keystroke
  const [localColumnWidth, setLocalColumnWidth] = useState(initialColumnWidth);

  // Sync local state when external setting changes
  useEffect(() => {
    setLocalColumnWidth(initialColumnWidth);
  }, [initialColumnWidth]);

  const columnWidth = localColumnWidth;

  const fieldIdForDrag: string | number = isBuiltIn ? (field as BuiltInField).id : (fieldId as number);
  const isDraggingThis = draggedFieldId === fieldIdForDrag;

  return (
    <Table.Row
      key={isBuiltIn ? `builtin-${fieldIdForDrag}` : fieldId}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, fieldIdForDrag)}
      className={isDraggingThis ? "opacity-50" : ""}
    >
      <Table.Cell>
        <div
          className="flex items-center justify-center cursor-move"
          draggable={true}
          onDragStart={(e) => onDragStart(e, fieldIdForDrag)}
          onDragEnd={onDragEnd}
        >
          <FeatherGripVertical className="w-4 h-4 text-subtext-color hover:text-default-font" />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center gap-2">
          {isBuiltIn && (
            <FeatherStar className="w-4 h-4 text-brand-600 flex-shrink-0" title="Built-in field" />
          )}
          <span className="text-body-bold font-body-bold text-default-font">
            {field.name}
          </span>
        </div>
      </Table.Cell>
      <Table.Cell>
        <span className="text-body font-body text-subtext-color">
          {dataTypeLabel}
        </span>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {filterKey ? (
            <Switch
              checked={localFilterEnabled}
              onCheckedChange={(checked) => {
                setLocalFilterEnabled(checked);
                updateSetting(filterKey, checked);
              }}
            />
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center">
          {filterKey && localFilterEnabled ? (
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  iconRight={<FeatherChevronDown />}
                  className="w-40 justify-between"
                >
                  {filterTypeOptions.find(opt => opt.value === currentFilterType)?.label || "Select type"}
                </Button>
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                  style={{ zIndex: 10001 }}
                >
                  <DropdownMenu className="z-[10001]">
                    {filterTypeOptions.map((option) => (
                      <DropdownMenu.DropdownItem
                        key={option.value}
                        icon={null}
                        onClick={() => {
                          setTimeout(() => {
                            if (filterTypeKey) {
                              updateSetting(filterTypeKey, option.value);
                            }
                          }, 200);
                        }}
                      >
                        {option.label}
                      </DropdownMenu.DropdownItem>
                    ))}
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          ) : (
            <Button
              variant="neutral-secondary"
              size="small"
              disabled={true}
              iconRight={<FeatherChevronDown />}
              className="w-40 justify-between"
            >
              {filterTypeOptions.find(opt => opt.value === currentFilterType)?.label || "Select type"}
            </Button>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isTableColumnEnabled}
            onCheckedChange={(checked) => {
              // Update local state immediately for instant UI feedback
              setLocalTableColumnEnabled(checked);
              // Then update the view setting
              updateSetting(tableColumnKey, checked);
            }}
          />
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {spanBothRowsKey && isTableColumnEnabled ? (
            <Switch
              checked={localSpanBothRows}
              onCheckedChange={(checked) => {
                // Update local state immediately for instant UI feedback
                setLocalSpanBothRows(checked);
                // Then update the view setting
                if (spanBothRowsKey) {
                  updateSetting(spanBothRowsKey, checked);
                }
              }}
            />
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {showOnSecondRowKey && isTableColumnEnabled ? (
            <Switch
              checked={localShowOnSecondRow}
              onCheckedChange={(checked) => {
                // Update local state immediately for instant UI feedback
                setLocalShowOnSecondRow(checked);
                // Then update the view setting
                if (showOnSecondRowKey) {
                  updateSetting(showOnSecondRowKey, checked);
                }
              }}
            />
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center">
          {isTableColumnEnabled && tableDisplayTypeKey ? (
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  iconRight={<FeatherChevronDown />}
                  className="w-40 justify-between"
                >
                  {tableDisplayTypeOptions.find(opt => opt.value === currentTableDisplayType)?.label || "Select type"}
                </Button>
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                  style={{ zIndex: 10001 }}
                >
                  <DropdownMenu className="z-[10001]">
                    {tableDisplayTypeOptions.map((option) => (
                      <DropdownMenu.DropdownItem
                        key={option.value}
                        icon={null}
                        onClick={() => {
                          setTimeout(() => {
                            if (tableDisplayTypeKey) {
                              updateSetting(tableDisplayTypeKey, option.value);
                            }
                          }, 200);
                        }}
                      >
                        {option.label}
                      </DropdownMenu.DropdownItem>
                    ))}
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          ) : (
            <Button
              variant="neutral-secondary"
              size="small"
              disabled={true}
              iconRight={<FeatherChevronDown />}
              className="w-40 justify-between"
            >
              {tableDisplayTypeOptions.find(opt => opt.value === currentTableDisplayType)?.label || "Select type"}
            </Button>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center">
          {isBuiltIn || isTableColumnEnabled ? (
            <TextField className="w-24">
              <TextField.Input
                type="number"
                placeholder="Auto"
                value={columnWidth}
                onChange={(e) => {
                  // Only update local state during typing - don't trigger updateSetting
                  // This prevents the table from remounting and losing focus
                  const value = e.target.value;
                  setLocalColumnWidth(value);
                }}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value === '') {
                    // Empty value - clear the setting
                    setLocalColumnWidth('');
                    updateSetting(columnWidthKey, undefined);
                  } else {
                    const numValue = parseInt(value, 10);
                    if (!isNaN(numValue) && numValue > 0) {
                      // Valid positive number - clamp to max only
                      const clampedValue = Math.min(1000, numValue);
                      setLocalColumnWidth(String(clampedValue));
                      updateSetting(columnWidthKey, String(clampedValue));
                    } else if (numValue === 0 || numValue < 0) {
                      // 0 or negative is treated as empty/Auto
                      setLocalColumnWidth('');
                      updateSetting(columnWidthKey, undefined);
                    } else {
                      // Invalid input - revert to saved value
                      const savedValue = getSetting(columnWidthKey, '');
                      const displayValue = savedValue === '' || savedValue === null || savedValue === undefined
                        ? ''
                        : (typeof savedValue === 'number' ? String(savedValue) : String(savedValue));
                      setLocalColumnWidth(displayValue);
                    }
                  }
                }}
                max={1000}
              />
            </TextField>
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center">
          {editModeKey ? (
            <Switch
              checked={isEditModeEnabled}
              onCheckedChange={(checked) => {
                // Update local state immediately for instant UI feedback
                setLocalEditModeEnabled(checked);
                // Then update the view setting
                updateSetting(editModeKey, checked);
              }}
            />
          ) : (
            <span className="text-body font-body text-subtext-color">—</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell>
        <div className="flex items-center justify-center">
          {editModeEntryTypeKey && isEditModeEnabled ? (
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  iconRight={<FeatherChevronDown />}
                  className="w-40 justify-between"
                >
                  {editModeEntryTypeOptions.find(opt => opt.value === currentEditModeEntryType)?.label || "Select type"}
                </Button>
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                  style={{ zIndex: 10001 }}
                >
                  <DropdownMenu className="z-[10001]">
                    {editModeEntryTypeOptions.map((option) => (
                      <DropdownMenu.DropdownItem
                        key={option.value}
                        icon={null}
                        onClick={() => {
                          setTimeout(() => {
                            if (editModeEntryTypeKey) {
                              updateSetting(editModeEntryTypeKey, option.value);
                            }
                          }, 200);
                        }}
                      >
                        {option.label}
                      </DropdownMenu.DropdownItem>
                    ))}
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>
          ) : (
            <Button
              variant="neutral-secondary"
              size="small"
              disabled={true}
              iconRight={<FeatherChevronDown />}
              className="w-40 justify-between"
            >
              {editModeEntryTypeOptions.find(opt => opt.value === currentEditModeEntryType)?.label || "Select type"}
            </Button>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

