/**
 * StoragePathService for React
 * Ported from Angular StoragePathService
 */

import { StoragePath } from '@/app/data/storage-path'
import { BaseNameFilterService } from '../base-name-filter-service'

export class StoragePathService extends BaseNameFilterService<StoragePath> {
  constructor() {
    super('storage_paths')
  }
}

