"use client";

import React, { useState, useCallback } from "react";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { FeatherChevronDown, FeatherX } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

/**
 * Exact Match Filter - text box that the user can enter an exact string to match (value contains)
 */
export interface ExactMatchFilterProps {
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
export interface TextFilterProps {
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


