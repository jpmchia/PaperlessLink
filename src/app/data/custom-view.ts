import { ObjectWithPermissions } from './object-with-permissions'

/**
 * Custom View - Stores user-defined views with column configuration, sizes, and filters
 * Extends ObjectWithPermissions to support user-only and global (shared) views
 */
export interface CustomView extends ObjectWithPermissions {
  id?: number
  name: string
  description?: string
  
  // Metadata
  created?: Date | string  // ISO date string from API, Date object when parsed
  modified?: Date | string  // ISO date string from API, Date object when parsed
  deleted_at?: Date | string | null  // ISO date string from API, Date object when parsed, null if not deleted
  username?: string  // Username of the owner/creator
  
  // Column configuration
  column_order: (string | number)[]  // Ordered list of column IDs (built-in: strings, custom: numbers)
  column_sizing: Record<string, number>  // Map of column ID to pixel width
  column_visibility: Record<string, boolean>  // Map of built-in field ID to visibility
  column_display_types: Record<string, 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'>  // Map of custom field ID to display type
  
  // Filter configuration - stored as filter rules (same format as SavedView)
  filter_rules?: Array<{
    rule_type: string
    value: any
  }>
  
  // Filter visibility - which filters are shown
  filter_visibility?: Record<string, boolean>
  
  // Subrow configuration
  subrow_enabled?: boolean  // Whether to show a subrow
  subrow_content?: 'summary' | 'tags' | 'none'  // What content to display in subrow (default: 'summary')
  
  // Column spanning configuration - which columns should span two rows
  column_spanning?: Record<string, boolean>  // Map of column ID to whether it spans two rows
  
  // Sorting (optional - can use default)
  sort_field?: string
  sort_reverse?: boolean
  
  // Is this view shared globally (true) or user-only (false)
  is_global?: boolean
}

