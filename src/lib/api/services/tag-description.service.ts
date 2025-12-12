/**
 * TagDescriptionService for managing tag descriptions
 * Handles CRUD operations for tag descriptions
 * 
 * Note: This service connects to the paperless-link-service (port 8080),
 * not the main Paperless API (port 8000)
 */

import { apiClient } from '../client'

export interface TagDescription {
  id?: number
  tag_id: number
  description?: string
  created?: string
  modified?: string
}

export class TagDescriptionService {
  // Base URL for the paperless-link-service
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_PAPERLESS_LINK_SERVICE_URL || 'http://localhost:8080'
    }
    return 'http://localhost:8080'
  }

  private get basePath(): string {
    return `${this.baseUrl}/api/tag-descriptions/`
  }

  async get(tagId: number): Promise<TagDescription> {
    const response = await apiClient.get<TagDescription>(`${this.basePath}${tagId}/`)
    return response.data
  }

  async set(tagId: number, description: Partial<TagDescription>): Promise<TagDescription> {
    const response = await apiClient.put<TagDescription>(`${this.basePath}${tagId}/`, {
      tag_id: tagId,
      ...description,
    })
    return response.data
  }

  async delete(tagId: number): Promise<void> {
    await apiClient.delete(`${this.basePath}${tagId}/`)
  }
}






