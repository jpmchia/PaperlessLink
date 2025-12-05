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
  });

  // Load filter visibility from settings
  useEffect(() => {
    if (settings?.settings) {
      const settingsObj = settings.settings as Record<string, any>;
      setFilterVisibility({
        dateRange: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_DATE_RANGE] ?? DEFAULT_FILTER_VISIBILITY.dateRange,
        category: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_CATEGORY] ?? DEFAULT_FILTER_VISIBILITY.category,
        correspondent: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_CORRESPONDENT] ?? DEFAULT_FILTER_VISIBILITY.correspondent,
        tags: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_TAGS] ?? DEFAULT_FILTER_VISIBILITY.tags,
        storagePath: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_STORAGE_PATH] ?? DEFAULT_FILTER_VISIBILITY.storagePath,
        owner: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_OWNER] ?? DEFAULT_FILTER_VISIBILITY.owner,
        status: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_STATUS] ?? DEFAULT_FILTER_VISIBILITY.status,
        asn: settingsObj[SETTINGS_KEYS.DOCUMENTS_FILTER_ASN] ?? DEFAULT_FILTER_VISIBILITY.asn,
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
  }), []);

  return {
    filters,
    filterVisibility,
    updateFilter,
  };
}

