/**
 * Utilities for validating and sanitizing custom views
 * Handles cases where custom fields have been added/removed
 */

import { CustomView } from '@/app/data/custom-view'
import { CustomField } from '@/app/data/custom-field'

export interface ValidationResult {
  isValid: boolean
  sanitizedView: CustomView
  warnings: string[]
  errors: string[]
}

const BUILT_IN_FIELDS = ['title', 'modified', 'fileSize', 'category', 'owner', 'actions']

/**
 * Validates and sanitizes a custom view against the current available fields
 */
export function validateAndSanitizeCustomView(
  view: CustomView,
  availableCustomFields: CustomField[]
): ValidationResult {
  const warnings: string[] = []
  const errors: string[] = []
  const sanitizedView = { ...view }

  // Create a map of available custom field IDs
  const availableCustomFieldIds = new Set(
    availableCustomFields
      .map(f => f.id)
      .filter((id): id is number => id !== undefined)
  )

  // Create a map of available custom field IDs by their column ID format
  const availableCustomFieldColumnIds = new Set(
    availableCustomFields
      .filter(f => f.id !== undefined)
      .map(f => `customField_${f.id}`)
  )

  // Validate and sanitize column_order
  const sanitizedColumnOrder: (string | number)[] = []
  view.column_order?.forEach((columnId) => {
    if (typeof columnId === 'string') {
      // Built-in field or custom field column ID string
      if (BUILT_IN_FIELDS.includes(columnId)) {
        sanitizedColumnOrder.push(columnId)
      } else if (columnId.startsWith('customField_')) {
        const fieldId = parseInt(columnId.replace('customField_', ''), 10)
        if (availableCustomFieldIds.has(fieldId)) {
          sanitizedColumnOrder.push(columnId)
        } else {
          warnings.push(`Removed missing custom field column: ${columnId}`)
        }
      } else {
        // Unknown built-in field, keep it but warn
        warnings.push(`Unknown built-in field in column order: ${columnId}`)
        sanitizedColumnOrder.push(columnId)
      }
    } else if (typeof columnId === 'number') {
      // Custom field ID (numeric)
      if (availableCustomFieldIds.has(columnId)) {
        sanitizedColumnOrder.push(columnId)
      } else {
        warnings.push(`Removed missing custom field from column order: ${columnId}`)
      }
    }
  })
  sanitizedView.column_order = sanitizedColumnOrder

  // Validate and sanitize column_sizing
  const sanitizedColumnSizing: Record<string, number> = {}
  Object.entries(view.column_sizing || {}).forEach(([columnId, width]) => {
    if (BUILT_IN_FIELDS.includes(columnId)) {
      sanitizedColumnSizing[columnId] = width
    } else if (columnId.startsWith('customField_')) {
      if (availableCustomFieldColumnIds.has(columnId)) {
        sanitizedColumnSizing[columnId] = width
      } else {
        warnings.push(`Removed sizing for missing custom field: ${columnId}`)
      }
    } else {
      // Try to parse as custom field ID
      const fieldId = parseInt(columnId, 10)
      if (!isNaN(fieldId)) {
        if (availableCustomFieldIds.has(fieldId)) {
          // Store with customField_ prefix for consistency
          sanitizedColumnSizing[`customField_${fieldId}`] = width
        } else {
          warnings.push(`Removed sizing for missing custom field: ${columnId}`)
        }
      } else {
        warnings.push(`Removed sizing for unknown column: ${columnId}`)
      }
    }
  })
  sanitizedView.column_sizing = sanitizedColumnSizing

  // Validate and sanitize column_visibility (only for built-in fields)
  const sanitizedColumnVisibility: Record<string, boolean> = {}
  Object.entries(view.column_visibility || {}).forEach(([fieldId, visibility]) => {
    if (BUILT_IN_FIELDS.includes(fieldId)) {
      sanitizedColumnVisibility[fieldId] = visibility
    } else {
      warnings.push(`Removed visibility setting for unknown built-in field: ${fieldId}`)
    }
  })
  sanitizedView.column_visibility = sanitizedColumnVisibility

  // Validate and sanitize column_display_types (only for custom fields)
  const sanitizedColumnDisplayTypes: Record<string, 'text' | 'date' | 'url' | 'checkbox' | 'list' | 'identifier'> = {}
  Object.entries(view.column_display_types || {}).forEach(([fieldId, displayType]) => {
    const id = parseInt(fieldId, 10)
    if (!isNaN(id) && availableCustomFieldIds.has(id)) {
      sanitizedColumnDisplayTypes[fieldId] = displayType
    } else {
      warnings.push(`Removed display type for missing custom field: ${fieldId}`)
    }
  })
  sanitizedView.column_display_types = sanitizedColumnDisplayTypes

  // Validate filter_rules that reference custom fields
  // (Custom field filter rules use format like "FILTER_CUSTOM_FIELD_123")
  const sanitizedFilterRules = (view.filter_rules || []).filter((rule) => {
    if (rule.rule_type?.startsWith('FILTER_CUSTOM_FIELD_')) {
      const fieldId = parseInt(rule.rule_type.replace('FILTER_CUSTOM_FIELD_', ''), 10)
      if (!isNaN(fieldId) && !availableCustomFieldIds.has(fieldId)) {
        warnings.push(`Removed filter rule for missing custom field: ${rule.rule_type}`)
        return false
      }
    }
    return true
  })
  sanitizedView.filter_rules = sanitizedFilterRules

  // Validate filter_visibility for custom fields
  const sanitizedFilterVisibility: Record<string, boolean> = {}
  Object.entries(view.filter_visibility || {}).forEach(([key, visibility]) => {
    if (key.startsWith('customField_')) {
      const fieldId = parseInt(key.replace('customField_', ''), 10)
      if (!isNaN(fieldId) && availableCustomFieldIds.has(fieldId)) {
        sanitizedFilterVisibility[key] = visibility
      } else {
        warnings.push(`Removed filter visibility for missing custom field: ${key}`)
      }
    } else {
      // Built-in filter visibility, keep it
      sanitizedFilterVisibility[key] = visibility
    }
  })
  sanitizedView.filter_visibility = sanitizedFilterVisibility

  // If view has errors (like missing required fields), mark as invalid
  const isValid = errors.length === 0

  return {
    isValid,
    sanitizedView,
    warnings,
    errors,
  }
}

/**
 * Check if a custom view needs to be updated due to field changes
 */
export function needsUpdate(view: CustomView, availableCustomFields: CustomField[]): boolean {
  const result = validateAndSanitizeCustomView(view, availableCustomFields)
  return result.warnings.length > 0 || result.errors.length > 0
}

