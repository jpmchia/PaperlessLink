"use client";

import React, { useState, useEffect, useMemo } from "react";
import { CustomField } from "@/app/data/custom-field";
import { CustomView } from "@/app/data/custom-view";
import { CustomFieldsTable } from "./CustomFieldsTable";
import { Button } from "../Button";
import { DropdownMenu } from "../DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { CustomViewEditor } from "./CustomViewEditor";
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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingView, setEditingView] = useState<CustomView | null>(null);

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
  const viewGetSetting = useMemo(() => {
    return (key: string, defaultValue: any = null) => {
      if (!selectedView) {
        return defaultValue;
      }
      
      // Map settings keys to custom view properties
      if (key === SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER) {
        return selectedView.column_order || defaultValue;
      }
      
      // Handle built-in field visibility
      if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX, '');
        return selectedView.column_visibility?.[fieldId] ?? defaultValue;
      }
      
      // Handle built-in field column width
      if (key.startsWith('general-settings:documents:built-in-field:column-width:')) {
        const fieldId = key.replace('general-settings:documents:built-in-field:column-width:', '');
        return selectedView.column_sizing?.[fieldId] || defaultValue;
      }
      
      // Handle custom field table column visibility
      if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX)) {
        const fieldId = parseInt(key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX, ''), 10);
        if (!isNaN(fieldId)) {
          // Check if field is in column_order
          return selectedView.column_order?.includes(fieldId) || selectedView.column_order?.includes(`customField_${fieldId}`) || defaultValue;
        }
      }
      
      // Handle custom field display type
      if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
        return selectedView.column_display_types?.[fieldId] || defaultValue;
      }
      
      // Handle custom field column width
      if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX, '');
        return selectedView.column_sizing?.[`customField_${fieldId}`] || defaultValue;
      }
      
      // Handle custom field display order
      if (key === SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER) {
        // Extract custom field IDs from column_order
        const customFieldIds = (selectedView.column_order || [])
          .filter(id => typeof id === 'number')
          .map(id => id as number);
        return customFieldIds.length > 0 ? customFieldIds : defaultValue;
      }
      
      // Default to global settings for other keys
      return getSetting(key, defaultValue);
    };
  }, [selectedView, getSetting]);

  const viewUpdateSetting = useMemo(() => {
    return (key: string, value: any) => {
      if (!selectedView || !selectedView.id) {
        // If no view selected, update global settings
        updateSetting(key, value);
        return;
      }

      // Build update object for the custom view
      const updateData: Partial<CustomView> = {};
      
      if (key === SETTINGS_KEYS.DOCUMENT_LIST_COLUMN_ORDER) {
        updateData.column_order = value;
      } else if (key.startsWith(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.BUILT_IN_FIELD_TABLE_COLUMN_PREFIX, '');
        updateData.column_visibility = {
          ...selectedView.column_visibility,
          [fieldId]: value,
        };
      } else if (key.startsWith('general-settings:documents:built-in-field:column-width:')) {
        const fieldId = key.replace('general-settings:documents:built-in-field:column-width:', '');
        updateData.column_sizing = {
          ...selectedView.column_sizing,
          [fieldId]: value,
        };
      } else if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX)) {
        // This is handled through column_order changes
        // When a field is enabled/disabled, update column_order
        const fieldId = parseInt(key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX, ''), 10);
        if (!isNaN(fieldId)) {
          const currentOrder = selectedView.column_order || [];
          if (value === true) {
            // Add to order if not present
            if (!currentOrder.includes(fieldId) && !currentOrder.includes(`customField_${fieldId}`)) {
              updateData.column_order = [...currentOrder, fieldId];
            }
          } else {
            // Remove from order
            updateData.column_order = currentOrder.filter(
              id => id !== fieldId && id !== `customField_${fieldId}`
            );
          }
        }
      } else if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX, '');
        updateData.column_display_types = {
          ...selectedView.column_display_types,
          [fieldId]: value,
        };
      } else if (key.startsWith(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX)) {
        const fieldId = key.replace(SETTINGS_KEYS.CUSTOM_FIELD_COLUMN_WIDTH_PREFIX, '');
        updateData.column_sizing = {
          ...selectedView.column_sizing,
          [`customField_${fieldId}`]: value,
        };
      } else if (key === SETTINGS_KEYS.CUSTOM_FIELD_DISPLAY_ORDER) {
        // Update column_order with new custom field order
        const builtInFields = (selectedView.column_order || []).filter(id => typeof id === 'string');
        updateData.column_order = [...builtInFields, ...(value as number[])];
      } else {
        // For other settings, update global settings
        updateSetting(key, value);
        return;
      }

      // Update the custom view (works for both saved views and local drafts)
      if (Object.keys(updateData).length > 0 && selectedView.id !== undefined) {
        onUpdateView(selectedView.id, updateData);
      }
    };
  }, [selectedView, updateSetting, onUpdateView]);

  const handleCreateView = () => {
    setEditingView(null);
    setEditorOpen(true);
  };

  const handleEditView = () => {
    if (selectedView) {
      setEditingView(selectedView);
      setEditorOpen(true);
    }
  };

  const handleDeleteView = async () => {
    if (!selectedViewId || !selectedView) return;
    
    // For local drafts, just remove them - no API call needed
    if (typeof selectedViewId === 'string' && selectedViewId.startsWith('draft-')) {
      if (window.confirm(`Are you sure you want to delete draft view "${selectedView.name}"? This action cannot be undone.`)) {
        onDeleteView(selectedViewId);
        onSelectView(null);
      }
      return;
    }
    
    // For saved views, delete via API
    if (window.confirm(`Are you sure you want to delete "${selectedView.name}"? This action cannot be undone.`)) {
      try {
        await onDeleteView(selectedViewId);
        onSelectView(null);
      } catch (error) {
        // Error already handled in mutation
      }
    }
  };

  const handleSaveEditor = async (viewData: Omit<CustomView, 'id'>) => {
    if (editingView?.id) {
      await onUpdateView(editingView.id, viewData);
    } else {
      await onSaveView(viewData);
    }
    setEditorOpen(false);
    setEditingView(null);
  };

  return (
    <>
      <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
        <div className="flex flex-col items-start gap-2 mb-2 flex-none">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col items-start gap-1">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Custom Views
              </span>
              <span className="text-caption font-caption text-subtext-color">
                Configure custom document list views with column order, sizing, and filters
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedView && onSaveViewChanges && onRevertViewChanges && (
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
                        // Error is already handled in handleSaveViewChanges
                        // This catch prevents unhandled promise rejection
                        console.error("Error saving view changes:", error);
                      }
                    }}
                    disabled={!hasUnsavedViewChanges || isSavingView}
                  >
                    {isSavingView ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              )}
              <Button variant="brand-primary" size="small" onClick={handleCreateView}>
                New View
              </Button>
            </div>
          </div>

          {/* View Selector */}
          <div className="flex items-center gap-2 w-full mt-2">
            <label className="text-body font-body text-default-font whitespace-nowrap">
              Editing View:
            </label>
            <SubframeCore.DropdownMenu.Root>
              <SubframeCore.DropdownMenu.Trigger asChild={true}>
                <Button variant="neutral-secondary" size="small">
                  {selectedView ? selectedView.name : "Select a view..."}
                </Button>
              </SubframeCore.DropdownMenu.Trigger>
              <SubframeCore.DropdownMenu.Portal>
                <SubframeCore.DropdownMenu.Content
                  side="bottom"
                  align="start"
                  sideOffset={4}
                  asChild={true}
                >
                  <DropdownMenu>
                    <DropdownMenu.DropdownItem
                      onClick={() => onSelectView(null)}
                      icon={null}
                    >
                      Create New View
                    </DropdownMenu.DropdownItem>
                    <DropdownMenu.DropdownDivider />
                {customViews.map((view) => {
                  // Handle both number IDs (saved) and string IDs (local drafts)
                  const viewId = view.id as number | string | undefined;
                  const isDraft = typeof viewId === 'string' && viewId.startsWith('draft-');
                  return (
                    <DropdownMenu.DropdownItem
                      key={String(viewId ?? `view-${view.name}`)}
                      onClick={() => viewId !== undefined && onSelectView(viewId)}
                      icon={null}
                    >
                      {view.name}
                      {isDraft && " (Draft)"}
                      {view.is_global && " (Global)"}
                    </DropdownMenu.DropdownItem>
                  );
                })}
                  </DropdownMenu>
                </SubframeCore.DropdownMenu.Content>
              </SubframeCore.DropdownMenu.Portal>
            </SubframeCore.DropdownMenu.Root>

            {selectedView && (
              <>
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  onClick={handleEditView}
                >
                  Edit
                </Button>
                <Button
                  variant="neutral-tertiary"
                  size="small"
                  onClick={handleDeleteView}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
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
        ) : customFieldsLoading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-body font-body text-subtext-color">Loading custom fields...</span>
          </div>
        ) : customFields.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-body font-body text-subtext-color">No custom fields available</span>
          </div>
        ) : selectedViewId === null && !selectedView ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-body font-body text-subtext-color">
              Select a view from the dropdown above or create a new one to configure it
            </span>
          </div>
        ) : (
          <CustomFieldsTable
            customFields={customFields}
            getSetting={selectedView ? viewGetSetting : getSetting}
            updateSetting={selectedView ? viewUpdateSetting : updateSetting}
            tabsList={tabsList}
            newTabInput={newTabInput}
            setNewTabInput={setNewTabInput}
            handleAddTab={handleAddTab}
            customViewId={selectedViewId}
          />
        )}
      </div>

      {/* View Editor Modal */}
      <CustomViewEditor
        open={editorOpen}
        view={editingView}
        onSave={handleSaveEditor}
        onCancel={() => {
          setEditorOpen(false);
          setEditingView(null);
        }}
        isSaving={isSavingView}
      />
    </>
  );
}


