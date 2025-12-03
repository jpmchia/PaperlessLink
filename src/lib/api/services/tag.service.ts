/**
 * TagService for React
 * Ported from Angular TagService
 */

import { Tag } from '@/app/data/tag'
import { BaseNameFilterService } from '../base-name-filter-service'

export class TagService extends BaseNameFilterService<Tag> {
  constructor() {
    super('tags')
  }
}

