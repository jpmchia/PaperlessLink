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
  tabsList: string[];
  newTabInput: Record<number, string>;
  setNewTabInput: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleAddTab: (fieldId: number, tabName: string) => void;
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
  tabsList,
  newTabInput,
  setNewTabInput,
  handleAddTab,
  draggedFieldId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: CustomFieldRowProps) {
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
  
  // Use local state for toggles to ensure immediate UI feedback
  const [localTableColumnEnabled, setLocalTableColumnEnabled] = useState(() => 
    isBuiltIn ? getSetting(tableColumnKey, true) : getSetting(tableColumnKey!, false)
  );
  const [localEditModeEnabled, setLocalEditModeEnabled] = useState(() => 
    isBuiltIn ? false : getSetting(editModeKey!, false)
  );
  
  // Sync local state with settings when they change externally
  // Use the actual setting value as dependency to avoid unnecessary re-runs
  const currentTableColumnValue = isBuiltIn ? getSetting(tableColumnKey, true) : getSetting(tableColumnKey!, false);
  const currentEditModeValue = isBuiltIn ? false : getSetting(editModeKey!, false);
  
  useEffect(() => {
    setLocalTableColumnEnabled(currentTableColumnValue);
  }, [currentTableColumnValue]);
  
  useEffect(() => {
    if (!isBuiltIn) {
      setLocalEditModeEnabled(currentEditModeValue);
    }
  }, [isBuiltIn, currentEditModeValue]);
  
  const isTableColumnEnabled = localTableColumnEnabled;
  const isEditModeEnabled = localEditModeEnabled;
  
  const filterTypeOptions = getFilterTypeOptions(field.data_type);
  const tableDisplayTypeOptions = getTableDisplayTypeOptions();
  const editModeEntryTypeOptions = getEditModeEntryTypeOptions();
  const currentFilterType = isBuiltIn ? null : getSetting(filterTypeKey!, getDefaultFilterType(field.data_type));
  const currentTableDisplayType = isBuiltIn ? getDefaultTableDisplayType(field.data_type) : getSetting(tableDisplayTypeKey!, getDefaultTableDisplayType(field.data_type));
  const currentEditModeEntryType = isBuiltIn ? null : getSetting(editModeEntryTypeKey!, getDefaultEditModeEntryType(field.data_type));
  const currentTab = isBuiltIn ? 'Default' : getSetting(tabKey!, 'Default');

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
                          setTimeout(() => {
                            updateSetting(filterTypeKey!, option.value);
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
                            setTimeout(() => {
                              updateSetting(tableDisplayTypeKey!, option.value);
                            }, 200);
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
          {isBuiltIn ? (
            <span className="text-body font-body text-subtext-color">—</span>
          ) : (
            <Switch
              checked={isEditModeEnabled}
              onCheckedChange={(checked) => {
                // Update local state immediately for instant UI feedback
                setLocalEditModeEnabled(checked);
                // Then update the view setting
                updateSetting(editModeKey!, checked);
              }}
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
                          setTimeout(() => {
                            updateSetting(editModeEntryTypeKey!, option.value);
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
                            setTimeout(() => {
                              updateSetting(tabKey!, tab);
                            }, 200);
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
}

