"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Button } from "./Button";
import { TextField } from "./TextField";
import { FilterMenu } from "./FilterMenu";
import { FilterDropDown, FilterOption } from "./FilterDropDown";
import { FeatherChevronDown, FeatherPlus, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";
import { useCustomFieldValues } from "@/lib/api/hooks/use-custom-field-values";
import { CustomFieldValueOption } from "@/lib/api/services/custom-field-values.service";

/**
 * Dynamic List Filter - for custom fields with dynamic, aggregated values
 * Like Named Entities, Topics, etc. where values are created on-the-fly
 * and the list is aggregated from all documents
 */
interface DynamicListFilterProps {
  label: string;
  icon?: React.ReactNode;
  fieldId: number;
  selectedIds: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  onCreateNew?: (value: string) => Promise<void>;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
  searchPlaceholder?: string;
}

export function DynamicListFilter({
  label,
  icon,
  fieldId,
  selectedIds,
  onSelectionChange,
  onCreateNew,
  showAllOption = true,
  allOptionLabel,
  className,
  searchPlaceholder = "Search or add new...",
}: DynamicListFilterProps) {
  const { values, loading, refetch } = useCustomFieldValues(fieldId);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newValueInput, setNewValueInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Convert values to FilterOption format
  const options: FilterOption[] = values.map((val) => ({
    id: val.id,
    label: val.label,
    count: val.count,
  }));

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if search query matches an existing option exactly
  const exactMatch = filteredOptions.find(
    (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase()
  );

  // Check if we should show "create new" option
  const showCreateNew =
    searchQuery.trim().length > 0 &&
    !exactMatch &&
    onCreateNew !== undefined;

  const handleCreateNew = useCallback(async () => {
    if (!onCreateNew || !searchQuery.trim()) return;

    setIsCreating(true);
    try {
      await onCreateNew(searchQuery.trim());
      // Refresh the values list
      await refetch();
      // Select the newly created value
      const newOption = options.find(
        (opt) => opt.label.toLowerCase() === searchQuery.toLowerCase()
      );
      if (newOption) {
        onSelectionChange([...selectedIds, newOption.id]);
      }
      setSearchQuery("");
      setNewValueInput("");
    } catch (error) {
      console.error("Failed to create new value:", error);
    } finally {
      setIsCreating(false);
    }
  }, [onCreateNew, searchQuery, refetch, options, selectedIds, onSelectionChange]);

  // Handle Enter key in search input
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && showCreateNew && !isCreating) {
        e.preventDefault();
        handleCreateNew();
      }
    },
    [showCreateNew, isCreating, handleCreateNew]
  );

  return (
    <SubframeCore.DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant={selectedIds.length > 0 ? "brand-primary" : "neutral-secondary"}
          icon={icon}
          iconRight={<FeatherChevronDown />}
          className={className}
        >
          {selectedIds.length > 0
            ? `${label} (${selectedIds.length})`
            : label}
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
        >
          <div className="flex min-w-[280px] max-h-[400px] flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background shadow-lg overflow-hidden">
            {/* Search/Add Input */}
            <div className="flex w-full flex-col gap-2 p-3 border-b border-solid border-neutral-border">
              <TextField className="w-full">
                <TextField.Input
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  autoFocus
                />
              </TextField>
              {showCreateNew && (
                <Button
                  variant="brand-primary"
                  size="small"
                  icon={<FeatherPlus />}
                  onClick={handleCreateNew}
                  disabled={isCreating}
                  className="w-full"
                >
                  {isCreating ? "Creating..." : `Create "${searchQuery.trim()}"`}
                </Button>
              )}
            </div>

            {/* Filter Menu with Options */}
            <div className="flex-1 overflow-y-auto w-full">
              <FilterMenu>
                {showAllOption && (
                  <>
                    <FilterMenu.FilterMenuItem
                      checked={selectedIds.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) onSelectionChange([]);
                      }}
                    >
                      <span className="text-body-bold font-body-bold text-default-font">
                        {allOptionLabel || `All ${label}`}
                      </span>
                    </FilterMenu.FilterMenuItem>
                    {filteredOptions.length > 0 && <FilterMenu.FilterDivider />}
                  </>
                )}
                {loading ? (
                  <div className="px-3 py-2">
                    <span className="text-body font-body text-subtext-color">
                      Loading values...
                    </span>
                  </div>
                ) : filteredOptions.length === 0 && !showCreateNew ? (
                  <div className="px-3 py-2">
                    <span className="text-body font-body text-subtext-color">
                      {searchQuery
                        ? "No matching values found"
                        : "No values available"}
                    </span>
                  </div>
                ) : (
                  filteredOptions.map((option) => {
                    const isChecked = selectedIds.includes(option.id);
                    return (
                      <FilterMenu.FilterMenuItem
                        key={option.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onSelectionChange([...selectedIds, option.id]);
                          } else {
                            onSelectionChange(
                              selectedIds.filter((id) => id !== option.id)
                            );
                          }
                        }}
                        count={option.count}
                      >
                        <span className="text-body-bold font-body-bold text-default-font">
                          {option.label}
                        </span>
                      </FilterMenu.FilterMenuItem>
                    );
                  })
                )}
              </FilterMenu>
            </div>
          </div>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

