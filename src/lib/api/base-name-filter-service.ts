/**
 * Abstract base service for name-filterable REST resources
 * Replaces Angular's AbstractNameFilterService
 */

import { ObjectWithId } from '../../app/data/object-with-id'
import { PermissionsObject } from '../../app/data/object-with-permissions'
import { BaseService, ListParams } from './base-service'
import { apiClient } from './client'

export enum BulkEditObjectOperation {
  SetPermissions = 'set_permissions',
  Delete = 'delete',
}

export abstract class BaseNameFilterService<T extends ObjectWithId> extends BaseService<T> {
  async listFiltered(
    params?: ListParams & {
      nameFilter?: string
      fullPerms?: boolean
    }
  ): Promise<import('../../app/data/results').Results<T>> {
    const { nameFilter, fullPerms, ...restParams } = params || {}
    const extraParams = restParams.extraParams || {}

    if (nameFilter) {
      extraParams['name__icontains'] = nameFilter
    }
    if (fullPerms) {
      extraParams['full_perms'] = true
    }

    return this.list({
      ...restParams,
      extraParams,
    })
  }

  async bulkEditObjects(
    objects: number[],
    operation: BulkEditObjectOperation,
    permissions?: {
      owner: number
      set_permissions: PermissionsObject
    },
    merge?: boolean
  ): Promise<string> {
    const params: any = {
      objects,
      object_type: this.resourceName,
      operation,
    }

    if (operation === BulkEditObjectOperation.SetPermissions) {
      if (permissions) {
        params['owner'] = permissions.owner
        params['permissions'] = permissions.set_permissions
      }
      if (merge !== null && merge !== undefined) {
        params['merge'] = merge
      }
    }

    const response = await apiClient.post<string>('bulk_edit_objects/', params)
    return response.data
  }
}

