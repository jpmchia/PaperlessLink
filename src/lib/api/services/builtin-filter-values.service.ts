/**
 * Service for fetching built-in filter values with counts
 * 
 * Note: This service connects to the paperless-link-service (Go backend)
 * rather than the main Paperless Django API
 */

import { apiClient } from '../client';
import { FilterRule } from '@/app/data/filter-rule';

export interface BuiltinFilterValueOption {
  id: number | string;
  label: string;
  count: number;
}

export class BuiltinFilterValuesService {
  // Base URL for the paperless-link-service
  // This should be configured via environment variable
  // Default assumes it's running on the same host as the frontend
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_PAPERLESS_LINK_SERVICE_URL || 'http://localhost:8080';
    }
    return 'http://localhost:8080';
  }

  private get basePath(): string {
    return `${this.baseUrl}/api/builtin-filter-values`;
  }

  /**
   * Get filter values with counts for a built-in filter type
   * @param filterType - "correspondent", "document_type", "tag", "storage_path", "owner", "asn"
   * @param filterRules - Optional filter rules for context-aware filtering
   */
  async getFilterValues(
    filterType: string,
    filterRules?: FilterRule[]
  ): Promise<BuiltinFilterValueOption[]> {
    // Use absolute URL since this is a different service
    const url = `${this.basePath}/${filterType}/`;
    
    const body: any = {};
    if (filterRules && filterRules.length > 0) {
      body.filter_rules = filterRules;
    }

    const response = await apiClient.post<BuiltinFilterValueOption[]>(
      url,
      body
    );
    return response.data;
  }
}

