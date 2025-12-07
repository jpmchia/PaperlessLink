"use client";

import React, { useState, useMemo } from "react";
import { Table } from "../Table";
import { CustomField } from "@/app/data/custom-field";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { BUILT_IN_FIELDS, BuiltInField } from "./builtInFields";
import { CustomFieldRow } from "./CustomFieldRow";

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

    // Normalize the current order - convert customField_ prefixed IDs to numeric IDs
    const normalizeOrder = (order: (string | number)[]): (string | number)[] => {
      return order.map(id => {
        if (typeof id === 'string' && id.startsWith('customField_')) {
          const numId = parseInt(id.replace('customField_', ''), 10);
          return isNaN(numId) ? id : numId;
        }
        return id;
      });
    };

    const currentOrderRaw = columnOrder.length > 0 ? [...columnOrder] : [
      ...BUILT_IN_FIELDS.map(bf => bf.id),
      ...customFieldOrder,
    ];
    const currentOrder = normalizeOrder(currentOrderRaw);

    // Normalize IDs for comparison
    const normalizeId = (id: string | number): string | number => {
      if (typeof id === 'string' && id.startsWith('customField_')) {
        const numId = parseInt(id.replace('customField_', ''), 10);
        return isNaN(numId) ? id : numId;
      }
      return id;
    };

    const normalizedDraggedId = normalizeId(draggedFieldId);
    const normalizedTargetId = normalizeId(targetFieldId);

    const draggedIndex = currentOrder.findIndex(id => normalizeId(id) === normalizedDraggedId);
    const targetIndex = currentOrder.findIndex(id => normalizeId(id) === normalizedTargetId);

    if (draggedIndex === -1) {
      // Field not in order yet, add it at target position
      currentOrder.splice(targetIndex >= 0 ? targetIndex : currentOrder.length, 0, normalizedDraggedId);
    } else if (targetIndex === -1) {
      // Target not in order, move dragged to end
      currentOrder.splice(draggedIndex, 1);
      currentOrder.push(normalizedDraggedId);
    } else {
      // Both in order, reorder
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, normalizedDraggedId);
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
      const normalizedFieldId = normalizeId(fieldId);
      if (!currentOrder.some(id => normalizeId(id) === normalizedFieldId)) {
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
            <Table.HeaderCell>Span both rows</Table.HeaderCell>
            <Table.HeaderCell>Show on second row</Table.HeaderCell>
            <Table.HeaderCell>Table Display Type</Table.HeaderCell>
            <Table.HeaderCell>Column Width</Table.HeaderCell>
            <Table.HeaderCell>Show in Edit Mode</Table.HeaderCell>
            <Table.HeaderCell>Edit Mode Entry Type</Table.HeaderCell>
            <Table.HeaderCell>Tab</Table.HeaderCell>
          </Table.HeaderRow>
        }
      >
        {allFields.map((field) => (
          <CustomFieldRow
            key={field.isBuiltIn ? `builtin-${(field as BuiltInField).id}` : (field as CustomField).id}
            field={field}
            getSetting={getSetting}
            updateSetting={updateSetting}
            tabsList={tabsList}
            newTabInput={newTabInput}
            setNewTabInput={setNewTabInput}
            handleAddTab={handleAddTab}
            draggedFieldId={draggedFieldId}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}
      </Table>
    </div>
  );
}

