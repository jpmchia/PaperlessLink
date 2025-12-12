"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { CustomView } from "@/app/data/custom-view";
import { useActiveView } from "./hooks/useActiveView";

/**
 * TableConfig represents the resolved configuration for the table.
 * It is derived from the Active View + Unsaved Changes.
 */
export interface TableConfig {
    columnOrder: string[];
    columnSizing: Record<string, number>;
    columnVisibility: Record<string, boolean>;
    columnDisplayTypes: Record<string, string>;
    filterVisibility: Record<string, boolean>;
    filterTypes?: Record<string, string>; // Configuration for filter types
    editModeSettings?: Record<string, { enabled: boolean; entry_type?: string }>; // Edit mode config
    columnSpanning: Record<string, boolean>;
    subrowEnabled?: boolean;
    subrowContent?: 'summary' | 'tags' | 'none';
    sorting?: Array<{ id: string; desc: boolean }>;
    columnStyles: Record<string, string>;
}

export interface DocumentsContextType {
    // View State
    activeViewId: number | string | null; // null = Default View
    activeView: CustomView | null;
    availableViews: CustomView[];
    isLoadingViews: boolean;

    // Table Configuration (Merged)
    tableConfig: TableConfig;

    // View Metadata (Merged: active view + pending changes)
    viewMetadata: {
        name: string;
        description: string;
        is_global: boolean;
    };

    // Draft / Dirty State
    unsavedChanges: Partial<TableConfig>;
    hasUnsavedChanges: boolean;
    isSaving: boolean;

    // Actions
    setActiveViewId: (id: number | string | null) => void;
    updateColumnOrder: (order: string[]) => void;
    updateColumnSizing: (sizing: Record<string, number>) => void;
    updateColumnVisibility: (visibility: Record<string, boolean>) => void;
    updateFilterVisibility: (visibility: Record<string, boolean>) => void;
    updateFilterTypes: (types: Record<string, string>) => void; // New updater
    updateEditModeSettings: (settings: Record<string, { enabled: boolean; entry_type?: string }>) => void; // New updater
    updateColumnSpanning: (spanning: Record<string, boolean>) => void;
    updateSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;
    updateColumnDisplayTypes: (displayTypes: Record<string, string>) => void;
    updateColumnStyles: (styles: Record<string, string>) => void;

    // Metadata Actions
    updateViewName: (name: string) => void;
    updateViewDescription: (description: string) => void;
    updateViewIsGlobal: (is_global: boolean) => void;

    // Persistence
    saveCurrentView: (completeConfig?: {
        columnOrder?: string[];
        columnSizing?: Record<string, number>;
        columnVisibility?: Record<string, boolean>;
        columnDisplayTypes?: Record<string, string>;
        filterVisibility?: Record<string, boolean>;
        filterTypes?: Record<string, string>;
        editModeSettings?: Record<string, { enabled: boolean; entry_type?: string }>;
        columnSpanning?: Record<string, boolean>;
        columnStyles?: Record<string, string>;
        name?: string;
        description?: string;
        is_global?: boolean;
    }) => Promise<void>;
    createViewFromCurrent: (name: string) => Promise<void>;
    discardChanges: () => void;
}

const DocumentsContext = createContext<DocumentsContextType | null>(null);

export function useDocumentsContext() {
    const context = useContext(DocumentsContext);
    if (!context) {
        throw new Error("useDocumentsContext must be used within a DocumentsProvider");
    }
    return context;
}

interface DocumentsProviderProps {
    children: ReactNode;
}

export const DocumentsProvider: React.FC<DocumentsProviderProps> = ({ children }) => {
    const activeViewLogic = useActiveView();

    return (
        <DocumentsContext.Provider value={activeViewLogic}>
            {children}
        </DocumentsContext.Provider>
    );
};

export { DocumentsContext };
