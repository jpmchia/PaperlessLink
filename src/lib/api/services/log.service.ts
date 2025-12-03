/**
 * LogService for React
 * Ported from Angular LogService
 */

import { apiClient } from '../client'

export class LogService {
  async list(): Promise<string[]> {
    const response = await apiClient.get<string[]>('logs/')
    return response.data
  }

  async get(id: string, limit?: number): Promise<string[]> {
    const params: Record<string, any> = {}
    if (limit !== undefined) {
      params['limit'] = limit
    }
    const response = await apiClient.get<string[]>(`logs/${id}/`, params)
    return response.data
  }
}

