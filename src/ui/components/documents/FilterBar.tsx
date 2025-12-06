import React, { memo, useMemo } from 'react';
import { TextField } from "@/ui/components/TextField";
import { DateRangePicker } from "@/ui/components/DateRangePicker";
import { FilterDropDown } from "@/ui/components/FilterDropDown";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSearch, FeatherTag, FeatherUser, FeatherFolder, FeatherUsers, FeatherListFilter, FeatherHash, FeatherChevronRight, FeatherChevronLeft, FeatherDownload, FeatherPlus } from "@subframe/core";
import { useDocumentFilters, FilterVisibility } from './useDocumentFilters';
import { CustomField } from "@/app/data/custom-field";
import { CustomView } from "@/app/data/custom-view";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { getDefaultFilterType } from "@/ui/components/settings/customFieldHelpers";
import { UiSettings } from "@/app/data/ui-settings";
import { useCustomFieldValues } from "@/lib/api/hooks/use-custom-field-values";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterVisibility: FilterVisibility;
  filters: {
    dateRange: { start: Date | null; end: Date | null } | null;
    category: number[];
    correspondent: number[];
    tags: number[];
    storagePath: number[];
    owner: string[];
    status: string[];
    asn: number[];
    customFields: Record<number, {
      type: string;
      value: any;
    }>;
  };
  updateFilter: {
    dateRange: (value: { start: Date | null; end: Date | null } | null) => void;
    category: (value: number[]) => void;
    correspondent: (value: number[]) => void;
    tags: (value: number[]) => void;
    storagePath: (value: number[]) => void;
    owner: (value: string[]) => void;
    status: (value: string[]) => void;
    asn: (value: number[]) => void;
    customField: (fieldId: number, filterType: string, value: any) => void;
  };
  documentTypes: Array<{ id?: number; name?: string }>;
  correspondents: Array<{ id?: number; name?: string }>;
  tags: Array<{ id?: number; name?: string }>;
  customFields?: CustomField[];
  appliedCustomView?: CustomView | null;
  settings?: UiSettings | null;
  pendingFilterVisibility?: Record<string, boolean> | null;
  onAddDocument: () => void;
  filterBarRef?: React.RefObject<HTMLDivElement>;
}

