"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { CustomView } from "@/app/data/custom-view";
import { TableConfig } from "../DocumentsContext";
import { useCustomViews } from "@/lib/api/hooks";
import {
    normalizeColumnOrder,
    normalizeColumnSizing,
    normalizeColumnVisibility,
    normalizeColumnSpanning
} from "@/ui/utils/columnIdUtils";

const DEFAULT_CONFIG: TableConfig = {
    columnOrder: [],
    columnSizing: {},
    columnVisibility: {},
    columnDisplayTypes: {},
    filterVisibility: {},
    filterTypes: {},
    editModeSettings: {},
    columnSpanning: {},
    subrowEnabled: false,
    subrowContent: 'summary',
    sorting: []
};

const STORAGE_KEY_ACTIVE_VIEW = 'paperless_active_view_id';

export function useActiveView() {
    const { customViews, isLoading: isLoadingViews, update: updateView, create: createView } = useCustomViews();

    // 1. Active View ID State
    const [activeViewId, setActiveViewIdState] = useState<number | string | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_VIEW);
            if (saved) {
                // Try parsing as number (for saved views)
                const num = parseInt(saved, 10);
                return isNaN(num) ? saved : num; // Return number if valid, else string (drafts)
            }
        }
        return null;
    });

    // Persist View ID
    const setActiveViewId = useCallback((id: number | string | null) => {
        setActiveViewIdState(id);
        if (typeof window !== 'undefined') {
            if (id === null) {
                localStorage.removeItem(STORAGE_KEY_ACTIVE_VIEW);
            } else {
                localStorage.setItem(STORAGE_KEY_ACTIVE_VIEW, String(id));
            }
        }
        // Clear unsaved changes when switching views
        setUnsavedChanges({});
    }, []);

    // 2. Resolve Active View Object
    const activeView = useMemo(() => {
        if (!activeViewId || !customViews) return null;
        return customViews.find(v => v.id === activeViewId) || null;
    }, [activeViewId, customViews]);

    // 3. Unsaved Changes State
    const [unsavedChanges, setUnsavedChanges] = useState<Partial<TableConfig>>({});
    const [isSaving, setIsSaving] = useState(false);

    // 3b. View Metadata Changes (name, description, is_global)
    interface ViewMetadataChanges {
        name?: string;
        description?: string;
        is_global?: boolean;
    }
    const [unsavedMetadataChanges, setUnsavedMetadataChanges] = useState<ViewMetadataChanges>({});

    // 4. Compute Derived Table Config
    const tableConfig = useMemo((): TableConfig => {
        // Start with Default
        let base = { ...DEFAULT_CONFIG };

        // Overlay Active View Config
        if (activeView) {
            base = {
                ...base,
                columnOrder: normalizeColumnOrder(activeView.column_order || []),
                columnSizing: normalizeColumnSizing(activeView.column_sizing || {}),
                columnVisibility: normalizeColumnVisibility(activeView.column_visibility || {}),
                columnDisplayTypes: activeView.column_display_types || {},
                filterVisibility: activeView.filter_visibility || {},
                filterTypes: activeView.filter_types || {},
                editModeSettings: activeView.edit_mode_settings || {},
                columnSpanning: normalizeColumnSpanning(activeView.column_spanning || {}),
                subrowEnabled: activeView.subrow_enabled,
                subrowContent: activeView.subrow_content,
                // normalize sorting if needed, activeView usually has single sort_field
                sorting: activeView.sort_field ? [{ id: activeView.sort_field, desc: !!activeView.sort_reverse }] : [],
            };
        }

        // Overlay Unsaved Changes
        return {
            ...base,
            ...unsavedChanges,
            columnSizing: { ...base.columnSizing, ...(unsavedChanges.columnSizing || {}) },
            columnVisibility: { ...base.columnVisibility, ...(unsavedChanges.columnVisibility || {}) },
            columnDisplayTypes: { ...base.columnDisplayTypes, ...(unsavedChanges.columnDisplayTypes || {}) },
            filterVisibility: { ...base.filterVisibility, ...(unsavedChanges.filterVisibility || {}) },
            filterTypes: { ...base.filterTypes, ...(unsavedChanges.filterTypes || {}) },
            editModeSettings: { ...base.editModeSettings, ...(unsavedChanges.editModeSettings || {}) },
            columnSpanning: { ...base.columnSpanning, ...(unsavedChanges.columnSpanning || {}) },
        };
    }, [activeView, unsavedChanges]);

    // 5. Check if Dirty (table config OR metadata)
    const hasUnsavedChanges = useMemo(() => {
        return Object.keys(unsavedChanges).length > 0 || Object.keys(unsavedMetadataChanges).length > 0;
    }, [unsavedChanges, unsavedMetadataChanges]);

    // 5b. Computed View Metadata (active view + pending changes)
    const viewMetadata = useMemo(() => {
        return {
            name: unsavedMetadataChanges.name ?? activeView?.name ?? '',
            description: unsavedMetadataChanges.description ?? activeView?.description ?? '',
            is_global: unsavedMetadataChanges.is_global ?? activeView?.is_global ?? false,
        };
    }, [activeView, unsavedMetadataChanges]);


    // 6. Action Handlers
    const updateColumnOrder = useCallback((order: string[]) => {
        setUnsavedChanges(prev => ({ ...prev, columnOrder: order }));
    }, []);

    const updateColumnSizing = useCallback((sizing: Record<string, number>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            columnSizing: { ...(prev.columnSizing || {}), ...sizing }
        }));
    }, []);

    const updateColumnVisibility = useCallback((visibility: Record<string, boolean>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            columnVisibility: { ...(prev.columnVisibility || {}), ...visibility }
        }));
    }, []);

    const updateFilterVisibility = useCallback((visibility: Record<string, boolean>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            filterVisibility: { ...(prev.filterVisibility || {}), ...visibility }
        }));
    }, []);

    const updateFilterTypes = useCallback((types: Record<string, string>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            filterTypes: { ...(prev.filterTypes || {}), ...types }
        }));
    }, []);

    const updateEditModeSettings = useCallback((settings: Record<string, { enabled: boolean; entry_type?: string }>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            editModeSettings: { ...(prev.editModeSettings || {}), ...settings }
        }));
    }, []);

    const updateColumnSpanning = useCallback((spanning: Record<string, boolean>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            columnSpanning: { ...(prev.columnSpanning || {}), ...spanning }
        }));
    }, []);

    const updateSorting = useCallback((sorting: Array<{ id: string; desc: boolean }>) => {
        setUnsavedChanges(prev => ({ ...prev, sorting }));
    }, []);

    const updateColumnDisplayTypes = useCallback((displayTypes: Record<string, string>) => {
        setUnsavedChanges(prev => ({
            ...prev,
            columnDisplayTypes: { ...(prev.columnDisplayTypes || {}), ...displayTypes }
        }));
    }, []);

    // 6b. Metadata Update Handlers
    const updateViewName = useCallback((name: string) => {
        setUnsavedMetadataChanges(prev => ({ ...prev, name }));
    }, []);

    const updateViewDescription = useCallback((description: string) => {
        setUnsavedMetadataChanges(prev => ({ ...prev, description }));
    }, []);

    const updateViewIsGlobal = useCallback((is_global: boolean) => {
        setUnsavedMetadataChanges(prev => ({ ...prev, is_global }));
    }, []);


    // 7. Persistence Actions
    // Optional completeConfig parameter allows caller to pass pre-built config directly
    // (bypasses async state update issues when building complete config before save)
    const saveCurrentView = useCallback(async (completeConfig?: {
        columnOrder?: string[];
        columnSizing?: Record<string, number>;
        columnVisibility?: Record<string, boolean>;
        columnDisplayTypes?: Record<string, string>;
        filterVisibility?: Record<string, boolean>;
        filterTypes?: Record<string, string>;
        editModeSettings?: Record<string, { enabled: boolean; entry_type?: string }>;
        columnSpanning?: Record<string, boolean>;
        name?: string;
        description?: string;
        is_global?: boolean;
    }) => {
        if (!activeViewId || !activeView) return;

        setIsSaving(true);
        try {
            // Use provided completeConfig if available, otherwise use tableConfig from state
            const configToSave = completeConfig || tableConfig;
            const metadataToSave = completeConfig ? {
                name: completeConfig.name ?? viewMetadata.name,
                description: completeConfig.description ?? viewMetadata.description,
                is_global: completeConfig.is_global ?? viewMetadata.is_global
            } : viewMetadata;

            // Build payload with ALL configuration properties
            const payload: Partial<CustomView> = {
                // View metadata
                name: metadataToSave.name,
                description: metadataToSave.description || undefined,
                is_global: metadataToSave.is_global,
                // Column configuration
                column_order: configToSave.columnOrder,
                column_sizing: configToSave.columnSizing,
                column_visibility: configToSave.columnVisibility,
                column_display_types: configToSave.columnDisplayTypes as any,
                // Filter configuration
                filter_visibility: configToSave.filterVisibility,
                filter_types: configToSave.filterTypes,
                // Edit mode configuration
                edit_mode_settings: configToSave.editModeSettings,
                // Spanning configuration
                column_spanning: configToSave.columnSpanning,
                // Subrow configuration (from tableConfig if not in completeConfig)
                subrow_enabled: tableConfig.subrowEnabled,
                subrow_content: tableConfig.subrowContent,
            };

            if (tableConfig.sorting && tableConfig.sorting.length > 0) {
                payload.sort_field = tableConfig.sorting[0].id;
                payload.sort_reverse = tableConfig.sorting[0].desc;
            }

            await updateView({ id: activeViewId as number, data: payload });
            setUnsavedChanges({}); // Clear dirty state
            setUnsavedMetadataChanges({}); // Clear metadata dirty state
        } finally {
            setIsSaving(false);
        }
    }, [activeViewId, activeView, tableConfig, viewMetadata, updateView]);

    const createViewFromCurrent = useCallback(async (name: string) => {
        setIsSaving(true);
        try {
            const payload: Omit<CustomView, 'id'> = {
                name,
                column_order: tableConfig.columnOrder,
                column_sizing: tableConfig.columnSizing,
                column_visibility: tableConfig.columnVisibility,
                column_display_types: tableConfig.columnDisplayTypes as any,
                filter_visibility: tableConfig.filterVisibility,
                filter_types: tableConfig.filterTypes,
                edit_mode_settings: tableConfig.editModeSettings,
                column_spanning: tableConfig.columnSpanning,
                subrow_enabled: tableConfig.subrowEnabled,
                subrow_content: tableConfig.subrowContent,
            };
            if (tableConfig.sorting && tableConfig.sorting.length > 0) {
                payload.sort_field = tableConfig.sorting[0].id;
                payload.sort_reverse = tableConfig.sorting[0].desc;
            }

            const newView = await createView(payload);
            if (newView && newView.id) {
                setActiveViewId(newView.id);
            }
        } finally {
            setIsSaving(false);
        }
    }, [tableConfig, activeView, createView, setActiveViewId]);

    const discardChanges = useCallback(() => {
        setUnsavedChanges({});
        setUnsavedMetadataChanges({});
    }, []);

    return {
        activeViewId,
        activeView,
        availableViews: customViews || [],
        isLoadingViews,
        tableConfig,
        viewMetadata,
        unsavedChanges,
        hasUnsavedChanges,
        isSaving,
        setActiveViewId,
        updateColumnOrder,
        updateColumnSizing,
        updateColumnVisibility,
        updateFilterVisibility,
        updateFilterTypes,
        updateEditModeSettings,
        updateColumnSpanning,
        updateSorting,
        updateColumnDisplayTypes,
        updateViewName,
        updateViewDescription,
        updateViewIsGlobal,
        saveCurrentView,
        createViewFromCurrent,
        discardChanges
    };
}
