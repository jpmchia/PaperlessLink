import React, { memo, useMemo, useCallback } from 'react';
import { TextField } from "@/ui/components/TextField";
import { DateRangePicker } from "@/ui/components/DateRangePicker";
import { FilterDropDown } from "@/ui/components/FilterDropDown";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { FeatherSearch, FeatherTag, FeatherUser, FeatherFolder, FeatherUsers, FeatherListFilter, FeatherHash, FeatherChevronRight, FeatherChevronLeft, FeatherDownload, FeatherPlus, FeatherX, FeatherCalendar } from "@subframe/core";
import { useDocumentFilters, FilterVisibility } from './useDocumentFilters';
import { CustomField } from "@/app/data/custom-field";
import { CustomView } from "@/app/data/custom-view";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { getDefaultFilterType } from "@/ui/components/settings/customFieldHelpers";
import { UiSettings } from "@/app/data/ui-settings";
import { useCustomFieldValues } from "@/lib/api/hooks/use-custom-field-values";
import { useBuiltinFilterValues } from "@/lib/api/hooks/use-builtin-filter-values";
import { buildCustomFieldQueries, combineCustomFieldQueries } from './customFieldQueryBuilder';
import { FilterRule } from "@/app/data/filter-rule";
import { FILTER_CORRESPONDENT, FILTER_DOCUMENT_TYPE, FILTER_HAS_TAGS_ANY, FILTER_STORAGE_PATH, FILTER_OWNER_ANY, FILTER_ASN, FILTER_CREATED_AFTER, FILTER_CREATED_BEFORE, FILTER_IS_IN_INBOX, FILTER_CUSTOM_FIELDS_QUERY } from "@/app/data/filter-rule-type";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterVisibility: FilterVisibility & Record<string, boolean>;
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
    // Dynamic filters for built-in fields (date ranges by field id)
    builtInDateRanges?: Record<string, { start: Date | null; end: Date | null } | null>;
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
    builtInField?: (fieldId: string, filterType: string, value: any) => void;
  };
  documentTypes: Array<{ id?: number; name?: string }>;
  correspondents: Array<{ id?: number; name?: string }>;
  tags: Array<{ id?: number; name?: string }>;
  customFields?: CustomField[];
  appliedCustomView?: CustomView | null;
  settings?: UiSettings | null;
  pendingFilterVisibility?: Record<string, boolean> | null;
  // New props for dynamic rendering
  columnOrder?: string[];
  filterTypes?: Record<string, string>;
  onAddDocument: () => void;
  filterBarRef?: React.RefObject<HTMLDivElement>;
  totalCount?: number;
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
  columnOrder = [],
  filterTypes = {},
  onAddDocument,
  filterBarRef,
  totalCount,
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

  // Helper function to convert filters to filter rules, excluding a specific filter type
  const filtersToFilterRules = useCallback((excludeRuleType?: number): FilterRule[] => {
    const rules: FilterRule[] = [];

    // Correspondent filter
    if (excludeRuleType !== FILTER_CORRESPONDENT && filters.correspondent.length > 0) {
      filters.correspondent.forEach(id => {
        rules.push({ rule_type: FILTER_CORRESPONDENT, value: id.toString() });
      });
    }

    // Category/Document Type filter
    if (excludeRuleType !== FILTER_DOCUMENT_TYPE && filters.category.length > 0) {
      filters.category.forEach(id => {
        rules.push({ rule_type: FILTER_DOCUMENT_TYPE, value: id.toString() });
      });
    }

    // Tags filter
    if (excludeRuleType !== FILTER_HAS_TAGS_ANY && filters.tags.length > 0) {
      filters.tags.forEach(id => {
        rules.push({ rule_type: FILTER_HAS_TAGS_ANY, value: id.toString() });
      });
    }

    // Storage Path filter
    if (excludeRuleType !== FILTER_STORAGE_PATH && filters.storagePath.length > 0) {
      filters.storagePath.forEach(id => {
        rules.push({ rule_type: FILTER_STORAGE_PATH, value: id.toString() });
      });
    }

    // Owner filter
    if (excludeRuleType !== FILTER_OWNER_ANY && filters.owner.length > 0) {
      filters.owner.forEach(id => {
        rules.push({ rule_type: FILTER_OWNER_ANY, value: id.toString() });
      });
    }

    // ASN filter
    if (excludeRuleType !== FILTER_ASN && filters.asn.length > 0) {
      filters.asn.forEach(id => {
        rules.push({ rule_type: FILTER_ASN, value: id.toString() });
      });
    }

    // Date Range filter
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        rules.push({ rule_type: FILTER_CREATED_AFTER, value: filters.dateRange.start.toISOString().split('T')[0] });
      }
      if (filters.dateRange.end) {
        rules.push({ rule_type: FILTER_CREATED_BEFORE, value: filters.dateRange.end.toISOString().split('T')[0] });
      }
    }

    // Status filter
    if (filters.status.length > 0 && filters.status.includes('active') && !filters.status.includes('archived')) {
      rules.push({ rule_type: FILTER_IS_IN_INBOX, value: '1' });
    }

    // Custom field filters
    const customFieldQueries = buildCustomFieldQueries(filters.customFields);
    const combinedQuery = combineCustomFieldQueries(customFieldQueries);
    if (combinedQuery) {
      const queryString = JSON.stringify(combinedQuery);
      rules.push({ rule_type: FILTER_CUSTOM_FIELDS_QUERY, value: queryString });
    }

    return rules;
  }, [filters]);

  // Get context-aware filter values for correspondents
  const correspondentFilterRules = useMemo(() => filtersToFilterRules(FILTER_CORRESPONDENT), [filtersToFilterRules]);
  const { values: correspondentValuesFromAPI } = useBuiltinFilterValues(
    filterVisibility.correspondent ? 'correspondent' : null,
    correspondentFilterRules.length > 0 ? correspondentFilterRules : undefined
  );

  // Merge API values with static options, prioritizing API values (they have counts and are context-aware)
  const correspondentOptionsWithCounts = useMemo(() => {
    if (correspondentValuesFromAPI.length > 0) {
      // Use API values (they have counts and are context-aware)
      return correspondentValuesFromAPI.map(val => ({
        id: val.id,
        label: val.label,
        count: val.count,
      }));
    }
    // Fallback to static options (no counts, not context-aware)
    return correspondentOptions.map(opt => ({ ...opt, count: undefined }));
  }, [correspondentValuesFromAPI, correspondentOptions]);

  // Get context-aware filter values for document types
  const documentTypeFilterRules = useMemo(() => filtersToFilterRules(FILTER_DOCUMENT_TYPE), [filtersToFilterRules]);
  const { values: documentTypeValuesFromAPI } = useBuiltinFilterValues(
    filterVisibility.category ? 'document_type' : null,
    documentTypeFilterRules.length > 0 ? documentTypeFilterRules : undefined
  );

  const categoryOptionsWithCounts = useMemo(() => {
    if (documentTypeValuesFromAPI.length > 0) {
      return documentTypeValuesFromAPI.map(val => ({
        id: val.id,
        label: val.label,
        count: val.count,
      }));
    }
    return categoryOptions.map(opt => ({ ...opt, count: undefined }));
  }, [documentTypeValuesFromAPI, categoryOptions]);

  // Get context-aware filter values for tags
  const tagFilterRules = useMemo(() => filtersToFilterRules(FILTER_HAS_TAGS_ANY), [filtersToFilterRules]);
  const { values: tagValuesFromAPI } = useBuiltinFilterValues(
    filterVisibility.tags ? 'tag' : null,
    tagFilterRules.length > 0 ? tagFilterRules : undefined
  );

  const tagOptionsWithCounts = useMemo(() => {
    if (tagValuesFromAPI.length > 0) {
      return tagValuesFromAPI.map(val => ({
        id: val.id,
        label: val.label,
        count: val.count,
      }));
    }
    return tagOptions.map(opt => ({ ...opt, count: undefined }));
  }, [tagValuesFromAPI, tagOptions]);

  // Get context-aware filter values for storage paths
  const storagePathFilterRules = useMemo(() => filtersToFilterRules(FILTER_STORAGE_PATH), [filtersToFilterRules]);
  const { values: storagePathValuesFromAPI } = useBuiltinFilterValues(
    filterVisibility.storagePath ? 'storage_path' : null,
    storagePathFilterRules.length > 0 ? storagePathFilterRules : undefined
  );

  const storagePathOptionsWithCounts = useMemo(() => {
    if (storagePathValuesFromAPI.length > 0) {
      return storagePathValuesFromAPI.map(val => ({
        id: val.id,
        label: val.label,
        count: val.count,
      }));
    }
    return []; // No static fallback for storage paths
  }, [storagePathValuesFromAPI]);

  // Get context-aware filter values for owners
  const ownerFilterRules = useMemo(() => filtersToFilterRules(FILTER_OWNER_ANY), [filtersToFilterRules]);
  const { values: ownerValuesFromAPI } = useBuiltinFilterValues(
    filterVisibility.owner ? 'owner' : null,
    ownerFilterRules.length > 0 ? ownerFilterRules : undefined
  );

  const ownerOptionsWithCounts = useMemo(() => {
    if (ownerValuesFromAPI.length > 0) {
      return ownerValuesFromAPI.map(val => ({
        id: val.id,
        label: val.label,
        count: val.count,
      }));
    }
    // Fallback to static "Me" option if available
    return [{ id: "me", label: "Me", count: undefined }];
  }, [ownerValuesFromAPI]);

  // Get context-aware filter values for ASN
  const asnFilterRules = useMemo(() => filtersToFilterRules(FILTER_ASN), [filtersToFilterRules]);
  const { values: asnValuesFromAPI } = useBuiltinFilterValues(
    filterVisibility.asn ? 'asn' : null,
    asnFilterRules.length > 0 ? asnFilterRules : undefined
  );

  const asnOptionsWithCounts = useMemo(() => {
    if (asnValuesFromAPI.length > 0) {
      return asnValuesFromAPI.map(val => ({
        id: val.id,
        label: String(val.label), // ASN is a number, convert to string for consistency
        count: val.count,
      }));
    }
    return []; // No static fallback for ASN
  }, [asnValuesFromAPI]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    if (searchQuery.trim()) return true;
    if (filters.dateRange?.start || filters.dateRange?.end) return true;
    if (filters.category.length > 0) return true;
    if (filters.correspondent.length > 0) return true;
    if (filters.tags.length > 0) return true;
    if (filters.storagePath.length > 0) return true;
    if (filters.owner.length > 0) return true;
    if (filters.status.length > 0) return true;
    if (filters.asn.length > 0) return true;
    if (Object.keys(filters.customFields || {}).length > 0) {
      // Check if any custom field has a value
      return Object.values(filters.customFields || {}).some(
        field => field.value !== null && field.value !== undefined &&
          (Array.isArray(field.value) ? field.value.length > 0 : true)
      );
    }
    return false;
  }, [searchQuery, filters]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    onSearchChange('');
    updateFilter.dateRange(null);
    updateFilter.category([]);
    updateFilter.correspondent([]);
    updateFilter.tags([]);
    updateFilter.storagePath([]);
    updateFilter.owner([]);
    updateFilter.status([]);
    updateFilter.asn([]);
    // Clear all custom field filters
    Object.keys(filters.customFields || {}).forEach(fieldId => {
      updateFilter.customField(parseInt(fieldId), '', null);
    });
  }, [onSearchChange, updateFilter, filters.customFields]);

  // Generate human-readable filter summary
  const filterSummary = useMemo(() => {
    const parts: string[] = [];

    if (searchQuery.trim()) {
      parts.push(`search: "${searchQuery}"`);
    }

    if (filters.dateRange?.start || filters.dateRange?.end) {
      const start = filters.dateRange.start?.toLocaleDateString() || '';
      const end = filters.dateRange.end?.toLocaleDateString() || '';
      if (start && end) {
        parts.push(`Created Date: ${start} - ${end}`);
      } else if (start) {
        parts.push(`Created Date: from ${start}`);
      } else if (end) {
        parts.push(`Created Date: until ${end}`);
      }
    }

    if (filters.category.length > 0) {
      const names = filters.category
        .map(id => categoryOptions.find(opt => opt.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      if (names) parts.push(`Document type: ${names}`);
    }

    if (filters.correspondent.length > 0) {
      const names = filters.correspondent
        .map(id => correspondentOptions.find(opt => opt.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      if (names) parts.push(`Correspondent: ${names}`);
    }

    if (filters.tags.length > 0) {
      const names = filters.tags
        .map(id => tagOptions.find(opt => opt.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      if (names) parts.push(`Tags: ${names}`);
    }

    if (filters.storagePath.length > 0) {
      parts.push(`Storage Path: ${filters.storagePath.length} selected`);
    }

    if (filters.owner.length > 0) {
      parts.push(`Owner: ${filters.owner.join(', ')}`);
    }

    if (filters.status.length > 0) {
      parts.push(`Status: ${filters.status.join(', ')}`);
    }

    if (filters.asn.length > 0) {
      parts.push(`ASN: ${filters.asn.join(', ')}`);
    }

    // Custom field filters
    Object.entries(filters.customFields || {}).forEach(([fieldIdStr, fieldFilter]) => {
      if (!fieldFilter.value) return;

      const fieldId = parseInt(fieldIdStr);
      const field = customFields.find(f => f.id === fieldId);
      if (!field) return;

      const filterType = fieldFilter.type;
      let valueText = '';

      if (filterType === 'date-range' && fieldFilter.value) {
        const range = fieldFilter.value as { start?: Date | null; end?: Date | null };
        const start = range.start?.toLocaleDateString() || '';
        const end = range.end?.toLocaleDateString() || '';
        if (start && end) {
          valueText = `${start} - ${end}`;
        } else if (start) {
          valueText = `from ${start}`;
        } else if (end) {
          valueText = `until ${end}`;
        }
      } else if (filterType === 'populated' || filterType === 'boolean') {
        valueText = fieldFilter.value === 'populated' ? 'Populated' : 'Not Populated';
      } else if (filterType === 'multi-select' || filterType === 'single-select') {
        const values = Array.isArray(fieldFilter.value) ? fieldFilter.value : [fieldFilter.value];
        const selectOptions = field.extra_data?.select_options || [];
        const labels = values.map(val => {
          if (val === '__blank__') return '(Blank)';
          const option = selectOptions.find(opt => opt && String(opt.id) === String(val));
          return option?.label || String(val);
        });
        valueText = labels.join(', ');
      }

      if (valueText) {
        parts.push(`${field.name}: ${valueText}`);
      }
    });

    const summaryText = parts.length > 0 ? parts.join(' • ') : 'No filters applied';
    const countText = totalCount !== undefined ? ` •  ${totalCount.toLocaleString()} ${totalCount === 1 ? 'result' : 'results'}` : '';

    return summaryText + countText;
  }, [searchQuery, filters, categoryOptions, correspondentOptions, tagOptions, customFields, totalCount]);

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
      {/* Dynamic Filter Rendering - uses columnOrder if available, otherwise falls back to built-in order */}
      {(() => {
        // Define built-in filter configurations
        const builtInFilterConfigs: Record<string, {
          label: string;
          icon: React.ReactNode;
          options: any[];
          selectedIds: any;
          onSelectionChange: (ids: any[]) => void;
          visibilityKey: keyof FilterVisibility;
          isDateRange?: boolean;
          defaultFilterType?: string;
        }> = {
          'created': {
            label: 'Created Date',
            icon: <FeatherCalendar />,
            options: [],
            selectedIds: filters.dateRange,
            onSelectionChange: () => { },
            visibilityKey: 'dateRange',
            isDateRange: true,
            defaultFilterType: 'date-range',
          },
          'added': {
            label: 'Added Date',
            icon: <FeatherCalendar />,
            options: [],
            selectedIds: null, // TODO: separate added date filter
            onSelectionChange: () => { },
            visibilityKey: 'dateRange',
            isDateRange: true,
            defaultFilterType: 'date-range',
          },
          'category': {
            label: 'Document type',
            icon: <FeatherTag />,
            options: categoryOptionsWithCounts,
            selectedIds: filters.category,
            onSelectionChange: (ids) => updateFilter.category(ids as number[]),
            visibilityKey: 'category',
            defaultFilterType: 'multi-select',
          },
          'correspondent': {
            label: 'Correspondent',
            icon: <FeatherUser />,
            options: correspondentOptionsWithCounts,
            selectedIds: filters.correspondent,
            onSelectionChange: (ids) => updateFilter.correspondent(ids as number[]),
            visibilityKey: 'correspondent',
            defaultFilterType: 'multi-select',
          },
          'tags': {
            label: 'Tags',
            icon: <FeatherTag />,
            options: tagOptionsWithCounts,
            selectedIds: filters.tags,
            onSelectionChange: (ids) => updateFilter.tags(ids as number[]),
            visibilityKey: 'tags',
            defaultFilterType: 'multi-select',
          },
          'storagePath': {
            label: 'Storage Path',
            icon: <FeatherFolder />,
            options: storagePathOptionsWithCounts,
            selectedIds: filters.storagePath,
            onSelectionChange: (ids) => updateFilter.storagePath(ids as number[]),
            visibilityKey: 'storagePath',
            defaultFilterType: 'multi-select',
          },
          'storage_path': {
            label: 'Storage Path',
            icon: <FeatherFolder />,
            options: storagePathOptionsWithCounts,
            selectedIds: filters.storagePath,
            onSelectionChange: (ids) => updateFilter.storagePath(ids as number[]),
            visibilityKey: 'storagePath',
            defaultFilterType: 'multi-select',
          },
          'owner': {
            label: 'Owner',
            icon: <FeatherUsers />,
            options: ownerOptionsWithCounts,
            selectedIds: filters.owner,
            onSelectionChange: (ids) => updateFilter.owner(ids as string[]),
            visibilityKey: 'owner',
            defaultFilterType: 'multi-select',
          },
          'asn': {
            label: 'ASN',
            icon: <FeatherHash />,
            options: asnOptionsWithCounts,
            selectedIds: filters.asn,
            onSelectionChange: (ids) => updateFilter.asn(ids as number[]),
            visibilityKey: 'asn',
            defaultFilterType: 'multi-select',
          },
        };

        // Default order for built-in filters when no columnOrder provided
        const defaultBuiltInOrder = ['created', 'category', 'correspondent', 'tags', 'storagePath', 'owner', 'asn'];

        // Use columnOrder if available, otherwise use default order
        const effectiveOrder = columnOrder && columnOrder.length > 0
          ? columnOrder
          : defaultBuiltInOrder;

        return effectiveOrder.map((fieldId) => {
          // Check if this is a custom field (starts with customField_ or is a number)
          const isCustomField = typeof fieldId === 'string' &&
            (fieldId.startsWith('customField_') || /^\d+$/.test(fieldId));

          if (isCustomField) {
            // Custom fields are rendered separately below
            return null;
          }

          // Check if this is a built-in field with a filter config
          const config = builtInFilterConfigs[fieldId as string];
          if (!config) return null;

          // Check filter visibility - prioritize field-specific visibility (from view settings)
          // Only fall back to legacy visibilityKey if fieldId is not explicitly defined
          const filterVisibilityRecord = filterVisibility as Record<string, boolean>;
          const isVisibleByFieldId = filterVisibilityRecord[fieldId];
          const isVisibleByKey = filterVisibility[config.visibilityKey];
          // Use fieldId if explicitly set, otherwise fall back to legacy key
          const isVisible = isVisibleByFieldId !== undefined ? isVisibleByFieldId : isVisibleByKey;

          if (!isVisible) return null;

          // Get filter type from filterTypes prop or use default
          const filterType = filterTypes?.[fieldId] || config.defaultFilterType || 'multi-select';

          // Render based on filter type
          if (filterType === 'date-range' && config.isDateRange) {
            return (
              <DateRangePicker
                key={`filter-${fieldId}`}
                label={config.label}
                value={filters.dateRange || undefined}
                onChange={(range) => updateFilter.dateRange(range.start || range.end ? range : null)}
              />
            );
          } else {
            // Default to dropdown/multi-select
            return (
              <FilterDropDown
                key={`filter-${fieldId}`}
                label={config.label}
                icon={config.icon}
                options={config.options}
                selectedIds={config.selectedIds}
                onSelectionChange={config.onSelectionChange}
                multiSelect={true}
                showAllOption={true}
                allOptionLabel={`All ${config.label}`}
              />
            );
          }
        }).filter(Boolean);
      })()}

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

        // When a view is active, use view settings exclusively. Only use global settings if no view is active.
        const isFilterVisible = appliedCustomView
          ? isFilterVisibleFromView
          : isFilterVisibleFromSettings;

        if (!isFilterVisible) return null;

        // Get filter type from view's filter_types first, then fall back to global settings
        const filterTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX}${field.id}`;
        const filterTypeFromView = appliedCustomView?.filter_types?.[`customField_${field.id}`] ||
          appliedCustomView?.filter_types?.[String(field.id)];
        const filterType = filterTypeFromView || settingsObj?.[filterTypeKey] || getDefaultFilterType(field.data_type);

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

      {/* Vertical Separator after custom field filters */}
      {appliedCustomView && customFields.length > 0 && (
        <div className="h-6 w-px bg-neutral-border" />
      )}

      {/* Clear all filters button */}
      {hasActiveFilters && (
        <Button
          variant="neutral-tertiary"
          size="small"
          icon={<FeatherX />}
          onClick={handleClearAllFilters}
        >
          Clear all filters
        </Button>
      )}

      {/* Vertical Separator after clear button */}
      {hasActiveFilters && (
        <div className="h-6 w-px bg-neutral-border" />
      )}

      {/* Filter summary text */}
      {hasActiveFilters && (
        <span className="text-body text-neutral-500 text-xs">
          {filterSummary}
        </span>
      )}

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

