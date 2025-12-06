"use client";
/*
 * Reusable Filter Dropdown Component
 * Automatically sorts checked items to the top
 */

import React from "react";
import { Button } from "./Button";
import { FilterMenu } from "./FilterMenu";
import { FeatherChevronDown } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

export interface FilterOption {
  id: string | number;
  label: string;
  count?: number;
}

interface FilterDropDownProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  selectedIds: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  multiSelect?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export function FilterDropDown({
  label,
  icon,
  options,
  selectedIds,
  onSelectionChange,
  multiSelect = false,
  showAllOption = false,
  allOptionLabel = `All ${label}`,
  className,
}: FilterDropDownProps) {
  const hasSelection = selectedIds.length > 0;
  const allOptionId = "__all__"; // Special ID for "All" option
  
  // Helper to check if an ID is selected (handles type mismatches)
  const isIdSelected = (id: string | number): boolean => {
    return selectedIds.some(selectedId => String(selectedId) === String(id) || selectedId === id);
  };
  
  // Check if all items are selected
  const allSelected = options.length > 0 && options.every(opt => isIdSelected(opt.id));
  
  // Sort options so checked items appear first
  const sortedOptions = [...options].sort((a, b) => {
    const aChecked = isIdSelected(a.id);
    const bChecked = isIdSelected(b.id);
    if (aChecked === bChecked) return 0;
    return aChecked ? -1 : 1;
  });

  const handleToggle = (optionId: string | number, checked: boolean) => {
    if (multiSelect) {
      if (checked) {
        // Add to selection
        const newSelection = [...selectedIds, optionId];
        onSelectionChange(newSelection);
      } else {
        // Remove from selection
        const newSelection = selectedIds.filter(id => id !== optionId);
        onSelectionChange(newSelection);
      }
    } else {
      // Single select: selecting one deselects others
      if (checked) {
        onSelectionChange([optionId]);
      } else {
        onSelectionChange([]);
      }
    }
  };

  const handleAllToggle = (checked: boolean) => {
    if (checked) {
      // Select all options
      if (multiSelect) {
        // In multi-select, "All" selects all individual options
        onSelectionChange(options.map(opt => opt.id));
      } else {
        // For single select, "All" means no filter (empty selection)
        onSelectionChange([]);
      }
    } else {
      // Deselect all
      onSelectionChange([]);
    }
  };

  // Get display label for button
  const getButtonLabel = () => {
    if (!hasSelection) return label;
    
    if (multiSelect) {
      // For multi-select, show count and try to show labels for selected items
      const selectedOptions = selectedIds
        .map(id => {
          // Try multiple comparison strategies
          const opt = options.find(opt => 
            String(opt.id) === String(id) || 
            opt.id === id ||
            String(opt.id) === id ||
            opt.id === String(id)
          );
          return opt;
        })
        .filter(Boolean) as FilterOption[];
      
      if (selectedOptions.length === selectedIds.length && selectedOptions.length > 0) {
        // All selected items have matching options - show labels
        // But check if labels are actually IDs
        const labels = selectedOptions.map(opt => {
          // If label equals id, something is wrong with the data
          if (String(opt.label) === String(opt.id)) {
            console.warn(`[FilterDropDown] Option label equals ID for option:`, opt);
          }
          return opt.label;
        });
        
        if (selectedOptions.length === 1) {
          return `${label} (${labels[0]})`;
        } else if (selectedOptions.length <= 3) {
          return `${label} (${labels.join(', ')})`;
        } else {
          return `${label} (${selectedOptions.length})`;
        }
      }
      // Some or all selected items don't have matching options - just show count
      // Don't show IDs - wait for options to load
      if (options.length > 0) {
        console.warn(`[FilterDropDown] Could not find matching options for selectedIds:`, {
          selectedIds,
          availableIds: options.map(opt => opt.id),
          label,
        });
      }
      return `${label} (${selectedIds.length})`;
    } else {
      // Single select - find matching option with flexible comparison
      const selectedId = selectedIds[0];
      const selectedOption = options.find(opt => 
        String(opt.id) === String(selectedId) || 
        opt.id === selectedId ||
        String(opt.id) === selectedId ||
        opt.id === String(selectedId)
      );
      
      if (selectedOption) {
        // Check if label is actually the ID
        if (String(selectedOption.label) === String(selectedOption.id)) {
          console.warn(`[FilterDropDown] Option label equals ID:`, selectedOption);
        }
        
        // For date ranges, show shortened version
        if (label === "Date Range") {
          const id = String(selectedId);
          if (id === "7") return `${label} (7 days)`;
          if (id === "30") return `${label} (30 days)`;
          if (id === "90") return `${label} (90 days)`;
          if (id === "all") return `${label} (All time)`;
        }
        return `${label} (${selectedOption.label})`;
      }
      // Option not found - don't show ID, just return label
      // This can happen if options haven't loaded yet
      if (options.length > 0) {
        console.warn(`[FilterDropDown] Could not find matching option for selectedId:`, {
          selectedId,
          availableIds: options.map(opt => opt.id),
          label,
        });
      }
      return label;
    }
  };

  return (
    <SubframeCore.DropdownMenu.Root>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant={hasSelection ? "brand-primary" : "neutral-secondary"}
          icon={icon}
          iconRight={<FeatherChevronDown />}
          className={className}
        >
          {getButtonLabel()}
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          style={{ zIndex: 10000 }}
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
        >
          <FilterMenu className="z-[10000]">
            {showAllOption && (
              <>
                <FilterMenu.FilterMenuItem
                  checked={multiSelect ? allSelected : !hasSelection}
                  onCheckedChange={handleAllToggle}
                >
                  <span className="text-body-bold font-body-bold text-default-font">
                    {allOptionLabel}
                  </span>
                </FilterMenu.FilterMenuItem>
                {sortedOptions.length > 0 && <FilterMenu.FilterDivider />}
              </>
            )}
            {sortedOptions.map((option) => {
              const isChecked = isIdSelected(option.id);
              return (
                <FilterMenu.FilterMenuItem
                  key={option.id}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleToggle(option.id, checked)}
                  count={option.count}
                >
                  <span className="text-body-bold font-body-bold text-default-font">
                    {option.label}
                  </span>
                </FilterMenu.FilterMenuItem>
              );
            })}
          </FilterMenu>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

