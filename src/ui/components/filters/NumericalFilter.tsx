"use client";

import React, { useState, useCallback } from "react";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { FeatherChevronDown, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

/**
 * Numerical Filter - text input for numerical values with optional range
 */
export interface NumericalFilterProps {
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


