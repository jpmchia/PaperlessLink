/**
 * CustomViewService for managing custom document views
 * Handles both user-only and global (shared) custom views
 */

import { CustomView } from '@/app/data/custom-view'
import { BaseService } from '../base-service'

export class CustomViewService extends BaseService<CustomView> {
  constructor() {
    super('custom_views')  // API endpoint: /api/custom_views/
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
    const results = await this.list({ extraParams: { user_only: true } })
    return results.results || []
  }

  /**
   * Get only global (shared) custom views
   */
  async getGlobalViews(): Promise<CustomView[]> {
    const results = await this.list({ extraParams: { global_only: true } })
    return results.results || []
  }

  /**
   * Create a new custom view
   */
  async create(data: Omit<CustomView, 'id'>): Promise<CustomView> {
    return super.create(data)
  }

  /**
   * Update an existing custom view
   */
  async update(id: number, data: Partial<CustomView>): Promise<CustomView> {
    return super.update(id, data)
  }

  /**
   * Delete a custom view
   */
  async delete(id: number): Promise<void> {
    return super.delete(id)
  }
}

