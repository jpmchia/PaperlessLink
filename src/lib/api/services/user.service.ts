/**
 * UserService for React
 * Ported from Angular UserService
 */

import { User } from '@/app/data/user'
import { BaseNameFilterService } from '../base-name-filter-service'

export class UserService extends BaseNameFilterService<User> {
  constructor() {
    super('users')
  }
}

