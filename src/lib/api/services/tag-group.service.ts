/**
 * TagGroupService for managing tag groups
 * Handles CRUD operations for tag groups and tag-to-group memberships
 * 
 * Note: This service connects to the paperless-link-service (port 8080),
 * not the main Paperless API (port 8000)
 */

import { apiClient } from '../client'

export interface TagGroup {
  id?: number
  name: string
  description?: string
  tag_ids?: number[]
  created?: string
  modified?: string
}

export interface TagGroupListResponse {
  count: number
  results: TagGroup[]
}

export class TagGroupService {
  // Base URL for the paperless-link-service
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      return process.env.NEXT_PUBLIC_PAPERLESS_LINK_SERVICE_URL || 'http://localhost:8080'
    }
    return 'http://localhost:8080'
  }

  private get basePath(): string {
    return `${this.baseUrl}/api/tag-groups/`
  }

  async list(): Promise<TagGroup[]> {
    const response = await apiClient.get<TagGroupListResponse>(this.basePath)
    return response.data.results
  }

  async get(id: number): Promise<TagGroup> {
    const response = await apiClient.get<TagGroup>(`${this.basePath}${id}/`)
    return response.data
  }

  async create(group: Partial<TagGroup>): Promise<TagGroup> {
    const response = await apiClient.post<TagGroup>(this.basePath, group)
    return response.data
  }

  async update(id: number, group: Partial<TagGroup>): Promise<TagGroup> {
    const response = await apiClient.put<TagGroup>(`${this.basePath}${id}/`, group)
    return response.data
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.basePath}${id}/`)
  }
}






