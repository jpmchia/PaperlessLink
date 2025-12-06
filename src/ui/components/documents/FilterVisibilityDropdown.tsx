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
}

const FILTER_LABELS: Record<keyof FilterVisibility, string> = {
  dateRange: "Created Date",
  category: "Document type",
  correspondent: "Correspondent",
  tags: "Tags",
  storagePath: "Storage Path",
  owner: "Owner",
  status: "Status",
  asn: "ASN",
};

export function FilterVisibilityDropdown({
  filterVisibility,
  onVisibilityChange,
  customFields = [],
  appliedCustomView,
  settings,
  onCustomFieldVisibilityChange,
}: FilterVisibilityDropdownProps) {
  const filterKeys = Object.keys(filterVisibility) as Array<keyof FilterVisibility>;
  
  // Get custom field filter visibility
  const customFieldVisibility = useMemo(() => {
    const visibility: Record<number, boolean> = {};
    
    if (!appliedCustomView || !customFields.length) return visibility;
    
    customFields.forEach((field) => {
      if (!field.id) return;
      
      const filterKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${field.id}`;
      const filterVisibilityKey1 = `customField_${field.id}`;
      const filterVisibilityKey2 = String(field.id);
      
      // Check filter_visibility object first, then fall back to settings
      const isFilterVisibleFromView = appliedCustomView.filter_visibility?.[filterKey] ||
                                     appliedCustomView.filter_visibility?.[filterVisibilityKey1] ||
                                     appliedCustomView.filter_visibility?.[filterVisibilityKey2] ||
                                     false;
      
      // Also check global settings as fallback
      const settingsObj = settings?.settings as Record<string, any> | undefined;
      const isFilterVisibleFromSettings = settingsObj?.[filterKey] || false;
      
      visibility[field.id] = isFilterVisibleFromView || isFilterVisibleFromSettings;
    });
    
    return visibility;
  }, [customFields, appliedCustomView, settings]);
  
  // Count how many filters are visible (built-in + custom)
  const builtInVisibleCount = filterKeys.filter(key => filterVisibility[key]).length;
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
            {/* Built-in filters */}
            {filterKeys.map((key) => {
              const isVisible = filterVisibility[key];
              const label = FILTER_LABELS[key];

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
            
            {/* Custom field filters */}
            {appliedCustomView && customFields.length > 0 && (
              <>
                {filterKeys.length > 0 && (
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

