/**
 * RemoteVersionService for React
 * Ported from Angular RemoteVersionService
 */

import { apiClient } from '../client'

export interface AppRemoteVersion {
  version: string
  update_available: boolean
}

export class RemoteVersionService {
  async checkForUpdates(): Promise<AppRemoteVersion> {
    const response = await apiClient.get<AppRemoteVersion>('remote_version/')
    return response.data
  }
}

