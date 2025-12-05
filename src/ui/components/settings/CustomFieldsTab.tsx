"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { CustomField } from "@/app/data/custom-field";
import { CustomView } from "@/app/data/custom-view";
import { CustomFieldsTable } from "./CustomFieldsTable";
import { CustomViewsListTable } from "./CustomViewsListTable";
import { Button } from "../Button";
import { TextField } from "../TextField";
import { Switch } from "../Switch";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";

interface CustomFieldsTabProps {
  customFields: CustomField[];
  customFieldsLoading: boolean;
  getSetting: (key: string, defaultValue: any) => any;
  updateSetting: (key: string, value: any) => void;
  tabsList: string[];
  newTabInput: Record<number, string>;
  setNewTabInput: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  handleAddTab: (fieldId: number, tabName: string) => void;
  // Custom views management
  customViews: CustomView[];
  customViewsLoading: boolean;
  customViewsError?: Error | null;
  selectedViewId: number | string | null;
  onSelectView: (viewId: number | string | null) => void;
  onSaveView: (viewData: Omit<CustomView, 'id'>) => Promise<void>;
  onUpdateView: (id: number | string, viewData: Partial<CustomView>) => Promise<void>;
  onDeleteView: (id: number | string) => Promise<void>;
  isSavingView: boolean;
  // Save/Revert handlers for view changes
  onSaveViewChanges?: () => Promise<void>;
  onRevertViewChanges?: () => Promise<void>;
  hasUnsavedViewChanges?: boolean;
}

