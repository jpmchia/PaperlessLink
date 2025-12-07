/**
 * DocumentService for React
 * Ported from Angular DocumentService
 */

import { Document } from '@/app/data/document'
import { FilterRule } from '@/app/data/filter-rule'
import { DocumentMetadata } from '@/app/data/document-metadata'
import { DocumentSuggestions } from '@/app/data/document-suggestions'
import { AuditLogEntry } from '@/app/data/auditlog-entry'

export interface SelectionDataItem {
  id: number
  document_count: number
}

export interface SelectionData {
  selected_storage_paths: SelectionDataItem[]
  selected_correspondents: SelectionDataItem[]
  selected_tags: SelectionDataItem[]
  selected_document_types: SelectionDataItem[]
  selected_custom_fields: SelectionDataItem[]
}
import { BaseService, ListParams } from '../base-service'
import { apiClient } from '../client'
import { queryParamsFromFilterRules } from '@/app/utils/query-params'

export class DocumentService extends BaseService<Document> {
  private _searchQuery: string = ''

  constructor() {
    super('documents')
  }

  public set searchQuery(query: string) {
    this._searchQuery = query.trim()
  }

  public get searchQuery(): string {
    return this._searchQuery
  }

  async listFiltered(
    params?: ListParams & {
      filterRules?: FilterRule[]
    }
  ): Promise<import('@/app/data/results').Results<Document>> {
    const { filterRules, ...restParams } = params || {}
    const extraParams = restParams.extraParams || {}

    if (filterRules) {
      const queryParams = queryParamsFromFilterRules(filterRules)
      Object.assign(extraParams, queryParams)
      
      // Debug logging for custom field queries
      if (queryParams?.custom_field_query) {
        console.log('[DocumentService] Sending custom_field_query to paperless-ngx:', queryParams.custom_field_query)
        try {
          const parsed = JSON.parse(queryParams.custom_field_query as string)
          console.log('[DocumentService] Parsed custom_field_query:', JSON.stringify(parsed, null, 2))
        } catch (e) {
          console.error('[DocumentService] Failed to parse custom_field_query:', e)
        }
      }
    }

    return this.list({
      ...restParams,
      extraParams,
    })
  }

  async listAllFilteredIds(filterRules?: FilterRule[]): Promise<number[]> {
    const results = await this.listFiltered({
      page: 1,
      pageSize: 100000,
      filterRules,
      extraParams: { fields: 'id' },
    })
    return results.results.map((doc) => doc.id).filter((id): id is number => id !== undefined)
  }

  async get(id: number): Promise<Document> {
    const response = await apiClient.get<Document>(this.getResourceUrl(id), {
      full_perms: true,
    })
    return response.data
  }

  getPreviewUrl(id: number, original: boolean = false): string {
    let url = new URL(this.getResourceUrl(id, 'preview'), apiClient.baseUrl)
    if (this._searchQuery) {
      url.hash = `#search="${this.searchQuery}"`
    }
    if (original) {
      url.searchParams.append('original', 'true')
    }
    return url.toString()
  }

  getThumbUrl(id: number): string {
    return new URL(this.getResourceUrl(id, 'thumb'), apiClient.baseUrl).toString()
  }

  getDownloadUrl(id: number, original: boolean = false): string {
    let url = new URL(this.getResourceUrl(id, 'download'), apiClient.baseUrl)
    if (original) {
      url.searchParams.append('original', 'true')
    }
    return url.toString()
  }

  async getNextAsn(): Promise<number> {
    const response = await apiClient.get<number>(this.getResourceUrl(null, 'next_asn'))
    return response.data
  }

  async uploadDocument(formData: FormData): Promise<any> {
    const response = await apiClient.post(this.getResourceUrl(null, 'post_document'), formData)
    return response.data
  }

  async getMetadata(id: number): Promise<DocumentMetadata> {
    const response = await apiClient.get<DocumentMetadata>(this.getResourceUrl(id, 'metadata'))
    return response.data
  }

  async bulkEdit(ids: number[], method: string, args: any): Promise<any> {
    const response = await apiClient.post(this.getResourceUrl(null, 'bulk_edit'), {
      documents: ids,
      method: method,
      parameters: args,
    })
    return response.data
  }

  async getSelectionData(ids: number[]): Promise<SelectionData> {
    const response = await apiClient.post<SelectionData>(
      this.getResourceUrl(null, 'selection_data'),
      { documents: ids }
    )
    return response.data
  }

  async getSuggestions(id: number): Promise<DocumentSuggestions> {
    const response = await apiClient.get<DocumentSuggestions>(
      this.getResourceUrl(id, 'suggestions')
    )
    return response.data
  }

  async getHistory(id: number): Promise<AuditLogEntry[]> {
    const response = await apiClient.get<AuditLogEntry[]>(this.getResourceUrl(id, 'history'))
    return response.data
  }

  async bulkDownload(
    ids: number[],
    content: string = 'both',
    useFilenameFormatting: boolean = false
  ): Promise<Blob> {
    // Note: This requires special handling for blob responses
    const response = await fetch(
      `${apiClient.baseUrl}${this.getResourceUrl(null, 'bulk_download')}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documents: ids,
          content: content,
          follow_formatting: useFilenameFormatting,
        }),
      }
    )
    return response.blob()
  }

  async emailDocuments(
    documentIds: number[],
    addresses: string,
    subject: string,
    message: string,
    useArchiveVersion: boolean
  ): Promise<any> {
    const response = await apiClient.post(this.getResourceUrl(null, 'email'), {
      documents: documentIds,
      addresses: addresses,
      subject: subject,
      message: message,
      use_archive_version: useArchiveVersion,
    })
    return response.data
  }
}

