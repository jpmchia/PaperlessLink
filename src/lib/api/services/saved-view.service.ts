/**
 * SavedViewService for React
 * Ported from Angular SavedViewService
 */

import { SavedView } from '@/app/data/saved-view'
import { BaseService } from '../base-service'

export class SavedViewService extends BaseService<SavedView> {
  constructor() {
    super('saved_views')
  }

  async patch(id: number, data: Partial<SavedView>): Promise<SavedView> {
    // If display_fields is empty array, set to null
    const patchData = { ...data }
    if (patchData.display_fields?.length === 0) {
      patchData.display_fields = null as any
    }
    return super.patch(id, patchData)
  }

  async patchMany(objects: SavedView[]): Promise<SavedView[]> {
    return Promise.all(objects.map((o) => this.patch(o.id!, o)))
  }
}

