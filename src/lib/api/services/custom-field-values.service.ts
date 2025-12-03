/**
 * Service for fetching aggregated custom field values
 * Used for dynamic list fields like Named Entities, Topics, etc.
 * 
 * Note: This service connects to the paperless-link-service (Go backend)
 * rather than the main Paperless Django API
 */

import { apiClient } from '../client';

export interface CustomFieldValueOption {
  id: string;
  label: string;
  count: number;
}

export interface CustomFieldValuesResponse {
  field_id: number;
  field_name: string;
  values: CustomFieldValueOption[];
  total_documents: number;
}

export class CustomFieldValuesService {
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
    return `${this.baseUrl}/api/custom-field-values`;
  }

  /**
   * Get all unique values for a specific custom field across all documents
   * This aggregates values from all CustomFieldInstance records for the given field
   */
  async getFieldValues(fieldId: number): Promise<CustomFieldValuesResponse> {
    // Use absolute URL since this is a different service
    const url = `${this.basePath}/${fieldId}/`;
    const response = await apiClient.get<CustomFieldValuesResponse>(url);
    return response.data;
  }

  /**
   * Search for values matching a query string
   */
  async searchFieldValues(
    fieldId: number,
    query: string
  ): Promise<CustomFieldValueOption[]> {
    // Use absolute URL since this is a different service
    const url = `${this.basePath}/${fieldId}/search/`;
    const response = await apiClient.get<CustomFieldValueOption[]>(url, { q: query });
    return response.data;
  }

  /**
   * Get value counts (for filter display)
   */
  async getValueCounts(
    fieldId: number,
    filterRules?: any[]
  ): Promise<CustomFieldValueOption[]> {
    // Use absolute URL since this is a different service
    const url = `${this.basePath}/${fieldId}/counts/`;
    const response = await apiClient.post<CustomFieldValueOption[]>(
      url,
      { filter_rules: filterRules }
    );
    return response.data;
  }
}