export function CustomFieldsTab({
  customFields,
  customFieldsLoading,
  getSetting,
  updateSetting,
  tabsList,
  newTabInput,
  setNewTabInput,
  handleAddTab,
  customViews,
  customViewsLoading,
  customViewsError,
  selectedViewId,
  onSelectView,
  onSaveView,
  onUpdateView,
  onDeleteView,
  isSavingView,
  onSaveViewChanges,
  onRevertViewChanges,
  hasUnsavedViewChanges = false,
}: CustomFieldsTabProps) {
  // Local state for editing view name/description
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingIsGlobal, setEditingIsGlobal] = useState(false);

  // Use a ref to track the latest customViews to avoid stale closures
  const customViewsRef = React.useRef(customViews);
  // Track updates to force re-renders when ref changes
  const [viewUpdateCounter, setViewUpdateCounter] = useState(0);
  
  React.useEffect(() => {
    customViewsRef.current = customViews;
  }, [customViews]);

  const selectedView = useMemo(() => {
    if (!selectedViewId) return null;
    return customViews.find(v => {
      // Match by ID, handling both number IDs (saved) and string IDs (local drafts)
      if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
        return v.id === selectedViewId;
      }
      if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
        return v.id === selectedViewId;
      }
      return false;
    }) || null;
  }, [selectedViewId, customViews]);

  // Create wrapper functions that read from/write to the selected custom view
  // instead of global settings
  // Read dynamically from customViewsRef to avoid stale closures during batched updates
  const viewGetSetting = useMemo(() => {
    return (key: string, defaultValue: any = null) => {
      // Get the latest view from customViewsRef to avoid stale closures
      const currentView = selectedViewId ? customViewsRef.current.find(v => {
        if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
          return v.id === selectedViewId;
        }
        if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
          return v.id === selectedViewId;
        }
        return false;
      }) : null;

      if (!currentView) {
        return defaultValue;
      }
      
      // Map settings keys to custom view properties
      if (key === SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER) {
        return currentView.column_order || defaultValue;
      }
      
      // Handle built-in field visibility
      if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX, '');
        return currentView.column_visibility?.[fieldId] ?? defaultValue;
      }
      
      // Handle built-in field column width
      if (key.startsWith('general-settings:documents:built-in-field:column-width:')) {
        const fieldId = key.replace('general-settings:documents:built-in-field:column-width:', '');
        return currentView.column_sizing?.[fieldId] || defaultValue;
      }
      
      // Handle custom field table column visibility
      if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX)) {
        const fieldId = parseInt(key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX, ''), 10);
        if (!isNaN(fieldId)) {
          // Check column_visibility first, then fall back to column_order
          const visibilityKey = `customField_${fieldId}`;
          if (currentView.column_visibility?.[visibilityKey] !== undefined) {
            return currentView.column_visibility[visibilityKey];
          }
          // Fall back to checking column_order
          return currentView.column_order?.includes(fieldId) || currentView.column_order?.includes(visibilityKey) || defaultValue;
        }
      }
      
      // Handle custom field display type
      if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
        const fieldIdStr = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
        const fieldId = parseInt(fieldIdStr, 10);
        if (!isNaN(fieldId)) {
          return currentView.column_display_types?.[fieldId] || defaultValue;
        }
        return defaultValue;
      }
      
      // Handle custom field column width
      if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX, '');
        const sizingKey = `customField_${fieldId}`;
        // Try both the prefixed key and numeric ID
        return currentView.column_sizing?.[sizingKey] || currentView.column_sizing?.[fieldId] || defaultValue;
      }
      
      // Handle custom field display order
      if (key === SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER) {
        // Extract custom field IDs from column_order
        const customFieldIds = (currentView.column_order || [])
          .filter(id => typeof id === 'number')
          .map(id => id as number);
        return customFieldIds.length > 0 ? customFieldIds : defaultValue;
      }
      
      // Handle tabs list - use global settings (tabs are shared across views)
      if (key === SETTINGS_KEYS.CUSTOM_FIELD_TABS_LIST) {
        return getSetting(key, defaultValue);
      }
      
      // Default to global settings for other keys
      return getSetting(key, defaultValue);
    };
  }, [selectedViewId, customViews, getSetting]);

  const viewUpdateSetting = useMemo(() => {
    return (key: string, value: any) => {
      // Get the latest view from customViewsRef to avoid stale closures during batched updates
      const currentView = selectedViewId ? customViewsRef.current.find(v => {
        if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
          return v.id === selectedViewId;
        }
        if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
          return v.id === selectedViewId;
        }
        return false;
      }) : null;

      if (!currentView) {
        // If no view selected, update global settings
        updateSetting(key, value);
        return;
      }
      
      // For draft views, id might be a string, so check differently
      if (currentView.id === undefined || currentView.id === null) {
        // If view has no ID, update global settings
        updateSetting(key, value);
        return;
      }

      // Build update object for the custom view
      const updateData: Partial<CustomView> = {};
      
      // Immediately update customViewsRef to ensure subsequent getSetting calls read the new value
      // This prevents stale reads during the same render cycle
      const updateRefImmediately = (updatedData: Partial<CustomView>) => {
        const updatedView = { ...currentView, ...updatedData };
        const updatedViews = customViewsRef.current.map(v => {
          if (v.id === currentView.id) {
            return updatedView;
          }
          return v;
        });
        customViewsRef.current = updatedViews;
        // Force a re-render by incrementing counter
        // This ensures allFields and other memoized values recalculate
        setViewUpdateCounter(prev => prev + 1);
      };
      
      if (key === SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER) {
        updateData.column_order = value;
      } else if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX, '');
        updateData.column_visibility = {
          ...currentView.column_visibility,
          [fieldId]: value,
        };
      } else if (key.startsWith('general-settings:documents:built-in-field:column-width:')) {
        const fieldId = key.replace('general-settings:documents:built-in-field:column-width:', '');
        updateData.column_sizing = {
          ...currentView.column_sizing,
          [fieldId]: value,
        };
      } else if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX)) {
        // Update both column_visibility and column_order
        const fieldId = parseInt(key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX, ''), 10);
        if (!isNaN(fieldId)) {
          const visibilityKey = `customField_${fieldId}`;
          const currentOrder = currentView.column_order || [];
          
          // Update column_visibility
          updateData.column_visibility = {
            ...currentView.column_visibility,
            [visibilityKey]: value,
          };
          
          // Update column_order - preserve existing order, don't move fields around
          if (value === true) {
            // Add to order if not present
            if (!currentOrder.includes(fieldId) && !currentOrder.includes(visibilityKey)) {
              // Simply append to the end to preserve existing order
              // The table will display fields in the order they appear in column_order
              updateData.column_order = [...currentOrder, fieldId];
            }
            // If already in order, don't change it - preserve existing position
          } else {
            // Remove from order
            updateData.column_order = currentOrder.filter(
              id => id !== fieldId && id !== visibilityKey
            );
          }
        }
      } else if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
        // Extract numeric field ID from the key
        const fieldIdStr = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
        const fieldId = parseInt(fieldIdStr, 10);
        if (!isNaN(fieldId)) {
          updateData.column_display_types = {
            ...currentView.column_display_types,
            [fieldId]: value,
          };
        }
      } else if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX, '');
        const sizingKey = `customField_${fieldId}`;
        updateData.column_sizing = {
          ...currentView.column_sizing,
          [sizingKey]: value,
        };
      } else if (key === SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER) {
        // Update column_order with new custom field order
        const builtInFields = (currentView.column_order || []).filter(id => typeof id === 'string');
        updateData.column_order = [...builtInFields, ...(value as number[])];
      } else {
        // For other settings, update global settings
        updateSetting(key, value);
        return;
      }

      // Update the custom view (works for both saved views and local drafts)
      if (Object.keys(updateData).length > 0 && currentView.id !== undefined && currentView.id !== null) {
        // Check if this is a column width change - these don't need to force a remount
        const isColumnWidthChange = key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX) || 
                                    key.startsWith('general-settings:documents:built-in-field:column-width:');
        
        if (!isColumnWidthChange) {
          // Immediately update the ref so subsequent getSetting calls read the new value
          // This ensures immediate UI feedback (e.g., row reordering, display type updates)
          // Skip for column width changes to prevent remounting and losing input focus
          updateRefImmediately(updateData);
        } else {
          // For column width, just update the ref without incrementing counter
          // This allows the value to be read correctly without remounting
          const updatedView = { ...currentView, ...updateData };
          const updatedViews = customViewsRef.current.map(v => {
            if (v.id === currentView.id) {
              return updatedView;
            }
            return v;
          });
          customViewsRef.current = updatedViews;
        }
        
        // Call onUpdateView - it will update the state asynchronously
        // The ref update above ensures immediate UI feedback
        onUpdateView(currentView.id, updateData).catch(err => {
          console.error('Failed to update view:', err);
        });
      }
    };
  }, [selectedViewId, customViews, updateSetting, onUpdateView]);

  // Initialize editing fields when view is selected
  useEffect(() => {
    if (selectedView) {
      setEditingName(selectedView.name || "");
      setEditingDescription(selectedView.description || "");
      setEditingIsGlobal(selectedView.is_global || false);
    } else {
      setEditingName("");
      setEditingDescription("");
      setEditingIsGlobal(false);
    }
  }, [selectedView]);

  const handleCreateView = () => {
    // Create a new draft view
    const newViewData: Omit<CustomView, 'id'> = {
      name: "New View",
      description: "",
      is_global: false,
      column_order: [],
      column_sizing: {},
      column_visibility: {},
      column_display_types: {},
      filter_rules: [],
      filter_visibility: {},
    };
    onSaveView(newViewData);
  };

  const handleEditView = (view: CustomView) => {
    if (view.id !== undefined) {
      onSelectView(view.id);
    }
  };

  const handleDuplicateView = async (view: CustomView) => {
    const duplicateData: Omit<CustomView, 'id'> = {
      name: `${view.name} (Copy)`,
      description: view.description,
      is_global: false, // Duplicates are always user-only
      column_order: view.column_order ? [...view.column_order] : [],
      column_sizing: view.column_sizing ? { ...view.column_sizing } : {},
      column_visibility: view.column_visibility ? { ...view.column_visibility } : {},
      column_display_types: view.column_display_types ? { ...view.column_display_types } : {},
      filter_rules: view.filter_rules ? [...view.filter_rules] : [],
      filter_visibility: view.filter_visibility ? { ...view.filter_visibility } : {},
      sort_field: view.sort_field,
      sort_reverse: view.sort_reverse,
    };
    await onSaveView(duplicateData);
  };

  const handleSaveAs = async () => {
    if (!selectedView) return;
    
    const newName = prompt("Enter a name for the new view:", `${selectedView.name} (Copy)`);
    if (!newName || !newName.trim()) return;

    const duplicateData: Omit<CustomView, 'id'> = {
      name: newName.trim(),
      description: selectedView.description,
      is_global: false, // Save As creates user-only views
      column_order: selectedView.column_order ? [...selectedView.column_order] : [],
      column_sizing: selectedView.column_sizing ? { ...selectedView.column_sizing } : {},
      column_visibility: selectedView.column_visibility ? { ...selectedView.column_visibility } : {},
      column_display_types: selectedView.column_display_types ? { ...selectedView.column_display_types } : {},
      filter_rules: selectedView.filter_rules ? [...selectedView.filter_rules] : [],
      filter_visibility: selectedView.filter_visibility ? { ...selectedView.filter_visibility } : {},
      sort_field: selectedView.sort_field,
      sort_reverse: selectedView.sort_reverse,
    };
    await onSaveView(duplicateData);
  };

  const handleDeleteView = async (view?: CustomView) => {
    const viewToDelete = view || selectedView;
    const viewIdToDelete = view?.id ?? selectedViewId;
    
    if (!viewIdToDelete || !viewToDelete) return;
    
    // For local drafts, just remove them - no API call needed
    if (typeof viewIdToDelete === 'string' && viewIdToDelete.startsWith('draft-')) {
      if (window.confirm(`Are you sure you want to delete draft view "${viewToDelete.name}"? This action cannot be undone.`)) {
        onDeleteView(viewIdToDelete);
        if (!view) {
          onSelectView(null);
        }
      }
      return;
    }
    
    // For saved views, delete via API
    if (window.confirm(`Are you sure you want to delete "${viewToDelete.name}"? This action cannot be undone.`)) {
      try {
        await onDeleteView(viewIdToDelete);
        if (!view) {
          onSelectView(null);
        }
      } catch (error) {
        // Error already handled in mutation
      }
    }
  };


  // Check if we're in edit mode (a view is selected)
  const isEditMode = selectedView !== null;

  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
      <div className="flex flex-col items-start gap-2 mb-2 flex-none">
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col items-start gap-1">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Custom Views
            </span>
            <span className="text-caption font-caption text-subtext-color">
              {isEditMode 
                ? "Configure custom document list views with column order, sizing, and filters"
                : "Manage your custom document list views"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isEditMode && onSaveViewChanges && onRevertViewChanges && (
              <>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  onClick={onRevertViewChanges}
                  disabled={!hasUnsavedViewChanges || isSavingView}
                >
                  Revert
                </Button>
                <Button
                  variant="brand-primary"
                  size="small"
                  onClick={async () => {
                    try {
                      await onSaveViewChanges?.();
                    } catch (error) {
                      console.error("Error saving view changes:", error);
                    }
                  }}
                  disabled={!hasUnsavedViewChanges || isSavingView}
                >
                  {isSavingView ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="neutral-secondary"
                  size="small"
                  onClick={handleSaveAs}
                  disabled={isSavingView}
                >
                  Save As...
                </Button>
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  onClick={() => handleDeleteView()}
                  disabled={isSavingView}
                >
                  Delete
                </Button>
              </>
            )}
            {!isEditMode && (
              <Button variant="brand-primary" size="small" onClick={handleCreateView}>
                New View
              </Button>
            )}
            {isEditMode && (
              <Button 
                variant="neutral-secondary" 
                size="small" 
                onClick={() => onSelectView(null)}
              >
                Back to List
              </Button>
            )}
          </div>
        </div>

        {/* Edit Mode: Show name/description fields at top */}
        {isEditMode && selectedView && (
          <div className="w-full flex flex-col gap-4 pt-4 border-t border-solid border-neutral-border">
            <div className="grid grid-cols-2 gap-4">
              <TextField label="View Name *">
                <TextField.Input
                  value={editingName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setEditingName(newName);
                    // Update metadata immediately
                    if (selectedView?.id) {
                      onUpdateView(selectedView.id, { name: newName.trim() });
                    }
                  }}
                  placeholder="Enter view name"
                />
              </TextField>
              <TextField label="Description">
                <TextField.Input
                  value={editingDescription}
                  onChange={(e) => {
                    const newDesc = e.target.value;
                    setEditingDescription(newDesc);
                    // Update metadata immediately
                    if (selectedView?.id) {
                      onUpdateView(selectedView.id, { description: newDesc.trim() || undefined });
                    }
                  }}
                  placeholder="Enter description (optional)"
                />
              </TextField>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingIsGlobal}
                onCheckedChange={(checked) => {
                  setEditingIsGlobal(checked);
                  // Update metadata immediately
                  if (selectedView?.id) {
                    onUpdateView(selectedView.id, { is_global: checked });
                  }
                }}
              />
              <label className="text-body font-body text-default-font">
                Share globally (visible to all users)
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Show error if API is not available */}
      {customViewsError && ((customViewsError as any)?.status === 403 || (customViewsError as any)?.status === 404) ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-body font-body text-default-font">
            Custom Views API is not available yet
          </span>
          <span className="text-caption font-caption text-subtext-color text-center max-w-md">
            The backend API endpoint for custom views is not yet implemented. This feature will be available once the backend is ready.
          </span>
        </div>
      ) : customViewsLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="text-body font-body text-subtext-color">Loading custom views...</span>
        </div>
      ) : !isEditMode ? (
        // List view: Show table of all custom views
        <CustomViewsListTable
          customViews={customViews}
          onEdit={handleEditView}
          onDelete={handleDeleteView}
          onDuplicate={handleDuplicateView}
        />
      ) : customFieldsLoading ? (
        <div className="flex items-center justify-center py-8">
          <span className="text-body font-body text-subtext-color">Loading custom fields...</span>
        </div>
      ) : customFields.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <span className="text-body font-body text-subtext-color">No custom fields available</span>
        </div>
      ) : (
        // Edit view: Show the custom fields configuration table
        // Get tabs list from settings (shared across views)
        <CustomFieldsTable
          key={`${selectedViewId}-${viewUpdateCounter}`}
          customFields={customFields}
          getSetting={viewGetSetting}
          updateSetting={viewUpdateSetting}
          tabsList={viewGetSetting(SETTINGS_KEYS.CUSTOM_FIELD_TABS_LIST, tabsList.length > 0 ? tabsList : ['Default'])}
          newTabInput={newTabInput}
          setNewTabInput={setNewTabInput}
          handleAddTab={handleAddTab}
          customViewId={selectedViewId}
        />
      )}
    </div>
  );
}


