import React, { memo, useMemo, useCallback } from 'react';
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
import { buildCustomFieldQueries, combineCustomFieldQueries } from './customFieldQueryBuilder';

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
              selectOptions={field.extra_data?.select_options || []}
              allFilters={filters}
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
  selectOptions = [],
  onSelectionChange,
  allFilters,
}: {
  fieldId: number;
  fieldName: string;
  filterType: string;
  currentFilterValue: any;
  selectOptions?: Array<{ id: string; label: string }>;
  onSelectionChange: (ids: (string | number)[]) => void;
  allFilters?: FilterBarProps['filters'];
}) {
  // Convert filters to filter rules, excluding the current field
  const filterRules = useMemo(() => {
    if (!allFilters) return undefined;
    
    // Import filter rule conversion logic
    const rules: any[] = [];
    
    // Correspondent filter
    if (allFilters.correspondent.length > 0) {
      allFilters.correspondent.forEach(id => {
        rules.push({ rule_type: 1, value: id.toString() }); // FILTER_CORRESPONDENT = 1
      });
    }
    
    // Category/Document Type filter
    if (allFilters.category.length > 0) {
      allFilters.category.forEach(id => {
        rules.push({ rule_type: 2, value: id.toString() }); // FILTER_DOCUMENT_TYPE = 2
      });
    }
    
    // Tags filter
    if (allFilters.tags.length > 0) {
      allFilters.tags.forEach(id => {
        rules.push({ rule_type: 3, value: id.toString() }); // FILTER_HAS_TAGS_ANY = 3
      });
    }
    
    // Storage Path filter
    if (allFilters.storagePath.length > 0) {
      allFilters.storagePath.forEach(id => {
        rules.push({ rule_type: 4, value: id.toString() }); // FILTER_STORAGE_PATH = 4
      });
    }
    
    // Owner filter
    if (allFilters.owner.length > 0) {
      allFilters.owner.forEach(username => {
        rules.push({ rule_type: 5, value: username }); // FILTER_OWNER_ANY = 5
      });
    }
    
    // Date Range filter
    if (allFilters.dateRange) {
      if (allFilters.dateRange.start) {
        rules.push({ rule_type: 6, value: allFilters.dateRange.start.toISOString().split('T')[0] }); // FILTER_CREATED_AFTER = 6
      }
      if (allFilters.dateRange.end) {
        rules.push({ rule_type: 7, value: allFilters.dateRange.end.toISOString().split('T')[0] }); // FILTER_CREATED_BEFORE = 7
      }
    }
    
    // ASN filter
    if (allFilters.asn.length > 0) {
      allFilters.asn.forEach(id => {
        rules.push({ rule_type: 8, value: id.toString() }); // FILTER_ASN = 8
      });
    }
    
    // Status filter
    if (allFilters.status.length > 0 && allFilters.status.includes('active') && !allFilters.status.includes('archived')) {
      rules.push({ rule_type: 9, value: '1' }); // FILTER_IS_IN_INBOX = 9
    }
    
    // Custom field filters - exclude the current field, use shared utility function
    const customFieldQueries = buildCustomFieldQueries(allFilters.customFields, fieldId);
    const combinedQuery = combineCustomFieldQueries(customFieldQueries);
    
    if (combinedQuery) {
      const queryString = JSON.stringify(combinedQuery);
      rules.push({ rule_type: 42, value: queryString }); // FILTER_CUSTOM_FIELDS_QUERY = 42
    }
    
    // Debug logging
    if (rules.length > 0) {
      console.log(`[CustomFieldSelectFilter] Field ${fieldId} (${fieldName}): Building filter rules:`, {
        fieldId,
        fieldName,
        totalRules: rules.length,
        hasCustomFieldFilters: customFieldQueries.length > 0,
        rules,
      });
    }
    
    return rules.length > 0 ? rules : undefined;
  }, [allFilters, fieldId, fieldName]);
  
  const { values, loading } = useCustomFieldValues(fieldId, filterRules);
  
  // Create maps for lookup: ID -> label and label -> ID (for backwards compatibility)
  const selectOptionMap = useMemo(() => {
    const idToLabelMap = new Map<string, string>();
    const labelToIdMap = new Map<string, string>();
    
    if (selectOptions && Array.isArray(selectOptions)) {
      selectOptions
        .filter(opt => opt != null && opt !== undefined) // Filter out null/undefined
        .forEach(opt => {
          if (opt.id && opt.label) {
            const id = String(opt.id);
            const label = String(opt.label);
            idToLabelMap.set(id, label);
            labelToIdMap.set(label.toLowerCase(), id); // Case-insensitive lookup for backwards compatibility
          }
        });
    }
    
    return { idToLabel: idToLabelMap, labelToId: labelToIdMap };
  }, [selectOptions]);
  
  // Convert API values to FilterOption format
  // API returns select option IDs as labels, so we need to map them to actual labels
  const fieldOptions = useMemo(() => {
    if (!values || values.length === 0) {
      return [];
    }
    
    const options = values.map((val) => {
      // Special handling for blank option - use the ID directly
      if (val.id === '__blank__') {
        return {
          id: '__blank__',
          label: val.label || '(Blank)',
          count: val.count,
        };
      }
      
      // The API's "label" field actually contains the select option ID (or sometimes the old label value)
      // The API's "id" field is an internal value ID (like "val-4235291381520459507")
      const selectOptionIdOrLabel = String(val.label || val.id);
      
      // First, try to find by ID (new format - API returns select option ID in label field)
      let actualLabel = selectOptionMap.idToLabel.get(selectOptionIdOrLabel);
      let actualId = selectOptionIdOrLabel;
      
      // If not found by ID, try to find by label (API might return actual label value)
      if (!actualLabel) {
        const foundId = selectOptionMap.labelToId.get(selectOptionIdOrLabel.toLowerCase());
        if (foundId) {
          actualId = foundId;
          actualLabel = selectOptionMap.idToLabel.get(foundId) || selectOptionIdOrLabel;
        } else {
          // Still not found - might be an old value or missing option
          // Only log warning if we have select options defined (to avoid noise for dynamic fields)
          if (selectOptionMap.idToLabel.size > 0) {
            console.warn(`[CustomFieldSelectFilter] Field "${fieldName}" (${fieldId}): Could not find label for value "${selectOptionIdOrLabel}". Available options:`, 
              Array.from(selectOptionMap.idToLabel.entries()).map(([id, label]) => `${id} -> ${label}`)
            );
          }
          actualLabel = selectOptionIdOrLabel; // Use the value itself as the label
        }
      }
      
      // Use the select option ID as the filter ID (this is what's stored in filters)
      // This matches what's in the custom field's select_options
      return {
        id: actualId,
        label: actualLabel,
        count: val.count,
      };
    });
    
    return options;
  }, [values, selectOptionMap, fieldName, fieldId]);
  
  // Normalize selected IDs to strings to match the options
  const selectedIds = useMemo(() => {
    if (!currentFilterValue) {
      return [];
    }
    if (Array.isArray(currentFilterValue)) {
      return currentFilterValue.map(id => String(id));
    }
    return [String(currentFilterValue)];
  }, [currentFilterValue]);
  
  // Debug: Log when values don't match and show what's being displayed
  React.useEffect(() => {
    if (selectedIds.length > 0 && !loading) {
      const matchedOptions = selectedIds
        .map(id => {
          const opt = fieldOptions.find(opt => String(opt.id) === String(id));
          return { id, option: opt };
        });
      
      const unmatchedIds = matchedOptions.filter(m => !m.option).map(m => m.id);
      const matched = matchedOptions.filter(m => m.option);
      
      console.log(`[CustomFieldSelectFilter] Field "${fieldName}" (${fieldId}):`, {
        selectedIds,
        matched: matched.map(m => ({ id: m.id, label: m.option!.label })),
        unmatchedIds,
        availableOptions: fieldOptions.map(opt => ({ id: opt.id, label: opt.label })),
        currentFilterValue,
        valuesFromAPI: values,
      });
      
      if (unmatchedIds.length > 0) {
        console.warn(`[CustomFieldSelectFilter] Field "${fieldName}" (${fieldId}): Selected IDs not found in options:`, unmatchedIds);
      }
    }
  }, [selectedIds, fieldOptions, loading, fieldName, fieldId, currentFilterValue, values]);
  
  // Handle selection change - convert back to original format if needed
  const handleSelectionChange = useCallback((ids: (string | number)[]) => {
    // Convert string IDs back to the format expected by the filter
    // Keep as strings since API uses strings
    onSelectionChange(ids.map(id => String(id)));
  }, [onSelectionChange]);
  
  return (
    <FilterDropDown
      label={fieldName}
      icon={<FeatherListFilter />}
      options={fieldOptions}
      selectedIds={selectedIds}
      onSelectionChange={handleSelectionChange}
      multiSelect={filterType === 'multi-select'}
      showAllOption={true}
      allOptionLabel={`All ${fieldName}`}
    />
  );
}

