/**
 * DocumentNotesService for React
 * Ported from Angular DocumentNotesService
 */

import { DocumentNote } from '@/app/data/document-note'
import { apiClient } from '../client'

export class DocumentNotesService {
  async getNotes(documentId: number): Promise<DocumentNote[]> {
    const response = await apiClient.get<DocumentNote[]>(`documents/${documentId}/notes/`)
    return response.data
  }

  async addNote(documentId: number, note: string): Promise<DocumentNote[]> {
    const response = await apiClient.post<DocumentNote[]>(`documents/${documentId}/notes/`, {
      note,
    })
    return response.data
  }

  async deleteNote(documentId: number, noteId: number): Promise<DocumentNote[]> {
    const response = await apiClient.delete<DocumentNote[]>(`documents/${documentId}/notes/`, {
      id: noteId.toString(),
    })
    return response.data
  }
}

