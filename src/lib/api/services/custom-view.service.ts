/**
 * CustomViewService for managing custom document views
 * Handles both user-only and global (shared) custom views
 * 
 * Note: This service connects to the paperless-link-service (port 8080),
 * not the main Paperless API (port 8000)
 */

import { CustomView } from '@/app/data/custom-view'
import { Results } from '@/app/data/results'
import { apiClient } from '../client'

export class CustomViewService {
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
    return `${this.baseUrl}/api/custom_views`;
  }

  /**
   * List all custom views (both user and global)
   */
  async list(params?: { user_only?: boolean; global_only?: boolean }): Promise<Results<CustomView>> {
    const queryParams: Record<string, any> = {};
    if (params?.user_only) {
      queryParams.user_only = true;
    }
    if (params?.global_only) {
      queryParams.global_only = true;
    }
    // Use absolute URL since this is a different service
    const response = await apiClient.get<Results<CustomView>>(this.basePath, queryParams);
    return response.data;
  }

  /**
   * Get all custom views (both user and global)
   */
  async getAllViews(): Promise<CustomView[]> {
    const results = await this.list()
    return results.results || []
  }

  /**
   * Get only user's custom views
   */
  async getUserViews(): Promise<CustomView[]> {
    const results = await this.list({ user_only: true })
    return results.results || []
  }

  /**
   * Get only global (shared) custom views
   */
  async getGlobalViews(): Promise<CustomView[]> {
    const results = await this.list({ global_only: true })
    return results.results || []
  }

  /**
   * Get a single custom view by ID
   */
  async get(id: number): Promise<CustomView> {
    const url = `${this.basePath}/${id}/`;
    const response = await apiClient.get<CustomView>(url);
    return response.data;
  }

  /**
   * Create a new custom view
   */
  async create(data: Omit<CustomView, 'id'>): Promise<CustomView> {
    const response = await apiClient.post<CustomView>(`${this.basePath}/`, data);
    return response.data;
  }

  /**
   * Update an existing custom view
   */
  async update(id: number, data: Partial<CustomView>): Promise<CustomView> {
    const url = `${this.basePath}/${id}/`;
    const response = await apiClient.patch<CustomView>(url, data);
    return response.data;
  }

  /**
   * Delete a custom view
   */
  async delete(id: number): Promise<void> {
    const url = `${this.basePath}/${id}/`;
    await apiClient.delete(url);
  }
}

