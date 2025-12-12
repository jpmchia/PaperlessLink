"use client";

import React from "react";
import { CustomViewsListTable } from "./CustomViewsListTable";
import { ViewEditor } from "./ViewEditor";
import { useDocumentsContext } from "../documents/DocumentsContext";
import { useCustomFields } from "@/lib/api/hooks";
import { Button } from "../Button";
import { useCustomViews } from "@/lib/api/hooks";
import { CustomView } from "@/app/data/custom-view";
import { Alert } from "../Alert";
import { FeatherAlertCircle, FeatherRefreshCw } from "@subframe/core";
import { detectError } from "@/lib/utils/errorUtils";

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

  const { create: createView, delete: deleteView, isCreating, error: customViewsError, refetch: refetchCustomViews } = useCustomViews();

  // Debug logging
  React.useEffect(() => {
    console.log('[CustomFieldsTab] availableViews:', availableViews);
    console.log('[CustomFieldsTab] isLoadingViews:', isLoadingViews);
    console.log('[CustomFieldsTab] activeViewId:', activeViewId);
  }, [availableViews, isLoadingViews, activeViewId]);

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
      console.log('[CustomFieldsTab] Creating new view...', newViewData);
      const newView = await createView(newViewData);
      console.log('[CustomFieldsTab] View created successfully:', newView);
      if (newView && newView.id) {
        console.log('[CustomFieldsTab] Setting active view ID to:', newView.id);
        setActiveViewId(newView.id);
      } else {
        console.warn('[CustomFieldsTab] Created view but no ID returned:', newView);
        alert('View created but could not be opened. Please refresh the page.');
      }
    } catch (e: any) {
      console.error("[CustomFieldsTab] Failed to create view", e);
      const errorInfo = detectError(e);
      alert(`Failed to create view: ${errorInfo.userMessage}`);
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
      console.log('[CustomFieldsTab] Duplicating view...', duplicateData);
      const duplicatedView = await createView(duplicateData);
      console.log('[CustomFieldsTab] View duplicated successfully:', duplicatedView);
    } catch (e: any) {
      console.error("[CustomFieldsTab] Failed to duplicate view", e);
      const errorInfo = detectError(e);
      alert(`Failed to duplicate view: ${errorInfo.userMessage}`);
    }
  };

  const handleDelete = async (view: CustomView) => {
    if (!view.id) return;
    if (confirm(`Are you sure you want to delete "${view.name}"?`)) {
      try {
        await deleteView(view.id);
        // Only deselect the view after successful deletion
        if (activeViewId === view.id) {
          setActiveViewId(null);
        }
      } catch (e: any) {
        console.error("[CustomFieldsTab] Failed to delete view", e);
        const errorInfo = detectError(e);
        alert(`Failed to delete view: ${errorInfo.userMessage}`);
      }
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
  const errorInfo = customViewsError ? detectError(customViewsError) : null;

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
        <Button 
          variant="brand-primary" 
          size="small" 
          onClick={handleCreateView}
          disabled={isCreating || !!customViewsError}
        >
          {isCreating ? "Creating..." : "New View"}
        </Button>
      </div>

      {/* Error Alert */}
      {errorInfo && (
        <Alert
          variant="error"
          icon={<FeatherAlertCircle />}
          title={errorInfo.type === 'backend-unavailable' || errorInfo.type === 'network' 
            ? "Backend Service Unavailable" 
            : "Error Loading Custom Views"}
          description={
            <div className="flex flex-col gap-2">
              <span>{errorInfo.userMessage}</span>
              {errorInfo.actionable && (
                <div className="mt-2">
                  <Button
                    variant="neutral-tertiary"
                    size="small"
                    icon={<FeatherRefreshCw />}
                    onClick={() => refetchCustomViews()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </div>
          }
        />
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {isLoadingViews ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-body font-body text-subtext-color">
              Loading custom views...
            </span>
          </div>
        ) : errorInfo ? (
          // Show error state for ALL error types, not just network/backend-unavailable
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="text-body font-body text-subtext-color text-center">
              {errorInfo.type === 'backend-unavailable' || errorInfo.type === 'network'
                ? 'Unable to load custom views. Please check that the Paperless Link Service is running and accessible.'
                : errorInfo.userMessage}
            </span>
            {errorInfo.actionable && (
              <Button
                variant="neutral-tertiary"
                size="small"
                icon={<FeatherRefreshCw />}
                onClick={() => refetchCustomViews()}
              >
                {errorInfo.type === 'backend-unavailable' || errorInfo.type === 'network'
                  ? 'Retry Connection'
                  : 'Retry'}
              </Button>
            )}
          </div>
        ) : (
          <CustomViewsListTable
            customViews={availableViews}
            onEdit={(view) => setActiveViewId(view.id || null)}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        )}
      </div>
    </div>
  );
}
