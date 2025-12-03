/**
 * SearchService for React
 * Ported from Angular SearchService
 */

import { apiClient } from '../client'

export interface GlobalSearchResult {
  total: number
  documents: any[]
  saved_views: any[]
  correspondents: any[]
  document_types: any[]
  storage_paths: any[]
  tags: any[]
  users: any[]
  groups: any[]
  mail_accounts: any[]
  mail_rules: any[]
  custom_fields: any[]
  workflows: any[]
}

export class SearchService {
  public readonly searchResultObjectLimit: number = 3
  private searchDbOnly: boolean = false

  setSearchDbOnly(value: boolean) {
    this.searchDbOnly = value
  }

  async autocomplete(term: string): Promise<string[]> {
    const response = await apiClient.get<string[]>('search/autocomplete/', {
      term,
    })
    return response.data
  }

  async globalSearch(query: string): Promise<GlobalSearchResult> {
    const params: Record<string, any> = { query }
    if (this.searchDbOnly) {
      params['db_only'] = true
    }
    const response = await apiClient.get<GlobalSearchResult>('search/', params)
    return response.data
  }
}

