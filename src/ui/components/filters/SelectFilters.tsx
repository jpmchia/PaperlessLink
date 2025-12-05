"use client";

import React from "react";
import { FilterDropDown, FilterOption } from "../FilterDropDown";

/**
 * Multi-Select Filter - uses existing FilterDropDown component
 * This is a wrapper that provides the FilterDropDown with the right configuration
 */
export interface MultiSelectFilterProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  selectedIds: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export function MultiSelectFilter({
  label,
  icon,
  options,
  selectedIds,
  onSelectionChange,
  showAllOption = true,
  allOptionLabel,
  className,
}: MultiSelectFilterProps) {
  return (
    <FilterDropDown
      label={label}
      icon={icon}
      options={options}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      multiSelect={true}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || `All ${label}`}
      className={className}
    />
  );
}

/**
 * Single Select Filter - uses FilterDropDown with single selection
 */
export interface SingleSelectFilterProps {
  label: string;
  icon?: React.ReactNode;
  options: FilterOption[];
  selectedIds: (string | number)[];
  onSelectionChange: (selectedIds: (string | number)[]) => void;
  showAllOption?: boolean;
  allOptionLabel?: string;
  className?: string;
}

export function SingleSelectFilter({
  label,
  icon,
  options,
  selectedIds,
  onSelectionChange,
  showAllOption = true,
  allOptionLabel,
  className,
}: SingleSelectFilterProps) {
  return (
    <FilterDropDown
      label={label}
      icon={icon}
      options={options}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      multiSelect={false}
      showAllOption={showAllOption}
      allOptionLabel={allOptionLabel || `All ${label}`}
      className={className}
    />
  );
}

/**
 * Document Link Filter - similar to multi-select but for document links
 */
export function DocumentLinkFilter(props: MultiSelectFilterProps) {
  return <MultiSelectFilter {...props} />;
}


