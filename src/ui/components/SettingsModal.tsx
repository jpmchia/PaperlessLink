"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Switch } from "./Switch";
import { TextField } from "./TextField";
import { Tabs } from "./Tabs";
import { Table } from "./Table";
import { Select } from "./Select";
import { DropdownMenu } from "./DropdownMenu";
import { FeatherX, FeatherChevronDown } from "@subframe/core";
import { IconButton } from "./IconButton";
import { useSettings } from "@/lib/api/hooks/use-settings";
import { useCustomFields } from "@/lib/api/hooks/use-custom-fields";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { CustomField, CustomFieldDataType, DATA_TYPE_LABELS } from "@/app/data/custom-field";
import * as SubframeCore from "@subframe/core";
import * as SubframeUtils from "../utils";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, getSettings, saveSettings, loading } = useSettings();
  const { data: customFieldsData, loading: customFieldsLoading } = useCustomFields();
  
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [tabsList, setTabsList] = useState<string[]>(['Default']);
  const [newTabInput, setNewTabInput] = useState<Record<number, string>>({});
  
  // Drag state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Load settings when modal opens - use cached settings directly
  useEffect(() => {
    if (open && settings?.settings) {
      setFormData(settings.settings);
    }
  }, [open, settings]);

  // Use React Query data directly - it's already cached and fetched automatically
  useEffect(() => {
    if (customFieldsData?.results) {
      setCustomFields(customFieldsData.results);
    }
  }, [customFieldsData]);

  // Load tabs list from settings
  useEffect(() => {
    if (settings?.settings) {
      const savedTabs = getSetting(SETTINGS_KEYS.CUSTOM_FIELD_TABS_LIST, ['Default']);
      if (Array.isArray(savedTabs) && savedTabs.length > 0) {
        setTabsList(savedTabs);
      }
    }
  }, [settings]);

  // Helper function to get edit mode entry type options
  const getEditModeEntryTypeOptions = (): Array<{ value: string; label: string }> => {
    return [
      { value: 'text', label: 'Text' },
      { value: 'url', label: 'URL' },
      { value: 'number', label: 'Number' },
      { value: 'unique-id', label: 'Unique ID' },
      { value: 'boolean', label: 'Boolean' },
      { value: 'multi-select', label: 'Multi-Select' },
      { value: 'date', label: 'Date' },
    ];
  };

  // Helper function to get default edit mode entry type based on data type
  const getDefaultEditModeEntryType = (dataType: CustomFieldDataType): string => {
    switch (dataType) {
      case CustomFieldDataType.Date:
        return 'date';
      case CustomFieldDataType.Url:
        return 'url';
      case CustomFieldDataType.Integer:
      case CustomFieldDataType.Float:
      case CustomFieldDataType.Monetary:
        return 'number';
      case CustomFieldDataType.Boolean:
        return 'boolean';
      case CustomFieldDataType.Select:
        return 'multi-select';
      case CustomFieldDataType.DocumentLink:
        return 'unique-id';
      default:
        return 'text';
    }
  };

  // Function to add a new tab
  const handleAddTab = (fieldId: number, tabName: string) => {
    if (tabName && tabName.trim() && !tabsList.includes(tabName.trim())) {
      const newTabsList = [...tabsList, tabName.trim()];
      setTabsList(newTabsList);
      updateSetting(SETTINGS_KEYS.CUSTOM_FIELD_TABS_LIST, newTabsList);
      updateSetting(`${SETTINGS_KEYS.CUSTOM_FIELD_TAB_PREFIX}${fieldId}`, tabName.trim());
      setNewTabInput((prev) => ({ ...prev, [fieldId]: '' }));
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveSettings(formData);
      
      // Dispatch custom event to notify other components that settings were saved
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('settingsSaved'));
        // Also set localStorage flag for cross-tab communication
        localStorage.setItem('settingsUpdated', Date.now().toString());
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
      // TODO: Show error toast
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const getSetting = (key: string, defaultValue: any = null) => {
    return formData[key] ?? defaultValue;
  };

  // Filter type options based on custom field data type
  const getFilterTypeOptions = (dataType: CustomFieldDataType): Array<{ value: string; label: string }> => {
    switch (dataType) {
      case CustomFieldDataType.Date:
        return [
          { value: 'date-range', label: 'Date Range' },
          { value: 'date', label: 'Single Date' },
          { value: 'populated', label: 'Populated' },
        ];
      case CustomFieldDataType.String:
      case CustomFieldDataType.Url:
      case CustomFieldDataType.LongText:
        return [
          { value: 'text', label: 'Text' },
          { value: 'exact', label: 'Exact Match' },
          { value: 'multi-select', label: 'Multi-Select' },
          { value: 'date-range', label: 'Date Range' },
          { value: 'populated', label: 'Populated' },
        ];
      case CustomFieldDataType.Select:
        return [
          { value: 'multi-select', label: 'Multi-Select' },
          { value: 'single-select', label: 'Single Select' },
          { value: 'date-range', label: 'Date Range' },
          { value: 'populated', label: 'Populated' },
        ];
      case CustomFieldDataType.Integer:
      case CustomFieldDataType.Float:
      case CustomFieldDataType.Monetary:
        return [
          { value: 'numerical', label: 'Numerical' },
          { value: 'range', label: 'Range' },
          { value: 'date-range', label: 'Date Range' },
          { value: 'populated', label: 'Populated' },
        ];
      case CustomFieldDataType.Boolean:
        return [
          { value: 'boolean', label: 'Boolean' },
          { value: 'date-range', label: 'Date Range' },
          { value: 'populated', label: 'Populated' },
        ];
      case CustomFieldDataType.DocumentLink:
        return [
          { value: 'document-link', label: 'Document Link' },
          { value: 'date-range', label: 'Date Range' },
          { value: 'populated', label: 'Populated' },
        ];
      default:
        return [
          { value: 'text', label: 'Text' },
          { value: 'multi-select', label: 'Multi-Select' },
          { value: 'date-range', label: 'Date Range' },
          { value: 'populated', label: 'Populated' },
        ];
    }
  };

  // Table display type options
  const getTableDisplayTypeOptions = (): Array<{ value: string; label: string }> => {
    return [
      { value: 'text', label: 'Text' },
      { value: 'date', label: 'Date' },
      { value: 'url', label: 'URL' },
      { value: 'checkbox', label: 'Checkbox' },
      { value: 'list', label: 'List' },
      { value: 'identifier', label: 'Identifier' },
    ];
  };

  // Get default table display type based on data type
  const getDefaultTableDisplayType = (dataType: CustomFieldDataType): string => {
    switch (dataType) {
      case CustomFieldDataType.Date:
        return 'date';
      case CustomFieldDataType.Url:
        return 'url';
      case CustomFieldDataType.Boolean:
        return 'checkbox';
      case CustomFieldDataType.Select:
        return 'list';
      case CustomFieldDataType.DocumentLink:
        return 'identifier';
      default:
        return 'text';
    }
  };

  // Get default filter type based on data type
  const getDefaultFilterType = (dataType: CustomFieldDataType): string => {
    switch (dataType) {
      case CustomFieldDataType.Date:
        return 'date-range';
      case CustomFieldDataType.String:
      case CustomFieldDataType.Url:
      case CustomFieldDataType.LongText:
        return 'text';
      case CustomFieldDataType.Select:
        return 'multi-select';
      case CustomFieldDataType.Integer:
      case CustomFieldDataType.Float:
      case CustomFieldDataType.Monetary:
        return 'numerical';
      case CustomFieldDataType.Boolean:
        return 'boolean';
      case CustomFieldDataType.DocumentLink:
        return 'document-link';
      default:
        return 'text';
    }
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only handle left mouse button
    // Don't start dragging if clicking on the close button
    if ((e.target as HTMLElement).closest('button')) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // Reset position when modal closes
  useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content 
        className="w-[80vw] max-h-[80vh]"
        style={{
          transform: position.x !== 0 || position.y !== 0 
            ? `translate(${position.x}px, ${position.y}px)` 
            : undefined,
          cursor: isDragging ? 'grabbing' : undefined,
        }}
      >
        <div className="flex flex-col items-start gap-4 w-full p-6 h-full max-h-[80vh] overflow-hidden">
          {/* Header - Draggable */}
          <div 
            className="flex items-center justify-between w-full cursor-grab active:cursor-grabbing select-none -mx-6 -mt-6 px-6 pt-6 flex-none"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-heading-2 font-heading-2 text-default-font pointer-events-none">
              Settings
            </h2>
            <div onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <IconButton
                size="small"
                icon={<FeatherX />}
                onClick={() => onOpenChange(false)}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs className="w-full flex-none">
            <Tabs.Item
              active={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            >
              General
            </Tabs.Item>
            <Tabs.Item
              active={activeTab === "appearance"}
              onClick={() => setActiveTab("appearance")}
            >
              Appearance
            </Tabs.Item>
            <Tabs.Item
              active={activeTab === "documents"}
              onClick={() => setActiveTab("documents")}
            >
              Documents
            </Tabs.Item>
            <Tabs.Item
              active={activeTab === "notifications"}
              onClick={() => setActiveTab("notifications")}
            >
              Notifications
            </Tabs.Item>
            <Tabs.Item
              active={activeTab === "custom-fields"}
              onClick={() => setActiveTab("custom-fields")}
            >
              Custom Fields
            </Tabs.Item>
          </Tabs>

          {/* Tab Content */}
          <div className="flex flex-col gap-4 w-full mt-4 flex-1 min-h-0 overflow-hidden">
            {activeTab === "general" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Slim Sidebar
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Use a minimized sidebar by default
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.SLIM_SIDEBAR, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.SLIM_SIDEBAR, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Bulk Edit Confirmation Dialogs
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Show confirmation dialogs for bulk edit operations
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.BULK_EDIT_CONFIRMATION_DIALOGS, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.BULK_EDIT_CONFIRMATION_DIALOGS, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Apply Bulk Edit on Close
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Automatically apply bulk edits when closing the editor
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.BULK_EDIT_APPLY_ON_CLOSE, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.BULK_EDIT_APPLY_ON_CLOSE, checked)
                    }
                  />
                </div>

                <div className="flex flex-col items-start gap-2">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Documents Per Page
                  </span>
                  <TextField
                    variant="outline"
                    label=""
                    helpText=""
                    className="w-32"
                  >
                    <TextField.Input
                      type="number"
                      value={getSetting(SETTINGS_KEYS.DOCUMENT_LIST_SIZE, 50).toString()}
                      onChange={(e) =>
                        updateSetting(SETTINGS_KEYS.DOCUMENT_LIST_SIZE, parseInt(e.target.value) || 50)
                      }
                    />
                  </TextField>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Dark Mode
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Enable dark mode theme
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DARK_MODE_ENABLED, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DARK_MODE_ENABLED, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Use System Theme
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Automatically match system dark mode preference
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DARK_MODE_USE_SYSTEM, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DARK_MODE_USE_SYSTEM, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Invert Thumbnails in Dark Mode
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Invert document thumbnails when using dark mode
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DARK_MODE_THUMB_INVERTED, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DARK_MODE_THUMB_INVERTED, checked)
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col items-start gap-2 mb-2">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Document Filters
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Choose which filters to display on the Documents page
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Date Range
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter documents by creation, modification, or added date
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_DATE_RANGE, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_DATE_RANGE, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Category (Document Type)
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter by document type/category
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CATEGORY, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CATEGORY, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Correspondent
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter by document correspondent/sender
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CORRESPONDENT, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_CORRESPONDENT, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Tags
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter documents by tags
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_TAGS, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_TAGS, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Storage Path
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter by storage location/path
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STORAGE_PATH, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STORAGE_PATH, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Owner
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter documents by owner/user
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_OWNER, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_OWNER, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Status
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter by document status (active, archived, inbox)
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STATUS, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_STATUS, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Archive Serial Number (ASN)
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Filter by archive serial number
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_ASN, false)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.DOCUMENTS_FILTER_ASN, checked)
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      New Document Notifications
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Show notifications when new documents are processed
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_NEW_DOCUMENT, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_NEW_DOCUMENT, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Success Notifications
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Show notifications for successful operations
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUCCESS, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUCCESS, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Failure Notifications
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Show notifications for failed operations
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_FAILED, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_FAILED, checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Suppress Notifications on Dashboard
                    </span>
                    <span className="text-caption font-caption text-subtext-color">
                      Hide notifications when viewing the dashboard
                    </span>
                  </div>
                  <Switch
                    checked={getSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUPPRESS_ON_DASHBOARD, true)}
                    onCheckedChange={(checked) =>
                      updateSetting(SETTINGS_KEYS.NOTIFICATIONS_CONSUMER_SUPPRESS_ON_DASHBOARD, checked)
                    }
                  />
                </div>
              </div>
            )}

            {activeTab === "custom-fields" && (
              <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden">
                <div className="flex flex-col items-start gap-2 mb-2 flex-none">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Custom Fields Configuration
                  </span>
                  <span className="text-caption font-caption text-subtext-color">
                    Configure which custom fields are available as filters and table columns
                  </span>
                </div>

                {customFieldsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-body font-body text-subtext-color">Loading custom fields...</span>
                  </div>
                ) : customFields.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="text-body font-body text-subtext-color">No custom fields available</span>
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto overflow-y-auto flex-1 min-h-0 relative">
                    <Table
                      header={
                        <Table.HeaderRow>
                          <Table.HeaderCell>Field Name</Table.HeaderCell>
                          <Table.HeaderCell>Data Type</Table.HeaderCell>
                          <Table.HeaderCell>Show as Filter</Table.HeaderCell>
                          <Table.HeaderCell>Filter Type</Table.HeaderCell>
                          <Table.HeaderCell>Show in Table</Table.HeaderCell>
                          <Table.HeaderCell>Table Display Type</Table.HeaderCell>
                          <Table.HeaderCell>Show in Edit Mode</Table.HeaderCell>
                          <Table.HeaderCell>Edit Mode Entry Type</Table.HeaderCell>
                          <Table.HeaderCell>Tab</Table.HeaderCell>
                        </Table.HeaderRow>
                      }
                    >
                      {customFields.map((field) => {
                        const filterKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_PREFIX}${field.id}`;
                        const filterTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_FILTER_TYPE_PREFIX}${field.id}`;
                        const tableColumnKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_COLUMN_PREFIX}${field.id}`;
                        const tableDisplayTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TABLE_DISPLAY_TYPE_PREFIX}${field.id}`;
                        const editModeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_PREFIX}${field.id}`;
                        const editModeEntryTypeKey = `${SETTINGS_KEYS.CUSTOM_FIELD_EDIT_MODE_ENTRY_TYPE_PREFIX}${field.id}`;
                        const tabKey = `${SETTINGS_KEYS.CUSTOM_FIELD_TAB_PREFIX}${field.id}`;
                        const dataTypeLabel = DATA_TYPE_LABELS.find(
                          (dt) => dt.id === field.data_type
                        )?.name || field.data_type;
                        const isFilterEnabled = getSetting(filterKey, false);
                        const isTableColumnEnabled = getSetting(tableColumnKey, false);
                        const isEditModeEnabled = getSetting(editModeKey, false);
                        const filterTypeOptions = getFilterTypeOptions(field.data_type);
                        const tableDisplayTypeOptions = getTableDisplayTypeOptions();
                        const editModeEntryTypeOptions = getEditModeEntryTypeOptions();
                        const currentFilterType = getSetting(filterTypeKey, getDefaultFilterType(field.data_type));
                        const currentTableDisplayType = getSetting(tableDisplayTypeKey, getDefaultTableDisplayType(field.data_type));
                        const currentEditModeEntryType = getSetting(editModeEntryTypeKey, getDefaultEditModeEntryType(field.data_type));
                        const currentTab = getSetting(tabKey, 'Default');

                        return (
                          <Table.Row key={field.id}>
                            <Table.Cell>
                              <span className="text-body-bold font-body-bold text-default-font">
                                {field.name}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <span className="text-body font-body text-subtext-color">
                                {dataTypeLabel}
                              </span>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={isFilterEnabled}
                                  onCheckedChange={(checked) =>
                                    updateSetting(filterKey, checked)
                                  }
                                />
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center">
                                {isFilterEnabled ? (
                                  <SubframeCore.DropdownMenu.Root>
                                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                                      <Button
                                        variant="neutral-secondary"
                                        size="small"
                                        iconRight={<FeatherChevronDown />}
                                        className="w-40 justify-between"
                                      >
                                        {filterTypeOptions.find(opt => opt.value === currentFilterType)?.label || "Select type"}
                                      </Button>
                                    </SubframeCore.DropdownMenu.Trigger>
                                  <SubframeCore.DropdownMenu.Portal>
                                    <SubframeCore.DropdownMenu.Content
                                      side="bottom"
                                      align="start"
                                      sideOffset={4}
                                      asChild={true}
                                      style={{ zIndex: 10001 }}
                                    >
                                      <DropdownMenu className="z-[10001]">
                                        {filterTypeOptions.map((option) => (
                                          <DropdownMenu.DropdownItem
                                            key={option.value}
                                            icon={null}
                                            onClick={() => updateSetting(filterTypeKey, option.value)}
                                          >
                                            {option.label}
                                          </DropdownMenu.DropdownItem>
                                        ))}
                                      </DropdownMenu>
                                    </SubframeCore.DropdownMenu.Content>
                                  </SubframeCore.DropdownMenu.Portal>
                                  </SubframeCore.DropdownMenu.Root>
                                ) : (
                                  <Button
                                    variant="neutral-secondary"
                                    size="small"
                                    disabled={true}
                                    iconRight={<FeatherChevronDown />}
                                    className="w-40 justify-between"
                                  >
                                    {filterTypeOptions.find(opt => opt.value === currentFilterType)?.label || "Select type"}
                                  </Button>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={isTableColumnEnabled}
                                  onCheckedChange={(checked) =>
                                    updateSetting(tableColumnKey, checked)
                                  }
                                />
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center">
                                {isTableColumnEnabled ? (
                                  <SubframeCore.DropdownMenu.Root>
                                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                                      <Button
                                        variant="neutral-secondary"
                                        size="small"
                                        iconRight={<FeatherChevronDown />}
                                        className="w-40 justify-between"
                                      >
                                        {tableDisplayTypeOptions.find(opt => opt.value === currentTableDisplayType)?.label || "Select type"}
                                      </Button>
                                    </SubframeCore.DropdownMenu.Trigger>
                                  <SubframeCore.DropdownMenu.Portal>
                                    <SubframeCore.DropdownMenu.Content
                                      side="bottom"
                                      align="start"
                                      sideOffset={4}
                                      asChild={true}
                                      style={{ zIndex: 10001 }}
                                    >
                                      <DropdownMenu className="z-[10001]">
                                        {tableDisplayTypeOptions.map((option) => (
                                          <DropdownMenu.DropdownItem
                                            key={option.value}
                                            icon={null}
                                            onClick={() => updateSetting(tableDisplayTypeKey, option.value)}
                                          >
                                            {option.label}
                                          </DropdownMenu.DropdownItem>
                                        ))}
                                      </DropdownMenu>
                                    </SubframeCore.DropdownMenu.Content>
                                  </SubframeCore.DropdownMenu.Portal>
                                  </SubframeCore.DropdownMenu.Root>
                                ) : (
                                  <Button
                                    variant="neutral-secondary"
                                    size="small"
                                    disabled={true}
                                    iconRight={<FeatherChevronDown />}
                                    className="w-40 justify-between"
                                  >
                                    {tableDisplayTypeOptions.find(opt => opt.value === currentTableDisplayType)?.label || "Select type"}
                                  </Button>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={isEditModeEnabled}
                                  onCheckedChange={(checked) =>
                                    updateSetting(editModeKey, checked)
                                  }
                                />
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center">
                                {isEditModeEnabled ? (
                                  <SubframeCore.DropdownMenu.Root>
                                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                                      <Button
                                        variant="neutral-secondary"
                                        size="small"
                                        iconRight={<FeatherChevronDown />}
                                        className="w-40 justify-between"
                                      >
                                        {editModeEntryTypeOptions.find(opt => opt.value === currentEditModeEntryType)?.label || "Select type"}
                                      </Button>
                                    </SubframeCore.DropdownMenu.Trigger>
                                    <SubframeCore.DropdownMenu.Portal>
                                      <SubframeCore.DropdownMenu.Content
                                        side="bottom"
                                        align="start"
                                        sideOffset={4}
                                        asChild={true}
                                        style={{ zIndex: 10001 }}
                                      >
                                        <DropdownMenu className="z-[10001]">
                                          {editModeEntryTypeOptions.map((option) => (
                                            <DropdownMenu.DropdownItem
                                              key={option.value}
                                              icon={null}
                                              onClick={() => updateSetting(editModeEntryTypeKey, option.value)}
                                            >
                                              {option.label}
                                            </DropdownMenu.DropdownItem>
                                          ))}
                                        </DropdownMenu>
                                      </SubframeCore.DropdownMenu.Content>
                                    </SubframeCore.DropdownMenu.Portal>
                                  </SubframeCore.DropdownMenu.Root>
                                ) : (
                                  <Button
                                    variant="neutral-secondary"
                                    size="small"
                                    disabled={true}
                                    iconRight={<FeatherChevronDown />}
                                    className="w-40 justify-between"
                                  >
                                    {editModeEntryTypeOptions.find(opt => opt.value === currentEditModeEntryType)?.label || "Select type"}
                                  </Button>
                                )}
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex items-center justify-center gap-2">
                                {isEditModeEnabled ? (
                                  <div className="flex items-center gap-2">
                                    <SubframeCore.DropdownMenu.Root>
                                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                                        <Button
                                          variant="neutral-secondary"
                                          size="small"
                                          iconRight={<FeatherChevronDown />}
                                          className="w-32 justify-between"
                                        >
                                          {currentTab}
                                        </Button>
                                      </SubframeCore.DropdownMenu.Trigger>
                                      <SubframeCore.DropdownMenu.Portal>
                                        <SubframeCore.DropdownMenu.Content
                                          side="bottom"
                                          align="start"
                                          sideOffset={4}
                                          asChild={true}
                                          style={{ zIndex: 10001 }}
                                        >
                                          <DropdownMenu className="z-[10001]">
                                            {tabsList.map((tab) => (
                                              <DropdownMenu.DropdownItem
                                                key={tab}
                                                icon={null}
                                                onClick={() => updateSetting(tabKey, tab)}
                                              >
                                                {tab}
                                              </DropdownMenu.DropdownItem>
                                            ))}
                                            <DropdownMenu.DropdownDivider />
                                            <div className="px-3 py-2">
                                              <TextField
                                                placeholder="Enter new tab name"
                                                value={newTabInput[field.id] || ''}
                                                onChange={(e) =>
                                                  setNewTabInput((prev) => ({
                                                    ...prev,
                                                    [field.id]: e.target.value,
                                                  }))
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && newTabInput[field.id]) {
                                                    handleAddTab(field.id, newTabInput[field.id]);
                                                    e.preventDefault();
                                                  }
                                                }}
                                              >
                                                <TextField.Input />
                                              </TextField>
                                              <Button
                                                variant="brand-primary"
                                                size="small"
                                                className="mt-2 w-full"
                                                onClick={() => {
                                                  if (newTabInput[field.id]) {
                                                    handleAddTab(field.id, newTabInput[field.id]);
                                                  }
                                                }}
                                              >
                                                Add Tab
                                              </Button>
                                            </div>
                                          </DropdownMenu>
                                        </SubframeCore.DropdownMenu.Content>
                                      </SubframeCore.DropdownMenu.Portal>
                                    </SubframeCore.DropdownMenu.Root>
                                  </div>
                                ) : (
                                  <Button
                                    variant="neutral-secondary"
                                    size="small"
                                    disabled={true}
                                    iconRight={<FeatherChevronDown />}
                                    className="w-32 justify-between"
                                  >
                                    {currentTab}
                                  </Button>
                                )}
                              </div>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 w-full pt-4 border-t border-solid border-neutral-border flex-none">
            <Button
              variant="neutral-secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              variant="brand-primary"
              onClick={handleSave}
              disabled={saving || loading}
            >
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

