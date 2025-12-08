"use client";

import React, { useState, useEffect, useRef, useCallback, startTransition } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Tabs } from "./Tabs";
import {
  FeatherX,
  FeatherSettings,
  FeatherFileText,
  FeatherList
} from "@subframe/core";
import { IconButton } from "./IconButton";
import { useSettings } from "@/lib/api/hooks/use-settings";
import { useCustomFields } from "@/lib/api/hooks/use-custom-fields";
import { SETTINGS_KEYS } from "@/app/data/ui-settings";
import { CustomField } from "@/app/data/custom-field";
import { useDraggableDialog } from "./settings/useDraggableDialog";
import { GeneralSettingsTab } from "./settings/GeneralSettingsTab";
import { AppearanceTab } from "./settings/AppearanceTab";
import { DocumentsTab } from "./settings/DocumentsTab";
import { NotificationsTab } from "./settings/NotificationsTab";
import { CustomFieldsTab } from "./settings/CustomFieldsTab";


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
  const { position, isDragging, handleMouseDown } = useDraggableDialog(open);

  // Track previous open state to detect when modal opens
  const prevOpenRef = useRef(open);

  // Load settings when modal opens - only initialize when modal first opens
  useEffect(() => {
    const wasClosed = !prevOpenRef.current;
    const isNowOpen = open;

    if (wasClosed && isNowOpen) {
      // Modal just opened - initialize with current settings
      if (settings?.settings) {
        setFormData(settings.settings);
      }
    } else if (!isNowOpen && prevOpenRef.current) {
      // Modal just closed - reset formData
      setFormData({});

      // Dispatch event to notify that custom views may have been updated (legacy compat)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('customViewsUpdated'));
        localStorage.setItem('customViewsUpdated', Date.now().toString());
      }
    }

    prevOpenRef.current = open;
  }, [open, settings?.settings]);

  // Use React Query data directly
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
        localStorage.setItem('settingsUpdated', Date.now().toString());
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = useCallback((key: string, value: any) => {
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    });
  }, []);

  const getSetting = (key: string, defaultValue: any = null) => {
    return formData[key] ?? defaultValue;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        className="w-[80vw] h-[80vh] p-0 gap-0 overflow-hidden flex flex-col grow"
        onInteractOutside={(e) => {
          // Prevent closing when interacting with dropdowns or other portals
          const isDropdown = (e.target as Element)?.closest('[role="menu"]');
          const isSelect = (e.target as Element)?.closest('[role="listbox"]');
          if (isDropdown || isSelect) {
            e.preventDefault();
          }
        }}
        // Add style for draggable implementation
        style={{
          position: 'fixed',
          left: '50%', // Start centered
          top: '50%',  // Start centered
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`, // Combine centering with drag offset
          margin: 0,
          transition: isDragging ? 'none' : undefined,
          userSelect: isDragging ? 'none' : undefined,
        }}
      >
        <div
          className="w-full flex items-center justify-between p-4 pl-6 border-b border-solid border-neutral-border cursor-grab active:cursor-grabbing bg-default-background z-10"
          onMouseDown={handleMouseDown}
        >
          <span className="text-heading-3 font-heading-3 text-default-font pointer-events-none">
            Settings
          </span>

          <IconButton
            size="medium"
            icon={<FeatherX />}
            onClick={() => onOpenChange(false)}
          />
        </div>

        <div className="flex flex-col flex-1 min-h-0 w-full">
          <div className="px-6 border-b border-solid gap-6 border-neutral-border flex-none">
            <Tabs>
              <Tabs.Item
                active={activeTab === "general"}
                onClick={() => setActiveTab("general")}
                icon={<FeatherSettings />}
              >
                General
              </Tabs.Item>
              <Tabs.Item
                active={activeTab === "documents"}
                onClick={() => setActiveTab("documents")}
                icon={<FeatherFileText />}
              >
                Documents
              </Tabs.Item>
              <Tabs.Item
                active={activeTab === "customFields"}
                onClick={() => setActiveTab("customFields")}
                icon={<FeatherList />}
              >
                Custom Views
              </Tabs.Item>
            </Tabs>
          </div>

          <div className="flex-1 min-h-0 bg-default-background relative">
            {activeTab === "general" && (
              <div className="absolute inset-0 overflow-auto p-8">
                <div className="flex flex-col gap-8 max-w-[50em]">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-heading-3 font-heading-3 text-default-font">General</span>
                    </div>
                    <GeneralSettingsTab
                      getSetting={getSetting}
                      updateSetting={updateSetting}
                    />
                  </div>

                  <div className="w-full h-px bg-neutral-border" />

                  <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-heading-3 font-heading-3 text-default-font">Appearance</span>
                    </div>
                    <AppearanceTab
                      getSetting={getSetting}
                      updateSetting={updateSetting}
                    />
                  </div>

                  <div className="w-full h-px bg-neutral-border" />
                </div>
              </div>
            )}
            {activeTab === "documents" && (
              <div className="absolute inset-0 overflow-auto p-8">
                <div className="flex flex-col gap-8 max-w-[50em]">
                  <DocumentsTab
                    getSetting={getSetting}
                    updateSetting={updateSetting}
                  />
                </div>
              </div>
            )}
            {activeTab === "customFields" && (
              <div className="absolute inset-0 overflow-hidden p-0">
                <CustomFieldsTab
                  onClose={() => onOpenChange(false)}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer for non-CustomView tabs */}
        {activeTab !== "customFields" && (
          <div className="flex items-center justify-end gap-2 p-6 border-t border-solid border-neutral-border bg-default-background z-10">
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
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
