/**
 * Abstract base service for REST operations
 * Replaces Angular's AbstractPaperlessService
 */

import { ObjectWithId } from '../../app/data/object-with-id'
import { Results } from '../../app/data/results'
import { apiClient } from './client'

export interface ListParams {
  page?: number
  pageSize?: number
  sortField?: string
  sortReverse?: boolean
  extraParams?: Record<string, any>
}

export abstract class BaseService<T extends ObjectWithId> {
  protected resourceName: string

  constructor(resourceName: string) {
    this.resourceName = resourceName
  }

  protected getResourceUrl(id?: number | null, action?: string | null): string {
    let url = `${this.resourceName}/`
    if (id !== null && id !== undefined) {
      url += `${id}/`
    }
    if (action) {
      url += `${action}/`
    }
    return url
  }

  private getOrderingQueryParam(sortField?: string, sortReverse?: boolean): string | null {
    if (sortField) {
      return (sortReverse ? '-' : '') + sortField
    }
    return null
  }

  async list(params?: ListParams): Promise<Results<T>> {
    const {
      page,
      pageSize,
      sortField,
      sortReverse,
      extraParams = {},
    } = params || {}

    const queryParams: Record<string, any> = {}

    if (page) {
      queryParams.page = page
    }
    if (pageSize) {
      queryParams.page_size = pageSize
    }

    const ordering = this.getOrderingQueryParam(sortField, sortReverse)
    if (ordering) {
      queryParams.ordering = ordering
    }

    // Merge extra params
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value != null) {
        queryParams[key] = value
      }
    })

    const response = await apiClient.get<Results<T>>(
      this.getResourceUrl(),
      queryParams
    )
    return response.data
  }

  async listAll(
    sortField?: string,
    sortReverse?: boolean,
    extraParams?: Record<string, any>
  ): Promise<Results<T>> {
    return this.list({
      page: 1,
      pageSize: 100000,
      sortField,
      sortReverse,
      extraParams,
    })
  }

  async get(id: number): Promise<T> {
    const response = await apiClient.get<T>(this.getResourceUrl(id))
    return response.data
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await apiClient.post<T>(this.getResourceUrl(), data)
    return response.data
  }

  async update(id: number, data: Partial<T>): Promise<T> {
    const response = await apiClient.put<T>(this.getResourceUrl(id), data)
    return response.data
  }

  async patch(id: number, data: Partial<T>): Promise<T> {
    const response = await apiClient.patch<T>(this.getResourceUrl(id), data)
    return response.data
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(this.getResourceUrl(id))
  }

  async getFew(ids: number[], extraParams?: Record<string, any>): Promise<Results<T>> {
    const queryParams: Record<string, any> = {
      id__in: ids.join(','),
      ordering: '-id',
      page_size: 1000,
      ...extraParams,
    }

    const response = await apiClient.get<Results<T>>(
      this.getResourceUrl(),
      queryParams
    )
    return response.data
  }
}

