"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import { BUILT_IN_FIELDS, BuiltInField } from "./builtInFields";

// Union type for fields that can be displayed in the table (both built-in and custom)
type DisplayableField = (CustomField & { isBuiltIn: false }) | (BuiltInField & { isBuiltIn: true });

interface CustomFieldsTableProps {
  customFields: CustomField[];
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
  tabsList: string[];
  newTabInput: Record<number, string>;
  setNewTabInput: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleAddTab: (fieldId: number, tabName: string) => void;
  customViewId?: number | string | null; // ID of the custom view being edited (number for saved, string for drafts)
}

export function CustomFieldsTable({
  customFields,
  getSetting,
  updateSetting,
  tabsList,
  newTabInput,
  setNewTabInput,
  handleAddTab,
}: CustomFieldsTableProps) {
  const [draggedFieldId, setDraggedFieldId] = useState<string | number | null>(null);

  // Get display order from settings - can contain both string IDs (built-in) and number IDs (custom)
  // Memoize based on stringified values to prevent re-renders when arrays are recreated with same content
  const columnOrderValue = getSetting(SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER, [] as (string | number)[]);
  const customFieldOrderValue = getSetting(SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER, [] as number[]);
  
  // Use stringified values as keys for memoization to ensure stability
  const columnOrderStr = JSON.stringify(columnOrderValue);
  const customFieldOrderStr = JSON.stringify(customFieldOrderValue);
  
  const columnOrder = useMemo(() => {
    try {
      return JSON.parse(columnOrderStr) as (string | number)[];
    } catch {
      return [] as (string | number)[];
    }
  }, [columnOrderStr]);
  
  const customFieldOrder = useMemo(() => {
    try {
      return JSON.parse(customFieldOrderStr) as number[];
    } catch {
      return [] as number[];
    }
  }, [customFieldOrderStr]);

  // Combine built-in fields with custom fields, sorted by display order
  const allFields = useMemo(() => {
    // If columnOrder exists, use it; otherwise fall back to default order
    const order = columnOrder.length > 0 ? columnOrder : [
      ...BUILT_IN_FIELDS.map(bf => bf.id),
      ...customFieldOrder,
    ];

    // Create a map of all fields
    const builtInMap = new Map<string, BuiltInField & { isBuiltIn: true }>(
      BUILT_IN_FIELDS.map(bf => [bf.id, { ...bf, isBuiltIn: true as const }])
    );
    const customFieldMap = new Map<number, CustomField & { isBuiltIn: false }>(
      customFields.map(f => [f.id!, { ...f, isBuiltIn: false as const }])
    );

    // Sort fields by order
    const orderedFields: DisplayableField[] = [];
    const processedIds = new Set<string | number>();

    // Add fields in order
    order.forEach((id: string | number) => {
      const builtInField = builtInMap.get(id as string);
      const customField = customFieldMap.get(id as number);
      if (builtInField) {
        orderedFields.push(builtInField);
        processedIds.add(id);
      } else if (customField) {
        orderedFields.push(customField);
        processedIds.add(id);
      }
    });

    // Add any remaining built-in fields
    BUILT_IN_FIELDS.forEach(bf => {
      if (!processedIds.has(bf.id)) {
        orderedFields.push({ ...bf, isBuiltIn: true as const });
        processedIds.add(bf.id);
      }
    });

    // Add any remaining custom fields
    customFields.forEach(field => {
      if (field.id !== undefined && !processedIds.has(field.id)) {
        orderedFields.push({ ...field, isBuiltIn: false as const });
        processedIds.add(field.id);
      }
    });

    return orderedFields;
  }, [customFields, columnOrder, customFieldOrder]);

  const handleDragStart = (e: React.DragEvent, fieldId: string | number) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(fieldId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetFieldId: string | number) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      return;
    }

    const currentOrder = columnOrder.length > 0 ? [...columnOrder] : [
      ...BUILT_IN_FIELDS.map(bf => bf.id),
      ...customFieldOrder,
    ];

    const draggedIndex = currentOrder.indexOf(draggedFieldId);
    const targetIndex = currentOrder.indexOf(targetFieldId);

    if (draggedIndex === -1) {
      // Field not in order yet, add it at target position
      currentOrder.splice(targetIndex >= 0 ? targetIndex : currentOrder.length, 0, draggedFieldId);
    } else if (targetIndex === -1) {
      // Target not in order, move dragged to end
      currentOrder.splice(draggedIndex, 1);
      currentOrder.push(draggedFieldId);
    } else {
      // Both in order, reorder
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedFieldId);
    }

    // Ensure all visible fields are in the order
    const visibleBuiltInFields = BUILT_IN_FIELDS
      .filter(bf => {
        const key = `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX}${bf.id}`;
        return getSetting(key, true); // Default to true for built-in fields
      })
      .map(bf => bf.id);
    const visibleCustomFields = customFields
      .filter(f => f.id !== undefined && getSetting(`${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${f.id}`, false))
      .map(f => f.id!);

    // Add any missing visible fields to the end
    [...visibleBuiltInFields, ...visibleCustomFields].forEach(fieldId => {
      if (!currentOrder.includes(fieldId)) {
        currentOrder.push(fieldId);
      }
    });

    updateSetting(SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER, currentOrder);
    setDraggedFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
  };

  return (
    <div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0 relative">
      <Table
        header={
          <Table.HeaderRow>
            <Table.HeaderCell style={{ width: '40px' }}></Table.HeaderCell>
            <Table.HeaderCell>Field Name</Table.HeaderCell>
            <Table.HeaderCell>Data Type</Table.HeaderCell>
            <Table.HeaderCell>Show as Filter</Table.HeaderCell>
            <Table.HeaderCell>Filter Type</Table.HeaderCell>
            <Table.HeaderCell>Show in Table</Table.HeaderCell>
            <Table.HeaderCell>Table Display Type</Table.HeaderCell>
            <Table.HeaderCell>Column Width</Table.HeaderCell>
            <Table.HeaderCell>Show in Edit Mode</Table.HeaderCell>
            <Table.HeaderCell>Edit Mode Entry Type</Table.HeaderCell>
            <Table.HeaderCell>Tab</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {allFields.map((field) => {
          const isBuiltIn = 'isBuiltIn' in field && field.isBuiltIn;
          const fieldId = isBuiltIn ? (field as BuiltInField).id : (field as CustomField).id;
          
          if (fieldId === undefined && !isBuiltIn) return null;

          // For built-in fields, use the field ID string; for custom fields, use the numeric ID
          const filterKey = isBuiltIn ? null : `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${fieldId}`;
          const filterTypeKey = isBuiltIn ? null : `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX}${fieldId}`;
          const tableColumnKey = isBuiltIn ? `${SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX}${fieldId}` : `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${fieldId}`;
          const tableDisplayTypeKey = isBuiltIn ? null : `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${fieldId}`;
          const columnWidthKey = isBuiltIn ? `general-settings:documents:built-in-field:column-width:${fieldId}` : `${SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX}${fieldId}`;
          const editModeKey = isBuiltIn ? null : `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX}${fieldId}`;
          const editModeEntryTypeKey = isBuiltIn ? null : `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX}${fieldId}`;
          const tabKey = isBuiltIn ? null : `${SETTINGS_KEYS.CUSTOM_FIELD_TAB_PREFIX}${fieldId}`;
          
          const dataTypeLabel = DATA_TYPE_LABELS.find(
            (dt) => dt.id === field.data_type
          )?.name || field.data_type;
          
          // Built-in fields can be toggled but default to enabled; can't be filtered or edited
          const isFilterEnabled = isBuiltIn ? false : getSetting(filterKey!, false);
          const isTableColumnEnabled = isBuiltIn ? getSetting(tableColumnKey, true) : getSetting(tableColumnKey!, false);
          const isEditModeEnabled = isBuiltIn ? false : getSetting(editModeKey!, false);
          
          const filterTypeOptions = getFilterTypeOptions(field.data_type);
          const tableDisplayTypeOptions = getTableDisplayTypeOptions();
          const editModeEntryTypeOptions = getEditModeEntryTypeOptions();
          const currentFilterType = isBuiltIn ? null : getSetting(filterTypeKey!, getDefaultFilterType(field.data_type));
          const currentTableDisplayType = isBuiltIn ? getDefaultTableDisplayType(field.data_type) : getSetting(tableDisplayTypeKey!, getDefaultTableDisplayType(field.data_type));
          const currentEditModeEntryType = isBuiltIn ? null : getSetting(editModeEntryTypeKey!, getDefaultEditModeEntryType(field.data_type));
          const currentTab = isBuiltIn ? 'Default' : getSetting(tabKey!, 'Default');

          // Get column width - handle both string and number types from settings
          const columnWidthRaw = getSetting(columnWidthKey, '');
          let columnWidth = '';
          if (columnWidthRaw !== '' && columnWidthRaw !== null && columnWidthRaw !== undefined) {
            columnWidth = typeof columnWidthRaw === 'number' ? String(columnWidthRaw) : String(columnWidthRaw);
          }
          const isDragging = !isBuiltIn && draggedFieldId === fieldId;

          const fieldIdForDrag: string | number = isBuiltIn ? (field as BuiltInField).id : (fieldId as number);
          const isDraggingThis = draggedFieldId === fieldIdForDrag;

          return (
            <Table.Row 
              key={isBuiltIn ? `builtin-${fieldIdForDrag}` : fieldId}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, fieldIdForDrag)}
              className={isDraggingThis ? "opacity-50" : ""}
            >
              <Table.Cell>
                <div 
                  className="flex items-center justify-center cursor-move"
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, fieldIdForDrag)}
                  onDragEnd={handleDragEnd}
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
                <div className="flex items-center justify-center">
                  {isBuiltIn ? (
                    <Switch
                      checked={false}
                      disabled={true}
                    />
                  ) : (
                    <Switch
                      checked={isFilterEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting(filterKey!, checked)
                      }
                    />
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-center">
                  {isBuiltIn ? (
                    <span className="text-body font-body text-subtext-color">—</span>
                  ) : isFilterEnabled ? (
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
                                  // Use a longer timeout to ensure dropdown closes before state update
                                  setTimeout(() => updateSetting(filterTypeKey!, option.value), 150);
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
                <div className="flex items-center justify-center">
                  <Switch
                    checked={isTableColumnEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting(tableColumnKey, checked)
                    }
                  />
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-center">
                  {isBuiltIn || isTableColumnEnabled ? (
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <Button
                          variant="neutral-secondary"
                          size="small"
                          iconRight={<FeatherChevronDown />}
                          className="w-40 justify-between"
                          disabled={isBuiltIn}
                        >
                          {tableDisplayTypeOptions.find(opt => opt.value === currentTableDisplayType)?.label || "Select type"}
                        </Button>
                      </SubframeCore.DropdownMenu.Trigger>
                      {!isBuiltIn && (
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
                                    // Use a longer timeout to ensure dropdown closes before state update
                                    setTimeout(() => updateSetting(tableDisplayTypeKey!, option.value), 150);
                                  }}
                                >
                                  {option.label}
                                </DropdownMenu.DropdownItem>
                              ))}
                            </DropdownMenu>
                          </SubframeCore.DropdownMenu.Content>
                        </SubframeCore.DropdownMenu.Portal>
                      )}
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
                          const value = e.target.value;
                          // Save immediately as string to preserve user input
                          updateSetting(columnWidthKey, value === '' ? undefined : value);
                        }}
                        onBlur={(e) => {
                          const value = e.target.value.trim();
                          // On blur, validate and normalize the value
                          if (value === '') {
                            updateSetting(columnWidthKey, undefined);
                          } else {
                            const numValue = parseInt(value, 10);
                            if (!isNaN(numValue)) {
                              // Clamp to valid range
                              const clampedValue = Math.max(50, Math.min(1000, numValue));
                              updateSetting(columnWidthKey, String(clampedValue));
                              // Update the input value if it was clamped
                              if (clampedValue !== numValue) {
                                e.target.value = String(clampedValue);
                              }
                            } else {
                              // Invalid value, revert to saved value
                              const savedValue = getSetting(columnWidthKey, '');
                              const displayValue = savedValue === '' || savedValue === null || savedValue === undefined 
                                ? '' 
                                : (typeof savedValue === 'number' ? String(savedValue) : String(savedValue));
                              e.target.value = displayValue;
                            }
                          }
                        }}
                        min={50}
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
                  {isBuiltIn ? (
                    <span className="text-body font-body text-subtext-color">—</span>
                  ) : (
                    <Switch
                      checked={isEditModeEnabled}
                      onCheckedChange={(checked) =>
                        updateSetting(editModeKey!, checked)
                      }
                    />
                  )}
                </div>
              </Table.Cell>
              <Table.Cell>
                <div className="flex items-center justify-center">
                  {isBuiltIn ? (
                    <span className="text-body font-body text-subtext-color">—</span>
                  ) : isEditModeEnabled ? (
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
                                  // Use a longer timeout to ensure dropdown closes before state update
                                  setTimeout(() => updateSetting(editModeEntryTypeKey!, option.value), 150);
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
              <Table.Cell>
                <div className="flex items-center justify-center gap-2">
                  {isEditModeEnabled ? (
                    <div className="flex items-center gap-2">
                      <SubframeCore.DropdownMenu.Root>
                        <SubframeCore.DropdownMenu.Trigger asChild={true}>
                          <Button
                            variant="neutral-secondary"
                            size="small"
                            iconRight={<FeatherChevronDown />}
                            className="w-32 justify-between"
                          >
                            {currentTab}
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
                              {tabsList.map((tab) => (
                                <DropdownMenu.DropdownItem
                                  key={tab}
                                  icon={null}
                                  onClick={() => {
                                    // Use a longer timeout to ensure dropdown closes before state update
                                    setTimeout(() => updateSetting(tabKey!, tab), 150);
                                  }}
                                >
                                  {tab}
                                </DropdownMenu.DropdownItem>
                              ))}
                              <DropdownMenu.DropdownDivider />
                              <div className="px-3 py-2">
                                <TextField>
                                  <TextField.Input
                                    placeholder="Enter new tab name"
                                    value={newTabInput[field.id! as number] || ''}
                                    onChange={(e) => {
                                      const fieldId = field.id! as number;
                                      setNewTabInput((prev) => ({
                                        ...prev,
                                        [fieldId]: e.target.value,
                                      }));
                                    }}
                                    onKeyDown={(e) => {
                                      const fieldId = field.id as number;
                                      if (fieldId !== undefined && e.key === 'Enter' && newTabInput[fieldId]) {
                                        handleAddTab(fieldId, newTabInput[fieldId]);
                                        e.preventDefault();
                                      }
                                    }}
                                  />
                                </TextField>
                                <Button
                                  variant="brand-primary"
                                  size="small"
                                  className="mt-2 w-full"
                                  onClick={() => {
                                    const fieldId = field.id as number;
                                    if (fieldId !== undefined && newTabInput[fieldId]) {
                                      handleAddTab(fieldId, newTabInput[fieldId]);
                                    }
                                  }}
                                >
                                  Add Tab
                                </Button>
                              </div>
                            </DropdownMenu>
                          </SubframeCore.DropdownMenu.Content>
                        </SubframeCore.DropdownMenu.Portal>
                      </SubframeCore.DropdownMenu.Root>
                    </div>
                  ) : (
                    <Button
                      variant="neutral-secondary"
                      size="small"
                      disabled={true}
                      iconRight={<FeatherChevronDown />}
                      className="w-32 justify-between"
                    >
                      {currentTab}
                    </Button>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table>
    </div>
  );
}

