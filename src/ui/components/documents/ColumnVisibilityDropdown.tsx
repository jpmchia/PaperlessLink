"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/ui/components/Button";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { Checkbox } from "@/ui/components/Checkbox";
import { FeatherColumns, FeatherGripVertical, FeatherChevronDown, FeatherStar } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { CustomField } from "@/app/data/custom-field";
import { BUILT_IN_FIELDS } from "@/ui/components/settings/builtInFields";

interface ColumnInfo {
  id: string | number;
  name: string;
  isBuiltIn: boolean;
}

interface ColumnVisibilityDropdownProps {
  columnOrder: (string | number)[];
  columnVisibility: Record<string, boolean>;
  onOrderChange: (newOrder: (string | number)[]) => void;
  onVisibilityChange: (columnId: string | number, visible: boolean) => void;
  customFields: CustomField[];
}

export function ColumnVisibilityDropdown({
  columnOrder,
  columnVisibility,
  onOrderChange,
  onVisibilityChange,
  customFields,
}: ColumnVisibilityDropdownProps) {
  const [draggedColumnId, setDraggedColumnId] = useState<string | number | null>(null);

  // Create list of all available columns (built-in + custom)
  const allColumns = useMemo(() => {
    const columns: ColumnInfo[] = [];
    
    // Add built-in fields
    BUILT_IN_FIELDS.forEach(field => {
      columns.push({
        id: field.id,
        name: field.name,
        isBuiltIn: true,
      });
    });
    
    // Add custom fields
    customFields.forEach(field => {
      if (field.id !== undefined) {
        columns.push({
          id: field.id,
          name: field.name,
          isBuiltIn: false,
        });
      }
    });
    
    return columns;
  }, [customFields]);

  // Create ordered list of columns based on columnOrder
  const orderedColumns = useMemo(() => {
    const columnMap = new Map<string | number, ColumnInfo>();
    allColumns.forEach(col => {
      columnMap.set(col.id, col);
    });

    const ordered: ColumnInfo[] = [];
    const processed = new Set<string | number>();

    // Add columns in order from columnOrder
    columnOrder.forEach(id => {
      const col = columnMap.get(id);
      if (col && !processed.has(id)) {
        ordered.push(col);
        processed.add(id);
      }
    });

    // Add any remaining columns that weren't in the order
    allColumns.forEach(col => {
      if (!processed.has(col.id)) {
        ordered.push(col);
      }
    });

    return ordered;
  }, [allColumns, columnOrder]);

  const handleDragStart = (e: React.DragEvent, columnId: string | number) => {
    setDraggedColumnId(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(columnId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string | number) => {
    e.preventDefault();
    if (!draggedColumnId || draggedColumnId === targetColumnId) {
      setDraggedColumnId(null);
      return;
    }

    const currentOrder = [...columnOrder];
    const draggedIndex = currentOrder.indexOf(draggedColumnId);
    const targetIndex = currentOrder.indexOf(targetColumnId);

    if (draggedIndex === -1) {
      // Column not in order, add it at target position
      currentOrder.splice(targetIndex >= 0 ? targetIndex : currentOrder.length, 0, draggedColumnId);
    } else if (targetIndex === -1) {
      // Target not in order, move dragged to end
      currentOrder.splice(draggedIndex, 1);
      currentOrder.push(draggedColumnId);
    } else {
      // Both in order, reorder
      currentOrder.splice(draggedIndex, 1);
      currentOrder.splice(targetIndex, 0, draggedColumnId);
    }

    onOrderChange(currentOrder);
    setDraggedColumnId(null);
  };

  const handleDragEnd = () => {
    setDraggedColumnId(null);
  };


  return (
    <SubframeCore.DropdownMenu.Root>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant="neutral-secondary"
          size="medium"
          icon={<FeatherColumns />}
          iconRight={<FeatherChevronDown />}
        >
          Columns
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={4}
          asChild={true}
          style={{ width: '280px', maxHeight: '400px', overflowY: 'auto', zIndex: 10000 }}
        >
          <DropdownMenu>
            {orderedColumns.map((column) => {
              // Check visibility - for custom fields, use customField_X format, for built-in use direct ID
              const visibilityKey = column.isBuiltIn 
                ? String(column.id) 
                : `customField_${column.id}`;
              const isVisible = columnVisibility[visibilityKey] !== false;
              const isDragging = draggedColumnId === column.id;

              return (
                <div
                  key={String(column.id)}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, column.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 cursor-move ${isDragging ? 'opacity-50' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <FeatherGripVertical className="w-4 h-4 text-subtext-color flex-shrink-0" />
                  {column.isBuiltIn && (
                    <FeatherStar className="w-3 h-3 text-brand-600 flex-shrink-0" />
                  )}
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={(checked) => {
                      onVisibilityChange(column.id, checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-body font-body text-default-font flex-1">
                    {column.name}
                  </span>
                </div>
              );
            })}
          </DropdownMenu>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

