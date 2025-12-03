/**
 * DocumentTypeService for React
 * Ported from Angular DocumentTypeService
 */

import { DocumentType } from '@/app/data/document-type'
import { BaseNameFilterService } from '../base-name-filter-service'

export class DocumentTypeService extends BaseNameFilterService<DocumentType> {
  constructor() {
    super('document_types')
  }
}

