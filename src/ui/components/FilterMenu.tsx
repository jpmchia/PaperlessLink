"use client";
/*
 * Documentation:
 * Checkbox Menu Item — https://app.subframe.com/af1371ce7f26/library?component=Checkbox+Menu+Item_de0b4dfb-3946-4702-be52-5678dd71925a
 * Filter Menu — https://app.subframe.com/af1371ce7f26/library?component=Filter+Menu_657f3fe2-3562-4afd-a9eb-07da3835745d
 */

import React from "react";
import * as SubframeCore from "@subframe/core";
import * as SubframeUtils from "../utils";
import { CheckboxMenuItem } from "./CheckboxMenuItem";

interface FilterDividerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const FilterDivider = React.forwardRef<HTMLDivElement, FilterDividerProps>(
  function FilterDivider(
    { className, ...otherProps }: FilterDividerProps,
    ref
  ) {
    return (
      <div
        className={SubframeUtils.twClassNames(
          "flex w-full items-start px-1 py-0.5",
          className
        )}
        ref={ref}
        {...otherProps}
      >
        <div className="flex h-px grow shrink-0 basis-0 flex-col items-center bg-neutral-200" />
      </div>
    );
  }
);

interface FilterMenuItemProps
  extends React.ComponentProps<typeof SubframeCore.DropdownMenu.Item> {
  children?: React.ReactNode;
  count?: React.ReactNode;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const FilterMenuItem = React.forwardRef<HTMLDivElement, FilterMenuItemProps>(
  function FilterMenuItem(
    { children, count, checked, onCheckedChange, className, ...otherProps }: FilterMenuItemProps,
    ref
  ) {
    return (
      <SubframeCore.DropdownMenu.Item asChild={true} {...otherProps}>
        <div
          className={SubframeUtils.twClassNames(
            "group/f288afe5 flex cursor-pointer items-center rounded-md py-0 hover:bg-neutral-100 active:bg-neutral-50 data-[highlighted]:bg-neutral-100 w-full border border-transparent hover:border-neutral-border",
            className
          )}
          ref={ref}
        >
          <CheckboxMenuItem checked={checked} onCheckedChange={onCheckedChange} className="px-2 py-1 w-full">
            <div className="flex items-center gap-1 w-full">
              <div className="flex-1 text-left min-w-0">
                {children}
              </div>
              {count !== undefined && count !== null ? (
                <span className="flex-none text-caption font-caption text-subtext-color text-right">
                  {count}
                </span>
              ) : null}
            </div>
          </CheckboxMenuItem>
        </div>
      </SubframeCore.DropdownMenu.Item>
    );
  }
);

interface FilterMenuRootProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const FilterMenuRoot = React.forwardRef<HTMLDivElement, FilterMenuRootProps>(
  function FilterMenuRoot(
    { children, className, ...otherProps }: FilterMenuRootProps,
    ref
  ) {
    return children ? (
      <div
        className={SubframeUtils.twClassNames(
          "flex flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background px-1 py-1 shadow-lg max-h-[calc(54vh-2rem)] overflow-y-auto",
          className
        )}
        ref={ref}
        {...otherProps}
        style={{
          maxWidth: '240px',
          ...otherProps.style,
        }}
      >
        {children}
      </div>
    ) : null;
  }
);

export const FilterMenu = Object.assign(FilterMenuRoot, {
  FilterDivider,
  FilterMenuItem,
});
