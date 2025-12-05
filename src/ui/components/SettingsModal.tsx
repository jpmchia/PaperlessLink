"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo, startTransition } from "react";
import { Dialog } from "./Dialog";
import { Button } from "./Button";
import { Tabs } from "./Tabs";
import { FeatherX } from "@subframe/core";
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
import { useCustomViews } from "@/lib/api/hooks/use-custom-views";
import { CustomView } from "@/app/data/custom-view";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { settings, getSettings, saveSettings, loading } = useSettings();
  const { data: customFieldsData, loading: customFieldsLoading } = useCustomFields();
  const {
    customViews,
    isLoading: customViewsLoading,
    error: customViewsError,
    create: createCustomView,
    update: updateCustomView,
    delete: deleteCustomView,
    isDeleting,
    isCreating,
    isUpdating,
    refetch: refetchCustomViews,
  } = useCustomViews();
  
  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [tabsList, setTabsList] = useState<string[]>(['Default']);
  const [newTabInput, setNewTabInput] = useState<Record<number, string>>({});
  
  // Custom View state - support both saved views (with IDs) and local draft views (temporary)
  const [selectedViewId, setSelectedViewId] = useState<number | string | null>(null);
  const [localDraftViews, setLocalDraftViews] = useState<Map<string | number, CustomView>>(new Map());
  // Track original state of selected view for revert functionality
  const [originalViewState, setOriginalViewState] = useState<CustomView | null>(null);
  const [isSavingView, setIsSavingView] = useState(false);
  
  // Combined list of all views (saved + drafts)
  // Local drafts take precedence over saved views with the same ID
  // Use refs to track previous values and state to trigger re-renders only when content changes
  const localDraftViewsArrayRef = useRef<CustomView[]>([]);
  const prevCustomViewsKeyRef = useRef<string>('');
  const prevLocalDraftViewsKeyRef = useRef<string>('');
  const [localDraftViewsKey, setLocalDraftViewsKey] = useState<string>('');
  const [customViewsKey, setCustomViewsKey] = useState<string>('');
  
  // Update state only when content actually changes (using refs to track previous values)
  useEffect(() => {
    const newCustomViewsKey = JSON.stringify(customViews.map(v => ({ id: v.id, name: v.name })));
    if (newCustomViewsKey !== prevCustomViewsKeyRef.current) {
      prevCustomViewsKeyRef.current = newCustomViewsKey;
      setCustomViewsKey(newCustomViewsKey);
    }
  }, [customViews]);
  
  useEffect(() => {
    const draftsArray = Array.from(localDraftViews.values());
    // Include content that matters for view rendering (column_visibility, column_display_types, etc.)
    // This ensures the key changes when view content changes, triggering allViews recalculation
    const newDraftsKey = `${localDraftViews.size}:${JSON.stringify(draftsArray.map(v => ({ 
      id: v.id, 
      name: v.name,
      column_order: v.column_order,
      column_visibility: v.column_visibility,
      column_display_types: v.column_display_types,
      column_sizing: v.column_sizing,
    })))}`;
    if (newDraftsKey !== prevLocalDraftViewsKeyRef.current) {
      prevLocalDraftViewsKeyRef.current = newDraftsKey;
      localDraftViewsArrayRef.current = draftsArray;
      setLocalDraftViewsKey(newDraftsKey);
    }
  }, [localDraftViews]);
  
  const allViews = useMemo(() => {
    // Always read directly from localDraftViews to ensure we have the latest data
    // The ref is updated synchronously in handleUpdateView, but reading directly ensures
    // we get the latest state even if React batches updates
    const draftsArray = Array.from(localDraftViews.values());
    
    const draftIds = new Set(draftsArray.map(v => v.id).filter(Boolean));
    const savedViewsFiltered = customViews.filter(v => {
      // Exclude saved views if we have a local draft for them
      if (v.id && draftIds.has(v.id)) {
        return false;
      }
      return true;
    });
    // Put local drafts first so they take precedence in find operations
    return [...draftsArray, ...savedViewsFiltered];
    // Depend on localDraftViewsKey to trigger recalculation when drafts change
    // Also include localDraftViews.size as a dependency to catch immediate updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customViewsKey, localDraftViewsKey, customViews, localDraftViews.size]);
  
  // Track previous values to prevent infinite loops
  const prevAllViewsLengthRef = useRef(0);
  const prevCustomViewsLoadingRef = useRef(customViewsLoading);
  
  // Auto-select first view if none selected and views are loaded
  useEffect(() => {
    const allViewsLength = allViews.length;
    const allViewsLengthChanged = allViewsLength !== prevAllViewsLengthRef.current;
    const loadingChanged = customViewsLoading !== prevCustomViewsLoadingRef.current;
    
    prevAllViewsLengthRef.current = allViewsLength;
    prevCustomViewsLoadingRef.current = customViewsLoading;
    
    // Only run if loading state changed or allViews actually changed (new views added/removed)
    if ((loadingChanged || allViewsLengthChanged) && !customViewsLoading && allViewsLength > 0 && selectedViewId === null && open) {
      // Prefer saved views over drafts
      const savedView = customViews.find(v => v.id && typeof v.id === 'number');
      if (savedView && savedView.id) {
        setSelectedViewId(savedView.id);
      } else {
        // Fall back to first available view (including drafts)
        const firstView = allViews[0];
        if (firstView && firstView.id) {
          setSelectedViewId(firstView.id);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customViewsLoading, allViews, selectedViewId, open, customViews]);
  
  // Track the view ID for which we've set the original state
  const originalViewIdRef = useRef<number | string | null>(null);
  const manuallySetOriginalStateRef = useRef<number | string | null>(null);
  
  // Track original state when view is selected (only when view ID changes, not when view content changes)
  useEffect(() => {
    // Only set original state if the view ID has changed
    if (selectedViewId !== originalViewIdRef.current) {
      originalViewIdRef.current = selectedViewId;
      
      // If we manually set originalViewState (e.g., when creating a draft), don't overwrite it
      if (manuallySetOriginalStateRef.current === selectedViewId) {
        manuallySetOriginalStateRef.current = null; // Clear the flag after first use
        return;
      }
      
      if (selectedViewId) {
        const currentView = allViews.find(v => {
          if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
            return v.id === selectedViewId;
          }
          if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
            return v.id === selectedViewId;
          }
          return false;
        });
        
        if (currentView) {
          // Deep clone the view to track original state
          setOriginalViewState({
            ...currentView,
            column_order: currentView.column_order ? [...currentView.column_order] : [],
            column_sizing: currentView.column_sizing ? { ...currentView.column_sizing } : {},
            column_visibility: currentView.column_visibility ? { ...currentView.column_visibility } : {},
            column_display_types: currentView.column_display_types ? { ...currentView.column_display_types } : {},
          });
        } else {
          // View not found yet - set to null for now
          setOriginalViewState(null);
        }
      } else {
        setOriginalViewState(null);
      }
    }
    // Only depend on selectedViewId - we read from allViews but don't want to re-run when it changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedViewId]);
  
  // Separate effect to capture original state when allViews becomes available after view selection
  // This handles the case where selectedViewId is set before allViews is ready
  const hasSetOriginalStateRef = useRef(false);
  const prevAllViewsRef = useRef<string>('');
  
  // Reset the flag when selectedViewId changes
  useEffect(() => {
    hasSetOriginalStateRef.current = false;
    prevAllViewsRef.current = '';
  }, [selectedViewId]);
  
  useEffect(() => {
    // Create a stable key from allViews to detect actual changes
    const allViewsKey = allViews.map(v => `${v.id || ''}:${v.name || ''}`).join(',');
    const allViewsChanged = allViewsKey !== prevAllViewsRef.current;
    prevAllViewsRef.current = allViewsKey;
    
    // Only try to set original state if:
    // 1. We have a selected view
    // 2. The view ID matches what we're tracking
    // 3. We haven't set it yet (using ref to avoid dependency on originalViewState)
    // 4. allViews has items and actually changed (to prevent loops)
    if (selectedViewId && 
        selectedViewId === originalViewIdRef.current && 
        !hasSetOriginalStateRef.current && 
        allViews.length > 0 &&
        allViewsChanged) {
      const currentView = allViews.find(v => {
        if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
          return v.id === selectedViewId;
        }
        if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
          return v.id === selectedViewId;
        }
        return false;
      });
      
      if (currentView) {
        hasSetOriginalStateRef.current = true;
        setOriginalViewState({
          ...currentView,
          column_order: currentView.column_order ? [...currentView.column_order] : [],
          column_sizing: currentView.column_sizing ? { ...currentView.column_sizing } : {},
          column_visibility: currentView.column_visibility ? { ...currentView.column_visibility } : {},
          column_display_types: currentView.column_display_types ? { ...currentView.column_display_types } : {},
        });
      }
    }
    // Only depend on allViews and selectedViewId - not originalViewState to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allViews, selectedViewId]);
  
  // Persist selected view ID to localStorage
  useEffect(() => {
    if (selectedViewId && typeof window !== 'undefined') {
      localStorage.setItem('lastSelectedCustomViewId', String(selectedViewId));
    }
  }, [selectedViewId]);
  
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
      
      // Refetch custom views to ensure we have the latest
      refetchCustomViews();
      
      // Restore last selected view from localStorage
      if (typeof window !== 'undefined') {
        const lastSelectedViewId = localStorage.getItem('lastSelectedCustomViewId');
        if (lastSelectedViewId) {
          try {
            // Try to parse as number first (saved view)
            const numId = parseInt(lastSelectedViewId, 10);
            if (!isNaN(numId)) {
              setSelectedViewId(numId);
            } else {
              // Otherwise it's a string ID (draft)
              setSelectedViewId(lastSelectedViewId);
            }
          } catch (e) {
            // Invalid ID, ignore
          }
        }
      }
    } else if (!isNowOpen && prevOpenRef.current) {
      // Modal just closed - reset formData and clear local drafts
      setFormData({});
      setLocalDraftViews(new Map());
      
      // Dispatch event to notify that custom views may have been updated
      // This allows DocumentsCustomView to refetch and re-apply the selected view
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('customViewsUpdated'));
        localStorage.setItem('customViewsUpdated', Date.now().toString());
      }
    }
    
    prevOpenRef.current = open;
  }, [open, settings?.settings, refetchCustomViews]); // Track open state changes and settings availability

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

  const updateSetting = useCallback((key: string, value: any) => {
    // Use startTransition to mark this as a non-urgent update
    // This prevents blocking the UI and causing Popper to recalculate continuously
    startTransition(() => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    });
  }, []);

  // Don't memoize getSetting - it's recreated anyway when formData changes
  // Memoizing it causes issues because the function reference changes on every formData update
  const getSetting = (key: string, defaultValue: any = null) => {
    return formData[key] ?? defaultValue;
  };

  // Custom View handlers
  const handleSaveView = async (viewData: Omit<CustomView, 'id'>) => {
    // Create a local draft view first (no API call needed)
    const tempId = `draft-${Date.now()}`;
    const draftView: CustomView = {
      ...viewData,
      id: tempId as any, // Temporary ID for local drafts
    };
    
    // Store in local state
    setLocalDraftViews(prev => {
      const updated = new Map(prev);
      updated.set(tempId, draftView);
      return updated;
    });
    
    // Update ref and key immediately so allViews can access the new draft right away
    // This ensures selectedView is found immediately
    const updatedMap = new Map(localDraftViews);
    updatedMap.set(tempId, draftView);
    const draftsArray = Array.from(updatedMap.values());
    localDraftViewsArrayRef.current = draftsArray;
    const newDraftsKey = `${updatedMap.size}:${JSON.stringify(draftsArray.map(v => ({ 
      id: v.id, 
      name: v.name,
      column_order: v.column_order,
      column_visibility: v.column_visibility,
      column_display_types: v.column_display_types,
      column_sizing: v.column_sizing,
    })))}`;
    prevLocalDraftViewsKeyRef.current = newDraftsKey;
    setLocalDraftViewsKey(newDraftsKey);
    
    // Set original state immediately for the new draft
    // Mark that we're manually setting it so the effect doesn't overwrite it
    manuallySetOriginalStateRef.current = tempId;
    setOriginalViewState({
      ...draftView,
      column_order: draftView.column_order ? [...draftView.column_order] : [],
      column_sizing: draftView.column_sizing ? { ...draftView.column_sizing } : {},
      column_visibility: draftView.column_visibility ? { ...draftView.column_visibility } : {},
      column_display_types: draftView.column_display_types ? { ...draftView.column_display_types } : {},
    });
    
    // Select the new draft view
    setSelectedViewId(tempId);
    
    // Optionally try to persist to API (if available) - but don't block on it
    try {
      const persistedView = await createCustomView(viewData);
      if (persistedView.id) {
        // Remove the draft from local state first
        setLocalDraftViews(prev => {
          const updated = new Map(prev);
          updated.delete(tempId);
          return updated;
        });
        
        // Update ref and key after removing draft
        const updatedMap = new Map(localDraftViews);
        updatedMap.delete(tempId);
        const draftsArray = Array.from(updatedMap.values());
        localDraftViewsArrayRef.current = draftsArray;
        const newDraftsKey = `${updatedMap.size}:${JSON.stringify(draftsArray.map(v => ({ 
          id: v.id, 
          name: v.name,
          column_order: v.column_order,
          column_visibility: v.column_visibility,
          column_display_types: v.column_display_types,
          column_sizing: v.column_sizing,
        })))}`;
        prevLocalDraftViewsKeyRef.current = newDraftsKey;
        setLocalDraftViewsKey(newDraftsKey);
        
        // Refetch views from API to get the complete list (including the newly created view)
        const refetchResult = await refetchCustomViews();
        
        // Find the persisted view in the refetched data
        // refetchResult.data is the array returned from the queryFn
        const refetchedData = refetchResult.data as CustomView[] | undefined;
        const refetchedView = refetchedData?.find((v: CustomView) => v.id === persistedView.id);
        const viewToUse = refetchedView || persistedView;
        
        // Update original state to the persisted view before changing selectedViewId
        manuallySetOriginalStateRef.current = viewToUse.id!;
        setOriginalViewState({
          ...viewToUse,
          column_order: viewToUse.column_order ? [...viewToUse.column_order] : [],
          column_sizing: viewToUse.column_sizing ? { ...viewToUse.column_sizing } : {},
          column_visibility: viewToUse.column_visibility ? { ...viewToUse.column_visibility } : {},
          column_display_types: viewToUse.column_display_types ? { ...viewToUse.column_display_types } : {},
        });
        setSelectedViewId(viewToUse.id!);
        // TODO: Show success toast
      }
    } catch (error: any) {
      // API not available or failed - that's OK, we'll keep using the local draft
      if (error?.message?.includes('API endpoint is not available')) {
        console.warn("Custom views API not available - using local draft:", error);
      } else {
        console.warn("Could not persist view to API (using local draft):", error);
      }
      // Don't throw - the local draft is still usable
    }
  };

  const handleUpdateView = async (id: number | string, viewData: Partial<CustomView>) => {
    // Always update local state first (both drafts and saved views)
    // This allows us to track changes locally and only persist on Save
    if (typeof id === 'string' && id.startsWith('draft-')) {
      // Update local draft - compute the merged view first
      const existing = localDraftViews.get(id);
      if (existing) {
        // Deep merge the update
        const merged = {
          ...existing,
          ...viewData,
          column_order: viewData.column_order !== undefined ? viewData.column_order : existing.column_order,
          column_sizing: viewData.column_sizing !== undefined 
            ? { ...existing.column_sizing, ...viewData.column_sizing }
            : existing.column_sizing,
          column_visibility: viewData.column_visibility !== undefined
            ? { ...existing.column_visibility, ...viewData.column_visibility }
            : existing.column_visibility,
          column_display_types: viewData.column_display_types !== undefined
            ? { ...existing.column_display_types, ...viewData.column_display_types }
            : existing.column_display_types,
        };
        
        // Update state
        setLocalDraftViews(prev => {
          const updated = new Map(prev);
          updated.set(id, merged);
          return updated;
        });
        
        // Update ref and key immediately BEFORE state update completes
        // This ensures allViews reads the latest data immediately
        const updatedMap = new Map(localDraftViews);
        updatedMap.set(id, merged);
        const draftsArray = Array.from(updatedMap.values());
        localDraftViewsArrayRef.current = draftsArray;
        // Include content that matters to ensure key changes when view content changes
        const newDraftsKey = `${updatedMap.size}:${JSON.stringify(draftsArray.map(v => ({ 
          id: v.id, 
          name: v.name,
          column_order: v.column_order,
          column_visibility: v.column_visibility,
          column_display_types: v.column_display_types,
          column_sizing: v.column_sizing,
        })))}`;
        prevLocalDraftViewsKeyRef.current = newDraftsKey;
        setLocalDraftViewsKey(newDraftsKey);
      }
    } else {
      // For saved views, also update in local draft state for editing
      // Check if we have a local draft for this saved view
      const existingDraft = localDraftViews.get(id);
      if (existingDraft) {
        // Compute merged view first
        const merged = {
          ...existingDraft,
          ...viewData,
          column_order: viewData.column_order !== undefined ? viewData.column_order : existingDraft.column_order,
          column_sizing: viewData.column_sizing !== undefined 
            ? { ...existingDraft.column_sizing, ...viewData.column_sizing }
            : existingDraft.column_sizing,
          column_visibility: viewData.column_visibility !== undefined
            ? { ...existingDraft.column_visibility, ...viewData.column_visibility }
            : existingDraft.column_visibility,
          column_display_types: viewData.column_display_types !== undefined
            ? { ...existingDraft.column_display_types, ...viewData.column_display_types }
            : existingDraft.column_display_types,
        };
        
        // Update state
        setLocalDraftViews(prev => {
          const updated = new Map(prev);
          updated.set(id, merged);
          return updated;
        });
        
        // Update ref and key immediately BEFORE state update completes
        const updatedMap = new Map(localDraftViews);
        updatedMap.set(id, merged);
        const draftsArray = Array.from(updatedMap.values());
        localDraftViewsArrayRef.current = draftsArray;
        const newDraftsKey = `${updatedMap.size}:${JSON.stringify(draftsArray.map(v => ({ 
          id: v.id, 
          name: v.name,
          column_order: v.column_order,
          column_visibility: v.column_visibility,
          column_display_types: v.column_display_types,
          column_sizing: v.column_sizing,
        })))}`;
        prevLocalDraftViewsKeyRef.current = newDraftsKey;
        setLocalDraftViewsKey(newDraftsKey);
      } else {
        // Create a local draft copy for editing
        const savedView = customViews.find(v => v.id === id);
        if (savedView) {
          setLocalDraftViews(prev => {
            const updated = new Map(prev);
            const merged = {
              ...savedView,
              ...viewData,
              column_order: viewData.column_order !== undefined ? viewData.column_order : savedView.column_order,
              column_sizing: viewData.column_sizing !== undefined 
                ? { ...savedView.column_sizing, ...viewData.column_sizing }
                : savedView.column_sizing,
              column_visibility: viewData.column_visibility !== undefined
                ? { ...savedView.column_visibility, ...viewData.column_visibility }
                : savedView.column_visibility,
              column_display_types: viewData.column_display_types !== undefined
                ? { ...savedView.column_display_types, ...viewData.column_display_types }
                : savedView.column_display_types,
            };
            updated.set(id, merged);
            
            // Update ref and key immediately so allViews recalculates
            const draftsArray = Array.from(updated.values());
            localDraftViewsArrayRef.current = draftsArray;
            const newDraftsKey = `${updated.size}:${JSON.stringify(draftsArray.map(v => ({ 
              id: v.id, 
              name: v.name,
              column_order: v.column_order,
              column_visibility: v.column_visibility,
              column_display_types: v.column_display_types,
              column_sizing: v.column_sizing,
            })))}`;
            prevLocalDraftViewsKeyRef.current = newDraftsKey;
            setLocalDraftViewsKey(newDraftsKey);
            
            return updated;
          });
        }
      }
    }
    // Note: We don't persist to API here - that happens when Save is clicked
  };
  
  // Save current view changes to backend
  const handleSaveViewChanges = useCallback(async () => {
    if (!selectedViewId || !originalViewState) return;
    
    const currentView = allViews.find(v => {
      if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
        return v.id === selectedViewId;
      }
      if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
        return v.id === selectedViewId;
      }
      return false;
    });
    
    if (!currentView) return;
    
    // Check if this is a draft (new view)
    if (typeof selectedViewId === 'string' && selectedViewId.startsWith('draft-')) {
      try {
        setIsSavingView(true);
        const persistedView = await createCustomView({
          name: currentView.name,
          description: currentView.description,
          column_order: currentView.column_order || [],
          column_sizing: currentView.column_sizing || {},
          column_visibility: currentView.column_visibility || {},
          column_display_types: currentView.column_display_types || {},
          filter_rules: currentView.filter_rules || [],
          filter_visibility: currentView.filter_visibility || {},
          is_global: currentView.is_global,
        });
        
        if (persistedView.id) {
          // Replace draft with persisted view
          setLocalDraftViews(prev => {
            const updated = new Map(prev);
            updated.delete(selectedViewId);
            updated.set(persistedView.id!, persistedView);
            return updated;
          });
          setSelectedViewId(persistedView.id);
          // Update original state to the persisted view
          setOriginalViewState({
            ...persistedView,
            column_order: persistedView.column_order ? [...persistedView.column_order] : [],
            column_sizing: persistedView.column_sizing ? { ...persistedView.column_sizing } : {},
            column_visibility: persistedView.column_visibility ? { ...persistedView.column_visibility } : {},
            column_display_types: persistedView.column_display_types ? { ...persistedView.column_display_types } : {},
          });
          await refetchCustomViews();
        }
      } catch (error: any) {
        console.error("Failed to save view:", error);
        // If API is not available, keep the local draft - don't throw
        // The user can still use the draft locally
        if (error?.message?.includes('API endpoint is not available')) {
          console.warn("Custom views API not available - keeping local draft");
          // TODO: Show user-friendly toast notification
          return; // Exit early - draft remains local
        }
        // For other errors, still throw to show error to user
        throw error;
      } finally {
        setIsSavingView(false);
      }
    } else if (typeof selectedViewId === 'number') {
      // Update existing saved view
      try {
        setIsSavingView(true);
        await updateCustomView({
          id: selectedViewId,
          data: {
            column_order: currentView.column_order,
            column_sizing: currentView.column_sizing,
            column_visibility: currentView.column_visibility,
            column_display_types: currentView.column_display_types,
          },
        });
        
        // Update original state to current state
        setOriginalViewState({
          ...currentView,
          column_order: currentView.column_order ? [...currentView.column_order] : [],
          column_sizing: currentView.column_sizing ? { ...currentView.column_sizing } : {},
          column_visibility: currentView.column_visibility ? { ...currentView.column_visibility } : {},
          column_display_types: currentView.column_display_types ? { ...currentView.column_display_types } : {},
        });
        
        // Remove local draft if it exists (changes are now saved)
        setLocalDraftViews(prev => {
          const updated = new Map(prev);
          updated.delete(selectedViewId);
          return updated;
        });
        
        await refetchCustomViews();
      } catch (error: any) {
        console.error("Failed to save view:", error);
        // If API is not available, keep the local draft - don't throw
        if (error?.message?.includes('API endpoint is not available')) {
          console.warn("Custom views API not available - changes remain local");
          // TODO: Show user-friendly toast notification
          return; // Exit early - changes remain in local draft
        }
        // For other errors, still throw to show error to user
        throw error;
      } finally {
        setIsSavingView(false);
      }
    }
  }, [selectedViewId, originalViewState, allViews, createCustomView, updateCustomView, refetchCustomViews]);
  
  // Revert view to original state
  const handleRevertViewChanges = useCallback(async () => {
    if (!selectedViewId || !originalViewState) return;
    
    // Restore original state
    if (typeof selectedViewId === 'string' && selectedViewId.startsWith('draft-')) {
      setLocalDraftViews(prev => {
        const updated = new Map(prev);
        updated.set(selectedViewId, {
          ...originalViewState,
          id: selectedViewId,
        } as unknown as CustomView);
        return updated;
      });
    } else if (typeof selectedViewId === 'number') {
      // Clear local draft to revert to saved state
      setLocalDraftViews(prev => {
        const updated = new Map(prev);
        updated.delete(selectedViewId);
        return updated;
      });
      // Refetch to get fresh data from backend
      await refetchCustomViews();
      // Update original state to match the reverted view after refetch
      // This will happen automatically via the effect that tracks originalViewState
    }
  }, [selectedViewId, originalViewState, refetchCustomViews]);
  
  // Check if there are unsaved changes
  const hasUnsavedViewChanges = useMemo(() => {
    if (!selectedViewId || !originalViewState) return false;
    
    const currentView = allViews.find(v => {
      if (typeof selectedViewId === 'number' && typeof v.id === 'number') {
        return v.id === selectedViewId;
      }
      if (typeof selectedViewId === 'string' && typeof v.id === 'string') {
        return v.id === selectedViewId;
      }
      return false;
    });
    
    if (!currentView) return false;
    
    // Compare current view with original
    const compareArrays = (a: any[] | undefined, b: any[] | undefined): boolean => {
      const arrA = a || [];
      const arrB = b || [];
      if (arrA.length !== arrB.length) return true;
      return arrA.some((val, idx) => val !== arrB[idx]);
    };
    
    const compareObjects = (a: Record<string, any> | undefined, b: Record<string, any> | undefined): boolean => {
      const objA = a || {};
      const objB = b || {};
      const keysA = Object.keys(objA);
      const keysB = Object.keys(objB);
      if (keysA.length !== keysB.length) return true;
      // Check all keys in both objects
      const allKeys = new Set([...keysA, ...keysB]);
      return Array.from(allKeys).some(key => {
        const valA = objA[key];
        const valB = objB[key];
        // Handle nested objects/arrays
        if (typeof valA === 'object' && typeof valB === 'object' && valA !== null && valB !== null) {
          return JSON.stringify(valA) !== JSON.stringify(valB);
        }
        return valA !== valB;
      });
    };
    
    if (compareArrays(currentView.column_order, originalViewState.column_order)) return true;
    if (compareObjects(currentView.column_sizing, originalViewState.column_sizing)) return true;
    if (compareObjects(currentView.column_visibility, originalViewState.column_visibility)) return true;
    if (compareObjects(currentView.column_display_types, originalViewState.column_display_types)) return true;
    
    return false;
  }, [selectedViewId, originalViewState, allViews]);

  const handleDeleteView = async (id: number | string) => {
    // Handle local draft deletion
    if (typeof id === 'string' && id.startsWith('draft-')) {
      setLocalDraftViews(prev => {
        const updated = new Map(prev);
        updated.delete(id);
        return updated;
      });
      if (selectedViewId === id) {
        setSelectedViewId(null);
      }
      return;
    }
    
    // Handle saved view deletion via API
    try {
      await deleteCustomView(id as number);
      if (selectedViewId === id) {
        setSelectedViewId(null);
      }
      // TODO: Show success toast
    } catch (error) {
      console.error("Failed to delete custom view:", error);
      // TODO: Show error toast
      throw error;
    }
  };

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
              Custom Views
            </Tabs.Item>
          </Tabs>

          {/* Tab Content */}
          <div className="flex flex-col gap-4 w-full mt-4 flex-1 min-h-0 overflow-hidden">
            {activeTab === "general" && (
              <GeneralSettingsTab
                getSetting={getSetting}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "appearance" && (
              <AppearanceTab
                getSetting={getSetting}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "documents" && (
              <DocumentsTab
                getSetting={getSetting}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "notifications" && (
              <NotificationsTab
                getSetting={getSetting}
                updateSetting={updateSetting}
              />
            )}

            {activeTab === "custom-fields" && (
              <CustomFieldsTab
                customFields={customFields}
                customFieldsLoading={customFieldsLoading}
                getSetting={getSetting}
                updateSetting={updateSetting}
                tabsList={tabsList}
                newTabInput={newTabInput}
                setNewTabInput={setNewTabInput}
                handleAddTab={handleAddTab}
                customViews={allViews}
                customViewsLoading={customViewsLoading}
                customViewsError={customViewsError as Error | null}
                selectedViewId={selectedViewId}
                onSelectView={setSelectedViewId}
                onSaveView={handleSaveView}
                onUpdateView={handleUpdateView}
                onDeleteView={handleDeleteView}
                isSavingView={isSavingView || isCreating || isUpdating}
                onSaveViewChanges={handleSaveViewChanges}
                onRevertViewChanges={handleRevertViewChanges}
                hasUnsavedViewChanges={hasUnsavedViewChanges}
              />
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

