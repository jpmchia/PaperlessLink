import { useState, useEffect, useMemo } from 'react';
import { useSettings } from '@/lib/api/hooks';
import { SETTINGS_KEYS } from '@/app/data/ui-settings';

export interface DocumentFilters {
  dateRange: { start: Date | null; end: Date | null } | null;
  category: number[];
  correspondent: number[];
  tags: number[];
  storagePath: number[];
  owner: string[];
  status: string[];
  asn: number[];
  // Custom field filters: fieldId -> filter value
  customFields: Record<number, {
    type: string; // filter type: 'populated', 'date-range', 'multi-select', etc.
    value: any; // filter value (depends on type)
  }>;
}

export interface FilterVisibility {
  dateRange: boolean;
  category: boolean;
  correspondent: boolean;
  tags: boolean;
  storagePath: boolean;
  owner: boolean;
  status: boolean;
  asn: boolean;
  // Allow for additional dynamic keys (custom field filters, individual date fields like 'created', 'added')
  [key: string]: boolean;
}

const DEFAULT_FILTER_VISIBILITY: FilterVisibility = {
  dateRange: true,
  category: true,
  correspondent: false,
  tags: false,
  storagePath: false,
  owner: true,
  status: true,
  asn: false,
};

/**
 * Hook to manage document filter state and visibility
 */
export function useDocumentFilters() {
  const { settings } = useSettings();

  // Filter visibility state
  const [filterVisibility, setFilterVisibility] = useState<FilterVisibility>(DEFAULT_FILTER_VISIBILITY);

  // Filter selection state
  const [filters, setFilters] = useState<DocumentFilters>({
    dateRange: null,
    category: [],
    correspondent: [],
    tags: [],
    storagePath: [],
    owner: [],
    status: [],
    asn: [],
    customFields: {},
  });

  // Load filter visibility from settings
  useEffect(() => {
    if (settings?.settings) {
      const settingsObj = settings.settings as Record<string, any>;
      setFilterVisibility({
        dateRange: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}created`] ?? DEFAULT_FILTER_VISIBILITY.dateRange,
        category: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}category`] ?? DEFAULT_FILTER_VISIBILITY.category,
        correspondent: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}correspondent`] ?? DEFAULT_FILTER_VISIBILITY.correspondent,
        tags: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}tags`] ?? DEFAULT_FILTER_VISIBILITY.tags,
        storagePath: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}storagePath`] ?? DEFAULT_FILTER_VISIBILITY.storagePath,
        owner: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}owner`] ?? DEFAULT_FILTER_VISIBILITY.owner,
        status: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}status`] ?? DEFAULT_FILTER_VISIBILITY.status,
        asn: settingsObj[`${SETTINGS_KEYS.BUILT_IN_FIELD_FILTER_PREFIX}asn`] ?? DEFAULT_FILTER_VISIBILITY.asn,
      });
    }
  }, [settings]);

  // Update individual filter
  const updateFilter = useMemo(() => ({
    dateRange: (value: { start: Date | null; end: Date | null } | null) => {
      setFilters(prev => ({ ...prev, dateRange: value }));
    },
    category: (value: number[]) => {
      setFilters(prev => ({ ...prev, category: value }));
    },
    correspondent: (value: number[]) => {
      setFilters(prev => ({ ...prev, correspondent: value }));
    },
    tags: (value: number[]) => {
      setFilters(prev => ({ ...prev, tags: value }));
    },
    storagePath: (value: number[]) => {
      setFilters(prev => ({ ...prev, storagePath: value }));
    },
    owner: (value: string[]) => {
      setFilters(prev => ({ ...prev, owner: value }));
    },
    status: (value: string[]) => {
      setFilters(prev => ({ ...prev, status: value }));
    },
    asn: (value: number[]) => {
      setFilters(prev => ({ ...prev, asn: value }));
    },
    customField: (fieldId: number, filterType: string, value: any) => {
      setFilters(prev => {
        const newCustomFields = { ...prev.customFields };
        if (value === null || value === undefined || (Array.isArray(value) && value.length === 0)) {
          // Remove filter if value is empty
          delete newCustomFields[fieldId];
        } else {
          newCustomFields[fieldId] = { type: filterType, value };
        }
        return { ...prev, customFields: newCustomFields };
      });
    },
  }), []);

  // Update filter visibility
  const updateFilterVisibility = useMemo(() => ({
    dateRange: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, dateRange: visible }));
    },
    category: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, category: visible }));
    },
    correspondent: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, correspondent: visible }));
    },
    tags: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, tags: visible }));
    },
    storagePath: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, storagePath: visible }));
    },
    owner: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, owner: visible }));
    },
    status: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, status: visible }));
    },
    asn: (visible: boolean) => {
      setFilterVisibility(prev => ({ ...prev, asn: visible }));
    },
  }), []);

  return {
    filters,
    filterVisibility,
    updateFilter,
    updateFilterVisibility,
  };
}

