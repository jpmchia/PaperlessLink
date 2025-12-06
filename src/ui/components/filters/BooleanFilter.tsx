"use client";

import React from "react";
import { Button } from "../Button";
import { FilterMenu } from "../FilterMenu";
import { FeatherChevronDown } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

/**
 * Boolean Filter - dropdown for true/false values
 */
export interface BooleanFilterProps {
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
          style={{ zIndex: 10000 }}
        >
          <FilterMenu className="z-[10000]">
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


