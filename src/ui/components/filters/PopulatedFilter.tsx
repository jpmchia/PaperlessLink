"use client";

import React from "react";
import { Button } from "../Button";
import { FilterMenu } from "../FilterMenu";
import { FeatherChevronDown } from "@subframe/core";
import * as SubframeCore from "@subframe/core";

/**
 * Populated Filter - dropdownMenu that allows the user to check whether to display items that are "Empty" or not
 */
export interface PopulatedFilterProps {
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


