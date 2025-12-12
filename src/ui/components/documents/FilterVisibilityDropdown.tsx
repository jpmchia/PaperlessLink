"use client";

import React, { useMemo } from "react";
import { Button } from "@/ui/components/Button";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import { Checkbox } from "@/ui/components/Checkbox";
import { FeatherFilter, FeatherChevronDown } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { FilterVisibility } from "./useDocumentFilters";
import { CustomField } from "@/app/data/custom-field";
import { CustomView } from "@/app/data/custom-view";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { UiSettings } from "@/app/data/ui-settings";

interface FilterVisibilityDropdownProps {
  filterVisibility: FilterVisibility;
  onVisibilityChange: (key: keyof FilterVisibility, visible: boolean) => void;
  customFields?: CustomField[];
  appliedCustomView?: CustomView | null;
  settings?: UiSettings | null;
  onCustomFieldVisibilityChange?: (fieldId: number, visible: boolean) => void;
  pendingFilterVisibility?: Record<string, boolean> | null;
}

const FILTER_LABELS: Record<string, string> = {
  dateRange: "Created Date",
  created: "Created Date",
  added: "Added Date",
  category: "Document type",
  correspondent: "Correspondent",
  tags: "Tags",
  storagePath: "Storage Path",
  owner: "Owner",
  status: "Status",
  asn: "ASN",
  title: "Title",
  page_count: "Pages",
  fileSize: "File Size",
};

export function FilterVisibilityDropdown({
  filterVisibility,
  onVisibilityChange,
  customFields = [],
  appliedCustomView,
  settings,
  onCustomFieldVisibilityChange,
  pendingFilterVisibility,
}: FilterVisibilityDropdownProps) {
  // Define the known built-in filter keys (only show these, not settings-prefixed keys)
  const KNOWN_BUILT_IN_FILTER_KEYS = [
    'dateRange', 'created', 'added', 'category', 'correspondent', 
    'tags', 'storagePath', 'owner', 'status', 'asn', 
    'title', 'page_count', 'fileSize'
  ] as const;
  
  // Get set of custom field names (case-insensitive) to avoid duplicates
  const customFieldNamesSet = useMemo(() => {
    return new Set(customFields.map(field => field.name?.toLowerCase()).filter(Boolean));
  }, [customFields]);
  
  // Filter to only show known built-in filter keys (exclude settings-prefixed keys and custom field keys)
  // Also exclude built-in keys that match custom field names to avoid duplicates
  const builtInFilterKeys = useMemo(() => {
    const allKeys = Object.keys(filterVisibility);
    return allKeys.filter(key => {
      // Must be a known built-in filter key
      if (!KNOWN_BUILT_IN_FILTER_KEYS.includes(key as any)) return false;
      
      // Exclude settings-prefixed keys
      if (key.startsWith('general-settings:')) return false;
      
      // Exclude custom field keys
      if (key.startsWith('customField_')) return false;
      
      // Exclude numeric-only keys (custom field IDs)
      if (/^\d+$/.test(key)) return false;
      
      // Exclude if a custom field exists with the same name (case-insensitive)
      // Check both the key itself and the label
      const label = FILTER_LABELS[key] || key;
      const keyLower = key.toLowerCase();
      const labelLower = label.toLowerCase();
      if (customFieldNamesSet.has(keyLower) || customFieldNamesSet.has(labelLower)) return false;
      
      return true;
    }) as Array<keyof FilterVisibility>;
  }, [filterVisibility, customFieldNamesSet]);
  
  // Get custom field filter visibility from tableConfig (pendingFilterVisibility)
  // This includes both the active view state and any unsaved changes
  const customFieldVisibility = useMemo(() => {
    const visibility: Record<number, boolean> = {};
    
    if (!customFields.length) return visibility;
    
    // Use pendingFilterVisibility (tableConfig.filterVisibility) which has the current state
    const currentFilterVisibility = pendingFilterVisibility || {};
    
    customFields.forEach((field) => {
      if (!field.id) return;
      
      // Try multiple key formats to match how it might be stored
      const filterKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${field.id}`;
      const filterVisibilityKey1 = `customField_${field.id}`;
      const filterVisibilityKey2 = String(field.id);
      
      // Check current filter visibility state (from tableConfig)
      const isVisible = currentFilterVisibility[filterKey] !== undefined
        ? currentFilterVisibility[filterKey]
        : currentFilterVisibility[filterVisibilityKey1] !== undefined
        ? currentFilterVisibility[filterVisibilityKey1]
        : currentFilterVisibility[filterVisibilityKey2] !== undefined
        ? currentFilterVisibility[filterVisibilityKey2]
        : false;
      
      visibility[field.id] = isVisible;
    });
    
    return visibility;
  }, [customFields, pendingFilterVisibility]);
  
  // Count how many filters are visible (built-in + custom)
  const builtInVisibleCount = builtInFilterKeys.filter(key => filterVisibility[key]).length;
  const customFieldVisibleCount = Object.values(customFieldVisibility).filter(v => v).length;
  const visibleCount = builtInVisibleCount + customFieldVisibleCount;

  return (
    <SubframeCore.DropdownMenu.Root>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant="neutral-secondary"
          size="medium"
          icon={<FeatherFilter />}
          iconRight={<FeatherChevronDown />}
        >
          Filters {visibleCount > 0 && `(${visibleCount})`}
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          side="bottom"
          align="end"
          sideOffset={4}
          asChild={true}
          style={{ width: '240px', maxHeight: '400px', overflowY: 'auto', zIndex: 10000 }}
        >
          <DropdownMenu>
            {/* Built-in filters - only show known filter keys */}
            {builtInFilterKeys.map((key) => {
              const isVisible = filterVisibility[key];
              const label = FILTER_LABELS[key] || key;

              return (
                <div
                  key={key}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={isVisible}
                    onCheckedChange={(checked) => {
                      onVisibilityChange(key, checked);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-body font-body text-default-font flex-1">
                    {label}
                  </span>
                </div>
              );
            })}
            
            {/* Custom field filters - show for all views, not just custom views */}
            {customFields.length > 0 && (
              <>
                {builtInFilterKeys.length > 0 && (
                  <div className="h-px bg-neutral-border my-1" />
                )}
                {customFields.map((field) => {
                  if (!field.id) return null;
                  const isVisible = customFieldVisibility[field.id] || false;

                  return (
                    <div
                      key={`custom-field-${field.id}`}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isVisible}
                        onCheckedChange={(checked) => {
                          if (onCustomFieldVisibilityChange) {
                            onCustomFieldVisibilityChange(field.id!, checked);
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-body font-body text-default-font flex-1">
                        {field.name}
                      </span>
                    </div>
                  );
                })}
              </>
            )}
          </DropdownMenu>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

