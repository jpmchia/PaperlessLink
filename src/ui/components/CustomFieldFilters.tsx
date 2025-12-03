"use client";

import React, { useState, useCallback } from "react";
import { Button } from "./Button";
import { TextField } from "./TextField";
import { FilterMenu } from "./FilterMenu";
import { FilterDropDown, FilterOption } from "./FilterDropDown";
import { DateRangePicker } from "./DateRangePicker";
import { FeatherChevronDown, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

/**
 * Populated Filter - dropdownMenu that allows the user to check whether to display items that are "Empty" or not
 */
interface PopulatedFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: 'all' | 'populated' | 'empty';
  onChange: (value: 'all' | 'populated' | 'empty') => void;
  className?: string;
}

export function PopulatedFilter({
  label,
  icon,
  value,
  onChange,
  className,
}: PopulatedFilterProps) {
  const hasSelection = value !== 'all';

  const getButtonLabel = () => {
    if (value === 'populated') return `${label} (Populated)`;
    if (value === 'empty') return `${label} (Empty)`;
    return label;
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
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
        >
          <FilterMenu>
            <FilterMenu.FilterMenuItem
              checked={value === 'all'}
              onCheckedChange={(checked) => {
                if (checked) onChange('all');
              }}
            >
              <span className="text-body-bold font-body-bold text-default-font">
                All
              </span>
            </FilterMenu.FilterMenuItem>
            <FilterMenu.FilterDivider />
            <FilterMenu.FilterMenuItem
              checked={value === 'populated'}
              onCheckedChange={(checked) => {
                if (checked) onChange('populated');
              }}
            >
              <span className="text-body-bold font-body-bold text-default-font">
                Populated
              </span>
            </FilterMenu.FilterMenuItem>
            <FilterMenu.FilterMenuItem
              checked={value === 'empty'}
              onCheckedChange={(checked) => {
                if (checked) onChange('empty');
              }}
            >
              <span className="text-body-bold font-body-bold text-default-font">
                Empty
              </span>
            </FilterMenu.FilterMenuItem>
          </FilterMenu>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

/**
 * Exact Match Filter - text box that the user can enter an exact string to match (value contains)
 */
interface ExactMatchFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function ExactMatchFilter({
  label,
  icon,
  value,
  onChange,
  onClear,
  placeholder = "Enter text to match...",
  className,
}: ExactMatchFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleApply = useCallback(() => {
    onChange(inputValue);
    setIsOpen(false);
  }, [inputValue, onChange]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    if (onClear) onClear();
    setIsOpen(false);
  }, [onChange, onClear]);

  const hasValue = value.trim().length > 0;

  return (
    <SubframeCore.DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant={hasValue ? "brand-primary" : "neutral-secondary"}
          icon={icon}
          iconRight={<FeatherChevronDown />}
          className={className}
        >
          {hasValue ? `${label} (${value})` : label}
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
        >
          <div className="flex min-w-[280px] flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-lg">
            <div className="flex w-full items-center justify-between">
              <span className="text-body-bold font-body-bold text-default-font">
                {label}
              </span>
              {hasValue && (
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherX />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
            <TextField className="w-full">
              <TextField.Input
                placeholder={placeholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleApply();
                  }
                }}
                autoFocus
              />
            </TextField>
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                variant="neutral-secondary"
                size="small"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="brand-primary"
                size="small"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

/**
 * Text Filter - similar to Exact Match but for general text search
 */
interface TextFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  placeholder?: string;
  className?: string;
}

export function TextFilter({
  label,
  icon,
  value,
  onChange,
  onClear,
  placeholder = "Enter text...",
  className,
}: TextFilterProps) {
  // Reuse ExactMatchFilter implementation
  return (
    <ExactMatchFilter
      label={label}
      icon={icon}
      value={value}
      onChange={onChange}
      onClear={onClear}
      placeholder={placeholder}
      className={className}
    />
  );
}

/**
 * Multi-Select Filter - uses existing FilterDropDown component
 * This is a wrapper that provides the FilterDropDown with the right configuration
 */
interface MultiSelectFilterProps {
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
interface SingleSelectFilterProps {
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
 * Date Range Filter - uses DateRangePicker component
 */
interface DateRangeFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: { from: Date | null; to: Date | null } | null;
  onChange: (value: { from: Date | null; to: Date | null } | null) => void;
  className?: string;
}

export function DateRangeFilter({
  label,
  icon,
  value,
  onChange,
  className,
}: DateRangeFilterProps) {
  return (
    <DateRangePicker
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}

/**
 * Single Date Filter - date picker for a single date
 */
interface SingleDateFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: Date | null;
  onChange: (value: Date | null) => void;
  className?: string;
}

export function SingleDateFilter({
  label,
  icon,
  value,
  onChange,
  className,
}: SingleDateFilterProps) {
  // For now, we can use DateRangePicker with only "from" date
  // Or create a simpler single date picker
  const handleChange = useCallback((range: { from: Date | null; to: Date | null } | null) => {
    onChange(range?.from || null);
  }, [onChange]);

  return (
    <DateRangePicker
      value={value ? { from: value, to: null } : null}
      onChange={handleChange}
      className={className}
    />
  );
}

/**
 * Numerical Filter - text input for numerical values with optional range
 */
interface NumericalFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: { min?: number; max?: number } | null;
  onChange: (value: { min?: number; max?: number } | null) => void;
  className?: string;
}

export function NumericalFilter({
  label,
  icon,
  value,
  onChange,
  className,
}: NumericalFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [minValue, setMinValue] = useState(value?.min?.toString() || '');
  const [maxValue, setMaxValue] = useState(value?.max?.toString() || '');

  const hasValue = (value?.min !== undefined && value.min !== null) || 
                   (value?.max !== undefined && value.max !== null);

  const handleApply = useCallback(() => {
    const newValue: { min?: number; max?: number } = {};
    if (minValue.trim()) {
      const min = parseFloat(minValue);
      if (!isNaN(min)) newValue.min = min;
    }
    if (maxValue.trim()) {
      const max = parseFloat(maxValue);
      if (!isNaN(max)) newValue.max = max;
    }
    
    if (Object.keys(newValue).length > 0) {
      onChange(newValue);
    } else {
      onChange(null);
    }
    setIsOpen(false);
  }, [minValue, maxValue, onChange]);

  const handleClear = useCallback(() => {
    setMinValue('');
    setMaxValue('');
    onChange(null);
    setIsOpen(false);
  }, [onChange]);

  const getButtonLabel = () => {
    if (!hasValue) return label;
    const parts: string[] = [];
    if (value?.min !== undefined && value.min !== null) parts.push(`≥${value.min}`);
    if (value?.max !== undefined && value.max !== null) parts.push(`≤${value.max}`);
    return parts.length > 0 ? `${label} (${parts.join(', ')})` : label;
  };

  return (
    <SubframeCore.DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant={hasValue ? "brand-primary" : "neutral-secondary"}
          icon={icon}
          iconRight={<FeatherChevronDown />}
          className={className}
        >
          {getButtonLabel()}
        </Button>
      </SubframeCore.DropdownMenu.Trigger>
      <SubframeCore.DropdownMenu.Portal>
        <SubframeCore.DropdownMenu.Content
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
        >
          <div className="flex min-w-[280px] flex-col items-start gap-3 rounded-md border border-solid border-neutral-border bg-default-background px-4 py-3 shadow-lg">
            <div className="flex w-full items-center justify-between">
              <span className="text-body-bold font-body-bold text-default-font">
                {label}
              </span>
              {hasValue && (
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  icon={<FeatherX />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="flex w-full flex-col gap-2">
              <TextField label="Minimum" className="w-full">
                <TextField.Input
                  type="number"
                  placeholder="Min value"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </TextField>
              <TextField label="Maximum" className="w-full">
                <TextField.Input
                  type="number"
                  placeholder="Max value"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </TextField>
            </div>
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                variant="neutral-secondary"
                size="small"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="brand-primary"
                size="small"
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
          </div>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

/**
 * Range Filter - similar to Numerical but for range values
 */
export function RangeFilter(props: NumericalFilterProps) {
  return <NumericalFilter {...props} />;
}

/**
 * Boolean Filter - dropdown for true/false values
 */
interface BooleanFilterProps {
  label: string;
  icon?: React.ReactNode;
  value: 'all' | 'true' | 'false' | null;
  onChange: (value: 'all' | 'true' | 'false' | null) => void;
  className?: string;
}

export function BooleanFilter({
  label,
  icon,
  value = 'all',
  onChange,
  className,
}: BooleanFilterProps) {
  const hasSelection = value !== 'all' && value !== null;

  const getButtonLabel = () => {
    if (value === 'true') return `${label} (Yes)`;
    if (value === 'false') return `${label} (No)`;
    return label;
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
          side="bottom"
          align="start"
          sideOffset={4}
          asChild={true}
        >
          <FilterMenu>
            <FilterMenu.FilterMenuItem
              checked={value === 'all' || value === null}
              onCheckedChange={(checked) => {
                if (checked) onChange('all');
              }}
            >
              <span className="text-body-bold font-body-bold text-default-font">
                All
              </span>
            </FilterMenu.FilterMenuItem>
            <FilterMenu.FilterDivider />
            <FilterMenu.FilterMenuItem
              checked={value === 'true'}
              onCheckedChange={(checked) => {
                if (checked) onChange('true');
              }}
            >
              <span className="text-body-bold font-body-bold text-default-font">
                Yes
              </span>
            </FilterMenu.FilterMenuItem>
            <FilterMenu.FilterMenuItem
              checked={value === 'false'}
              onCheckedChange={(checked) => {
                if (checked) onChange('false');
              }}
            >
              <span className="text-body-bold font-body-bold text-default-font">
                No
              </span>
            </FilterMenu.FilterMenuItem>
          </FilterMenu>
        </SubframeCore.DropdownMenu.Content>
      </SubframeCore.DropdownMenu.Portal>
    </SubframeCore.DropdownMenu.Root>
  );
}

/**
 * Document Link Filter - similar to multi-select but for document links
 */
export function DocumentLinkFilter(props: MultiSelectFilterProps) {
  return <MultiSelectFilter {...props} />;
}

