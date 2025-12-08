"use client";

import React from "react";
import { CustomViewsListTable } from "./CustomViewsListTable";
import { ViewEditor } from "./ViewEditor";
import { useDocumentsContext } from "../documents/DocumentsContext";
import { useCustomFields } from "@/lib/api/hooks";
import { Button } from "../Button";
import { useCustomViews } from "@/lib/api/hooks";
import { CustomView } from "@/app/data/custom-view";

interface CustomFieldsTabProps {
  // Kept for compatibility with SettingsModal layout but mostly unused now
  // We might eventually remove these from the parent too
  onClose: () => void;
}

export function CustomFieldsTab({ onClose }: CustomFieldsTabProps) {
  const {
    availableViews,
    activeViewId,
    setActiveViewId,
    isLoadingViews,
    createViewFromCurrent // or verify if we need `create` specific logic
  } = useDocumentsContext();

  const { data: customFieldsData, loading: isLoadingFields } = useCustomFields();
  const customFields = customFieldsData?.results || [];

  const { create: createView, delete: deleteView } = useCustomViews();

  const handleCreateView = async () => {
    // Create a new blank view
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
    try {
      const newView = await createView(newViewData);
      if (newView && newView.id) {
        setActiveViewId(newView.id);
      }
    } catch (e) {
      console.error("Failed to create view", e);
    }
  };

  const handleDuplicate = async (view: CustomView) => {
    try {
      const duplicateData: Omit<CustomView, 'id'> = {
        name: `${view.name} (Copy)`,
        description: view.description,
        is_global: false,
        column_order: view.column_order ? [...view.column_order] : [],
        column_sizing: view.column_sizing ? { ...view.column_sizing } : {},
        column_visibility: view.column_visibility ? { ...view.column_visibility } : {},
        column_display_types: view.column_display_types ? { ...view.column_display_types } : {},
        filter_rules: view.filter_rules ? [...view.filter_rules] : [],
        filter_visibility: view.filter_visibility ? { ...view.filter_visibility } : {},
        column_spanning: view.column_spanning ? { ...view.column_spanning } : {},
        subrow_enabled: view.subrow_enabled,
        subrow_content: view.subrow_content,
        sort_field: view.sort_field,
        sort_reverse: view.sort_reverse,
      };
      await createView(duplicateData);
    } catch (e) {
      console.error("Failed to duplicate view", e);
    }
  };

  const handleDelete = async (view: CustomView) => {
    if (!view.id) return;
    if (confirm(`Are you sure you want to delete "${view.name}"?`)) {
      if (activeViewId === view.id) {
        setActiveViewId(null);
      }
      await deleteView(view.id);
    }
  };

  // If a view is active/selected, show the Editor
  if (activeViewId) {
    return (
      <ViewEditor
        customFields={customFields}
        customFieldsLoading={isLoadingFields}
        onClose={() => setActiveViewId(null)}
      />
    );
  }

  // Otherwise show the list
  return (
    <div className="flex flex-col gap-4 h-full min-h-0 overflow-hidden p-6">
      <div className="flex items-center justify-between w-full flex-none">
        <div className="flex flex-col items-start gap-1">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Custom Views
          </span>
          <span className="text-caption font-caption text-subtext-color">
            Manage your custom document list views
          </span>
        </div>
        <Button variant="brand-primary" size="small" onClick={handleCreateView}>
          New View
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <CustomViewsListTable
          customViews={availableViews}
          onEdit={(view) => setActiveViewId(view.id || null)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
        />
      </div>
    </div>
  );
}
