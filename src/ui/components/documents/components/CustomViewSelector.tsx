import React from 'react';
import { Button } from '@/ui/components/Button';
import { DropdownMenu } from '@/ui/components/DropdownMenu';
import { FeatherChevronDown } from '@subframe/core';
import * as SubframeCore from '@subframe/core';
import { CustomView } from '@/app/data/custom-view';

interface CustomViewSelectorProps {
  selectedViewName: string;
  customViews: CustomView[];
  customViewsLoading: boolean;
  selectedCustomViewId: number | string | null;
  onSelectView: (viewId: number | string | null) => void;
}

export function CustomViewSelector({
  selectedViewName,
  customViews,
  customViewsLoading,
  selectedCustomViewId,
  onSelectView,
}: CustomViewSelectorProps) {
  return (
    <SubframeCore.DropdownMenu.Root>
      <SubframeCore.DropdownMenu.Trigger asChild={true}>
        <Button
          variant="neutral-secondary"
          size="medium"
          iconRight={<FeatherChevronDown />}
        >
          {selectedViewName}
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
          <DropdownMenu>
            {customViews.length === 0 && !customViewsLoading ? (
              <DropdownMenu.DropdownItem disabled icon={null}>
                No views available
              </DropdownMenu.DropdownItem>
            ) : customViewsLoading ? (
              <DropdownMenu.DropdownItem disabled icon={null}>
                Loading views...
              </DropdownMenu.DropdownItem>
            ) : (
              <>
                <DropdownMenu.DropdownItem
                  onClick={() => onSelectView(null)}
                  icon={null}
                >
                  Default View
                </DropdownMenu.DropdownItem>
                {customViews.length > 0 && <DropdownMenu.DropdownDivider />}
                {customViews.map((view) => {
                  const viewId = view.id as number | string | undefined;
                  if (!viewId || typeof viewId === 'string') return null; // Skip drafts
                  return (
                    <DropdownMenu.DropdownItem
                      key={viewId}
                      onClick={() => onSelectView(viewId)}
                      icon={null}
                    >
                      {view.name}
                      {view.is_global && " (Global)"}
                    </DropdownMenu.DropdownItem>
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

