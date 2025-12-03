/**
 * CorrespondentService for React
 * Ported from Angular CorrespondentService
 */

import { Correspondent } from '@/app/data/correspondent'
import { BaseNameFilterService } from '../base-name-filter-service'

export class CorrespondentService extends BaseNameFilterService<Correspondent> {
  constructor() {
    super('correspondents')
  }
}

