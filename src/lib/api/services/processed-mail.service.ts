/**
 * ProcessedMailService for React
 * Ported from Angular ProcessedMailService
 */

import { ProcessedMail } from '@/app/data/processed-mail'
import { BaseService } from '../base-service'
import { apiClient } from '../client'

export class ProcessedMailService extends BaseService<ProcessedMail> {
  constructor() {
    super('processed_mail')
  }

  async bulkDelete(mailIds: number[]): Promise<any> {
    const response = await apiClient.post(this.getResourceUrl() + 'bulk_delete/', {
      mail_ids: mailIds,
    })
    return response.data
  }
}

