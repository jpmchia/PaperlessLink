/**
 * GroupService for React
 * Ported from Angular GroupService
 */

import { Group } from '@/app/data/group'
import { BaseNameFilterService } from '../base-name-filter-service'

export class GroupService extends BaseNameFilterService<Group> {
  constructor() {
    super('groups')
  }
}

