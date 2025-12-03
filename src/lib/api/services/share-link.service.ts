/**
 * ShareLinkService for React
 * Ported from Angular ShareLinkService
 */

import { ShareLink, FileVersion } from '@/app/data/share-link'
import { BaseNameFilterService } from '../base-name-filter-service'
import { apiClient } from '../client'

export class ShareLinkService extends BaseNameFilterService<ShareLink> {
  constructor() {
    super('share_links')
  }

  async getLinksForDocument(documentId: number): Promise<ShareLink[]> {
    const response = await apiClient.get<ShareLink[]>(
      `documents/${documentId}/${this.resourceName}/`
    )
    return response.data
  }

  async createLinkForDocument(
    documentId: number,
    file_version: FileVersion = FileVersion.Archive,
    expiration: Date | null = null
  ): Promise<ShareLink> {
    const response = await apiClient.post<ShareLink>(this.getResourceUrl(), {
      document: documentId,
      file_version,
      expiration: expiration?.toISOString(),
    })
    return response.data
  }
}

