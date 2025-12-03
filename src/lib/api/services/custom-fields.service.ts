/**
 * CustomFieldsService for React
 * Ported from Angular CustomFieldsService
 */

import { CustomField } from '@/app/data/custom-field'
import { BaseService } from '../base-service'

export class CustomFieldsService extends BaseService<CustomField> {
  constructor() {
    super('custom_fields')
  }
}