export const FilterBar = memo<FilterBarProps>(({
  searchQuery,
  onSearchChange,
  filterVisibility,
  filters,
  updateFilter,
  documentTypes,
  correspondents,
  tags,
  customFields = [],
  appliedCustomView,
  settings,
  pendingFilterVisibility,
  onAddDocument,
  filterBarRef,
}) => {
  // Memoize filter options to prevent unnecessary re-renders
  const categoryOptions = useMemo(
    () => documentTypes
      .filter(type => type.id !== undefined && type.name !== undefined)
      .map(type => ({ id: type.id!, label: type.name! })),
    [documentTypes]
  );

  const correspondentOptions = useMemo(
    () => correspondents
      .filter(corr => corr.id !== undefined && corr.name !== undefined)
      .map(corr => ({ id: corr.id!, label: corr.name! })),
    [correspondents]
  );

  const tagOptions = useMemo(
    () => tags
      .filter(tag => tag.id !== undefined && tag.name !== undefined)
      .map(tag => ({ id: tag.id!, label: tag.name! })),
    [tags]
  );

  return (
    <div ref={filterBarRef} className="flex w-full flex-none flex-wrap items-center gap-2 border-b border-solid border-neutral-border px-6 py-2">
      <TextField
        variant="filled"
        label=""
        helpText=""
        icon={<FeatherSearch />}
        className="h-auto w-64 flex-none"
      >
        <TextField.Input
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            onSearchChange(event.target.value);
          }}
        />
      </TextField>
      {filterVisibility.dateRange && (
        <DateRangePicker
          label="Created Date"
          value={filters.dateRange || undefined}
          onChange={(range) => updateFilter.dateRange(range.start || range.end ? range : null)}
        />
      )}
      {filterVisibility.category && (
        <FilterDropDown
          label="Document type"
          icon={<FeatherTag />}
          options={categoryOptions}
          selectedIds={filters.category}
          onSelectionChange={(ids) => updateFilter.category(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Document types"
        />
      )}
      {filterVisibility.correspondent && (
        <FilterDropDown
          label="Correspondent"
          icon={<FeatherUser />}
          options={correspondentOptions}
          selectedIds={filters.correspondent}
          onSelectionChange={(ids) => updateFilter.correspondent(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Correspondents"
        />
      )}
      {filterVisibility.tags && (
        <FilterDropDown
          label="Tags"
          icon={<FeatherTag />}
          options={tagOptions}
          selectedIds={filters.tags}
          onSelectionChange={(ids) => updateFilter.tags(ids as number[])}
          multiSelect={true}
        />
      )}
      {filterVisibility.storagePath && (
        <FilterDropDown
          label="Storage Path"
          icon={<FeatherFolder />}
          options={[]}
          selectedIds={filters.storagePath}
          onSelectionChange={(ids) => updateFilter.storagePath(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Storage Paths"
        />
      )}
      {filterVisibility.owner && (
        <FilterDropDown
          label="Owner"
          icon={<FeatherUsers />}
          options={[{ id: "me", label: "Me" }]}
          selectedIds={filters.owner}
          onSelectionChange={(ids) => updateFilter.owner(ids as string[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All Owners"
        />
      )}
      {filterVisibility.asn && (
        <FilterDropDown
          label="ASN"
          icon={<FeatherHash />}
          options={[]}
          selectedIds={filters.asn}
          onSelectionChange={(ids) => updateFilter.asn(ids as number[])}
          multiSelect={true}
          showAllOption={true}
          allOptionLabel="All ASN"
        />
      )}
      
      {/* Vertical Separator */}
      {appliedCustomView && customFields.length > 0 && (
        <div className="h-6 w-px bg-neutral-border" />
      )}
      
      {/* Dynamic Custom Field Filters */}
      {appliedCustomView && customFields.map((field) => {
        if (!field.id) return null;
        
        // Check if this field should be shown as a filter
        // Try multiple key formats to match how it might be stored
        const filterKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${field.id}`;
        const filterVisibilityKey1 = `customField_${field.id}`;
        const filterVisibilityKey2 = String(field.id);
        
        // Check filter_visibility object first (use pending if available), then fall back to settings
        const currentFilterVisibility = pendingFilterVisibility ?? appliedCustomView.filter_visibility ?? {};
        const isFilterVisibleFromView = currentFilterVisibility[filterKey] ||
                                       currentFilterVisibility[filterVisibilityKey1] ||
                                       currentFilterVisibility[filterVisibilityKey2] ||
                                       false;
        
        // Also check global settings as fallback
        const settingsObj = settings?.settings as Record<string, any> | undefined;
        const isFilterVisibleFromSettings = settingsObj?.[filterKey] || false;
        
        const isFilterVisible = isFilterVisibleFromView || isFilterVisibleFromSettings;
        
        if (!isFilterVisible) return null;
        
        // Get filter type from settings
        const filterTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX}${field.id}`;
        const filterType = settingsObj?.[filterTypeKey] || getDefaultFilterType(field.data_type);
        
        if (!field.id) return null; // Double check field.id exists
        
        // Get current filter value
        const currentFilter = filters.customFields?.[field.id];
        const currentFilterValue = currentFilter?.value;
        
        // Render filter based on type
        if (filterType === 'date-range') {
          return (
            <DateRangePicker
              key={`custom-field-${field.id}`}
              label={field.name}
              value={currentFilterValue || undefined}
              onChange={(range) => {
                if (range.start || range.end) {
                  updateFilter.customField(field.id!, 'date-range', range);
                } else {
                  updateFilter.customField(field.id!, 'date-range', null);
                }
              }}
            />
          );
        } else if (filterType === 'populated' || filterType === 'boolean') {
          const selectedIds = currentFilterValue ? [currentFilterValue] : [];
          return (
            <FilterDropDown
              key={`custom-field-${field.id}`}
              label={field.name}
              icon={<FeatherListFilter />}
              options={[
                { id: "populated", label: "Populated" },
                { id: "not-populated", label: "Not Populated" },
              ]}
              selectedIds={selectedIds}
              onSelectionChange={(ids) => {
                updateFilter.customField(field.id!, 'populated', ids.length > 0 ? ids[0] : null);
              }}
              multiSelect={false}
              showAllOption={true}
              allOptionLabel={`All ${field.name}`}
            />
          );
        } else if (filterType === 'multi-select' || filterType === 'single-select') {
          // Use the custom field values API to get actual values from documents
          return (
            <CustomFieldSelectFilter
              key={`custom-field-${field.id}`}
              fieldId={field.id!}
              fieldName={field.name}
              filterType={filterType}
              currentFilterValue={currentFilterValue}
              onSelectionChange={(ids) => {
                updateFilter.customField(field.id!, filterType, ids.length > 0 ? ids : null);
              }}
            />
          );
        } else {
          // For text, exact-match, numerical, range, etc. - render a text input filter
          // TODO: Implement text-based filters
          return null;
        }
      })}
      {/* <div className="flex grow shrink-0 basis-0 items-center justify-end gap-2">
        <Button
          variant="brand-primary"
          icon={<FeatherPlus />}
          onClick={onAddDocument}
        >
          Upload
        </Button>
      </div> */}
    </div>
  );
});

FilterBar.displayName = 'FilterBar';

// Component for custom field select filters that fetches values from API
function CustomFieldSelectFilter({
  fieldId,
  fieldName,
  filterType,
  currentFilterValue,
  onSelectionChange,
}: {
  fieldId: number;
  fieldName: string;
  filterType: string;
  currentFilterValue: any;
  onSelectionChange: (ids: (string | number)[]) => void;
}) {
  const { values, loading } = useCustomFieldValues(fieldId);
  
  // Convert API values to FilterOption format
  const fieldOptions = useMemo(() => {
    return values.map((val) => ({
      id: val.id,
      label: val.label,
      count: val.count,
    }));
  }, [values]);
  
  const selectedIds = Array.isArray(currentFilterValue) ? currentFilterValue : 
                     currentFilterValue ? [currentFilterValue] : [];
  
  return (
    <FilterDropDown
      label={fieldName}
      icon={<FeatherListFilter />}
      options={fieldOptions}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      multiSelect={filterType === 'multi-select'}
      showAllOption={true}
      allOptionLabel={`All ${fieldName}`}
    />
  );
}

