import React from 'react';
import { Button } from '@/ui/components/Button';
import { FeatherDownload, FeatherFileText, FeatherChevronLeft, FeatherChevronRight } from '@subframe/core';
import { FilterVisibilityDropdown } from '../FilterVisibilityDropdown';
import { ColumnVisibilityDropdown } from '../ColumnVisibilityDropdown';
import { CustomViewSelector } from './CustomViewSelector';
import { CustomViewActions } from './CustomViewActions';
import { FilterVisibility } from '../useDocumentFilters';
import { CustomField } from '@/app/data/custom-field';
import { CustomView } from '@/app/data/custom-view';
import { UiSettings } from '@/app/data/ui-settings';

interface DocumentsCustomViewHeaderProps {
  selectedViewName: string;
  customViews: CustomView[];
  customViewsLoading: boolean;
  selectedCustomViewId: number | string | null;
  onSelectView: (viewId: number | string | null) => void;
  appliedCustomView: CustomView | null;
  filterVisibility: FilterVisibility;
  onFilterVisibilityChange: (key: keyof FilterVisibility, visible: boolean) => void;
  onCustomFieldFilterVisibilityChange: (fieldId: number, visible: boolean) => void;
  customFields: CustomField[];
  settings: UiSettings | null;
  columnOrder: (string | number)[];
  columnVisibility: Record<string, boolean>;
  onColumnOrderChange: (order: (string | number)[]) => void;
  onColumnVisibilityChange: (columnId: string | number, visible: boolean) => void;
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  onSave: () => void;
  onRevert: () => void;
  onSaveAs: () => void;
  pendingFilterVisibility: Record<string, boolean> | null;
  onExport: () => void;
  isPanelVisible: boolean;
  onTogglePanel: () => void;
}

export function DocumentsCustomViewHeader({
  selectedViewName,
  customViews,
  customViewsLoading,
  selectedCustomViewId,
  onSelectView,
  appliedCustomView,
  filterVisibility,
  onFilterVisibilityChange,
  onCustomFieldFilterVisibilityChange,
  customFields,
  settings,
  columnOrder,
  columnVisibility,
  onColumnOrderChange,
  onColumnVisibilityChange,
  hasUnsavedChanges,
  isSaving,
  onSave,
  onRevert,
  onSaveAs,
  pendingFilterVisibility,
  onExport,
  isPanelVisible,
  onTogglePanel,
}: DocumentsCustomViewHeaderProps) {
  return (
    <div className="flex w-full flex-none items-center justify-between gap-4 px-6 pt-4 pb-2">
      <div className="flex items-center gap-4 flex-1">
        <h2 className="text-heading-2 font-heading-2 text-default-font">{selectedViewName}</h2>
        <h2 className="text-heading-3 font-heading-3 text-default-font text-subtext-color">(Custom View)</h2>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Export Button */}
        <Button
          variant="neutral-tertiary"
          size="medium"
          icon={<FeatherDownload />}
          onClick={onExport}
        >
          Export
        </Button>
        
        {/* Vertical Separator */}
        <div className="flex items-center gap-2 px-2">
          <div className="h-6 w-px bg-neutral-border" />
        </div>
        
        {/* Filter Visibility Dropdown */}
        <FilterVisibilityDropdown
          filterVisibility={filterVisibility}
          onVisibilityChange={onFilterVisibilityChange}
          customFields={customFields}
          appliedCustomView={appliedCustomView}
          settings={settings}
          onCustomFieldVisibilityChange={onCustomFieldFilterVisibilityChange}
          pendingFilterVisibility={pendingFilterVisibility}
        />
        
        {/* Column Visibility/Order Dropdown - show for all views */}
        <ColumnVisibilityDropdown
          columnOrder={columnOrder}
          columnVisibility={columnVisibility}
          onOrderChange={onColumnOrderChange}
          onVisibilityChange={onColumnVisibilityChange}
          customFields={customFields}
        />
        
        {/* Custom View Selector */}
        <CustomViewSelector
          selectedViewName={selectedViewName}
          customViews={customViews}
          customViewsLoading={customViewsLoading}
          selectedCustomViewId={selectedCustomViewId}
          onSelectView={onSelectView}
        />
        
        {/* Save, Revert, and Save As buttons - only show when a custom view is selected */}
        {appliedCustomView && selectedCustomViewId && typeof selectedCustomViewId === 'number' && (
          <CustomViewActions
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            onSave={onSave}
            onRevert={onRevert}
            onSaveAs={onSaveAs}
          />
        )}
        
        {/* Vertical Separator */}
        <div className="flex items-center gap-2 px-2">
          <div className="h-6 w-px bg-neutral-border" />
        </div>
        
        {/* Preview Toggle Button */}
        <Button
          variant="neutral-secondary"
          size="medium"
          icon={<FeatherFileText />}
          iconRight={isPanelVisible ? <FeatherChevronRight /> : <FeatherChevronLeft />}
          onClick={onTogglePanel}
          title={isPanelVisible ? "Hide preview panel" : "Show preview panel"}
        />
      </div>
    </div>
  );
}

